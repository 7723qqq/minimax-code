import { accessSync, constants, existsSync, readFileSync, realpathSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import spawn from 'cross-spawn';
import { parseMcodeVersion } from './release.js';
import { tuiUpdateText } from './copy.js';
import type { McodeUpdateOperationOptions } from './progress.js';

/**
 * Locate `npm-cli.js` for npm-based update flows and run it with the current
 * runtime.
 *
 * Spawning an npm shim (`npm.cmd` on Windows) is not portable across runtimes:
 * Node refuses `.cmd` without a shell, and Bun cannot execute `.cmd` shims
 * reliably. The npm CLI is plain JavaScript, and the running runtime (Bun in a
 * packaged CLI, Node in development) executes it directly, so every fallback
 * npm invocation in the update flows goes through
 * `[runtime, npmCli, …]` instead of a shim.
 */
export function resolveNpmCliInvocation(): { runtime: string; npmCli: string } {
  const besideRuntime = path.join(
    path.dirname(process.execPath),
    'node_modules',
    'npm',
    'bin',
    'npm-cli.js',
  );
  if (existsSync(besideRuntime)) return { runtime: process.execPath, npmCli: besideRuntime };
  const finder = process.platform === 'win32' ? 'where' : 'which';
  const shimName = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const shim = execFileSync(finder, [shimName], { encoding: 'utf8' })
    .trim()
    .split(/\r?\n/u)[0];
  if (shim) {
    const besideShim = path.join(
      path.dirname(realpathSync(shim)),
      'node_modules',
      'npm',
      'bin',
      'npm-cli.js',
    );
    if (existsSync(besideShim)) return { runtime: process.execPath, npmCli: besideShim };
  }
  throw new Error('npm-cli.js could not be located for the npm-based update flows');
}

export const MCODE_INTERNAL_NPM_REGISTRY = 'https://npmmirror.example.invalid/';
export const MCODE_PUBLIC_NPM_REGISTRY = 'https://registry.npmjs.org/';
export const MCODE_PUBLIC_NPM_MIRROR_REGISTRY = 'https://registry.npmmirror.com/';
const REGISTRY_FETCH_TIMEOUT_MS = 30_000;
const MCODE_PACKAGE_BASENAME = 'code';
const MCODE_INTERNAL_SCOPE = '@minimax';
const MCODE_PUBLIC_SCOPE = '@minimax-ai';
// Public packaging rewrites this marker together with the bundled package identity.
const MCODE_EMBEDDED_PACKAGE_NAME = '@minimax-ai/code' as McodeNpmPackageName;

export type McodeNpmDistTag = 'latest' | 'test' | 'preview';
export type McodeNpmPackageName = '@minimax/code' | '@minimax-ai/code';
type TuiBuildEnvironment = 'test' | 'staging' | 'prod';

declare const __TUI_BUILD_ENV__: TuiBuildEnvironment | undefined;
declare const __TUI_NPM_DIST_TAG__: McodeNpmDistTag | undefined;

export type McodePackageManagerInstallSource =
  'npm-global' | 'npm-prefix' | 'pnpm-global' | 'yarn-global' | 'bun-global';

export type McodeInstallSource =
  'managed-installer' | McodePackageManagerInstallSource | 'unsupported';

export interface McodePackageManagerCommand {
  readonly executable: string;
  readonly args: readonly string[];
  readonly display: string;
}

export interface McodeNpmPrefixInstall {
  readonly executable: string;
  readonly packageName: McodeNpmPackageName;
  readonly prefix: string;
  readonly registry: string;
  /**
   * Node executable pinned by the install receipt. `process.execPath` resolves
   * Homebrew's stable bin/node symlink into a versioned Cellar path that
   * `brew upgrade` removes, so updates reuse the recorded path when present.
   */
  readonly nodeExecutable?: string;
}

export type McodePackageManagerRunOptions = McodeUpdateOperationOptions;

export interface McodeNpmDistribution {
  readonly packageName: McodeNpmPackageName;
  readonly registry: string;
}

export interface ResolveLatestMcodeRegistryVersionDependencies {
  readonly platform: NodeJS.Platform;
  readonly run: (command: string, args: readonly string[]) => Promise<string>;
  readonly distribution: McodeNpmDistribution;
  readonly npmExecutable: string;
  readonly environment: NodeJS.ProcessEnv;
  readonly runtimeExecutable: string;
}

export interface DetectMcodeInstallSourceDependencies {
  readonly installRoot: string;
  readonly platform: NodeJS.Platform;
  readonly packageRoot: () => string | undefined;
  readonly npmGlobalPrefix: () => Promise<string>;
  readonly managedInstall: (installRoot: string) => boolean;
  readonly prefixInstall: () => McodeNpmPrefixInstall | undefined;
}

export function isManagedMcodeInstallRoot(installRoot: string): boolean {
  const metadataFile = path.join(installRoot, 'install.json');
  try {
    const metadata = JSON.parse(readFileSync(metadataFile, 'utf8')) as Record<string, unknown>;
    return metadata.product === 'minimax-code' && metadata.updateOwner === 'mcode-installer';
  } catch {
    return false;
  }
}

export async function detectMcodeInstallSource(
  dependencies: Partial<DetectMcodeInstallSourceDependencies> & { installRoot: string },
): Promise<McodeInstallSource> {
  const platform = dependencies.platform ?? process.platform;
  const resolved: DetectMcodeInstallSourceDependencies = {
    installRoot: dependencies.installRoot,
    platform,
    packageRoot: dependencies.packageRoot ?? resolveMcodePackageRoot,
    npmGlobalPrefix:
      dependencies.npmGlobalPrefix ??
      (async () => {
        const { runtime, npmCli } = resolveNpmCliInvocation();
        return runText(runtime, [npmCli, 'prefix', '--global']);
      }),
    managedInstall: dependencies.managedInstall ?? isManagedMcodeInstallRoot,
    prefixInstall: dependencies.prefixInstall ?? resolveMcodeNpmPrefixInstall,
  };

  if (resolved.managedInstall(resolved.installRoot)) return 'managed-installer';
  if (resolved.prefixInstall()) return 'npm-prefix';

  const packageRoot = resolved.packageRoot();
  if (!packageRoot) return 'unsupported';
  const heuristic = classifyMcodeInstallPath(packageRoot);
  if (heuristic) return heuristic;

  try {
    return classifyNpmGlobalInstall(packageRoot, await resolved.npmGlobalPrefix(), platform);
  } catch {
    return 'unsupported';
  }
}

export function classifyMcodeInstallPath(
  packageRoot: string,
): McodePackageManagerInstallSource | undefined {
  const normalized = packageRoot.replaceAll('\\', '/').toLocaleLowerCase();
  if (
    /\/pnpm\/global\/(?:v11\/[^/]+|[^/]+)\/node_modules\/@minimax(?:-ai)?\/code$/u.test(normalized)
  ) {
    return 'pnpm-global';
  }
  if (
    /\/(?:\.config\/yarn|\.yarn)\/global\/node_modules\/@minimax(?:-ai)?\/code$/u.test(normalized)
  ) {
    return 'yarn-global';
  }
  if (/\/\.bun\/install\/global\/node_modules\/@minimax(?:-ai)?\/code$/u.test(normalized)) {
    return 'bun-global';
  }
  if (
    /\/lib\/node_modules\/@minimax(?:-ai)?\/code$/u.test(normalized) ||
    /\/npm\/node_modules\/@minimax(?:-ai)?\/code$/u.test(normalized)
  ) {
    return 'npm-global';
  }
  return undefined;
}

export function resolveMcodeNpmDistribution(
  packageName: McodeNpmPackageName = resolveMcodePackageName() ?? MCODE_EMBEDDED_PACKAGE_NAME,
  registry?: string,
): McodeNpmDistribution {
  if (packageName === mcodePackageName(MCODE_INTERNAL_SCOPE)) {
    const resolvedRegistry = registry ? new URL(registry).href : MCODE_INTERNAL_NPM_REGISTRY;
    if (resolvedRegistry === MCODE_INTERNAL_NPM_REGISTRY) {
      return { packageName, registry: resolvedRegistry };
    }
    throw new Error(`Unsupported MCode npm registry: ${resolvedRegistry}`);
  }
  if (packageName === mcodePackageName(MCODE_PUBLIC_SCOPE)) {
    const resolvedRegistry = registry ? new URL(registry).href : MCODE_PUBLIC_NPM_REGISTRY;
    if (
      resolvedRegistry === MCODE_PUBLIC_NPM_REGISTRY ||
      resolvedRegistry === MCODE_PUBLIC_NPM_MIRROR_REGISTRY
    ) {
      return { packageName, registry: resolvedRegistry };
    }
    throw new Error(`Unsupported MCode npm registry: ${resolvedRegistry}`);
  }
  throw new Error(`Unsupported MCode npm package: ${String(packageName)}`);
}

export function resolveMcodeNpmDistTag(
  environment: TuiBuildEnvironment | undefined = readEmbeddedTuiBuildEnvironment(),
  embeddedTag: McodeNpmDistTag | undefined = readEmbeddedTuiNpmDistTag(),
): McodeNpmDistTag {
  if (embeddedTag) return embeddedTag;
  if (environment === 'test') return 'test';
  if (environment === 'staging') return 'preview';
  return 'latest';
}

export function classifyNpmGlobalInstall(
  packageRoot: string,
  globalPrefix: string,
  platform: NodeJS.Platform = process.platform,
): McodeInstallSource {
  const normalizedRoot = normalizeResolvedPath(packageRoot, platform);
  const platformPath = platform === 'win32' ? path.win32 : path.posix;
  const packageName =
    mcodePackageNameFromPath(packageRoot) ?? mcodePackageName(MCODE_INTERNAL_SCOPE);
  const candidates =
    platform === 'win32'
      ? [platformPath.join(globalPrefix, 'node_modules', packageName)]
      : [
          platformPath.join(globalPrefix, 'lib', 'node_modules', packageName),
          platformPath.join(globalPrefix, 'node_modules', packageName),
        ];
  return candidates.some(
    (candidate) => normalizeResolvedPath(candidate, platform) === normalizedRoot,
  )
    ? 'npm-global'
    : 'unsupported';
}

export function buildMcodePackageManagerCommand(
  source: McodePackageManagerInstallSource,
  version: string,
  platform: NodeJS.Platform = process.platform,
  distribution: McodeNpmDistribution = resolveMcodeNpmDistribution(),
  prefixInstall?: McodeNpmPrefixInstall,
): McodePackageManagerCommand {
  const targetVersion = ['latest', 'preview', 'test'].includes(version)
    ? version
    : parseMcodeVersion(version);
  const target = `${distribution.packageName}@${targetVersion}`;
  const registryArgs = ['--registry', distribution.registry] as const;
  const registryDisplay = `--registry ${distribution.registry}`;
  const npmInstallArgs = [
    '--ignore-scripts=false',
    '--include=optional',
    `--allow-scripts=${distribution.packageName}`,
  ];
  const npmInstallDisplay = npmInstallArgs.join(' ');
  switch (source) {
    case 'npm-prefix': {
      if (!prefixInstall) {
        throw new Error(tuiUpdateText('update.prefix.ownershipMissing'));
      }
      if (
        prefixInstall.packageName !== distribution.packageName ||
        new URL(prefixInstall.registry).href !== distribution.registry
      ) {
        throw new Error('MCode npm prefix ownership does not match the installed package.');
      }
      return {
        executable: prefixInstall.executable,
        args: [
          'install',
          '--global',
          '--prefix',
          prefixInstall.prefix,
          target,
          ...npmInstallArgs,
          ...registryArgs,
        ],
        display:
          `${prefixInstall.executable} install --global --prefix ${prefixInstall.prefix} ` +
          `${target} ${npmInstallDisplay} ${registryDisplay}`,
      };
    }
    case 'npm-global':
      return {
        executable: platform === 'win32' ? 'npm.cmd' : 'npm',
        args: ['install', '--global', target, ...npmInstallArgs, ...registryArgs],
        display: `npm install --global ${target} ${npmInstallDisplay} ${registryDisplay}`,
      };
    case 'pnpm-global':
      return {
        executable: platform === 'win32' ? 'pnpm.cmd' : 'pnpm',
        args: ['add', '--global', target, ...registryArgs],
        display: `pnpm add --global ${target} ${registryDisplay}`,
      };
    case 'yarn-global':
      return {
        executable: platform === 'win32' ? 'yarn.cmd' : 'yarn',
        args: ['global', 'add', target, ...registryArgs],
        display: `yarn global add ${target} ${registryDisplay}`,
      };
    case 'bun-global':
      return {
        executable: platform === 'win32' ? 'bun.exe' : 'bun',
        args: ['add', '--global', target, ...registryArgs],
        display: `bun add --global ${target} ${registryDisplay}`,
      };
  }
}

export async function resolveLatestMcodeRegistryVersion(
  tag: McodeNpmDistTag,
  dependencies: Partial<ResolveLatestMcodeRegistryVersionDependencies> = {},
): Promise<string> {
  const platform = dependencies.platform ?? process.platform;
  const distribution = dependencies.distribution ?? resolveMcodeNpmDistribution();
  const run =
    dependencies.run ??
    (async (executable: string, args: readonly string[]) => {
      const command = { executable, args, display: executable };
      const bound = bindMcodeNpmCommandToRuntime(
        command,
        dependencies.runtimeExecutable ?? resolveNpmCliInvocation().runtime,
      );
      return runText(bound.executable, bound.args, dependencies.environment);
    });
  const npmExecutable = dependencies.npmExecutable ?? resolveNpmCliInvocation().npmCli;
  const output = await run(npmExecutable, [
    'view',
    `${distribution.packageName}@${tag}`,
    'version',
    '--json',
    '--registry',
    distribution.registry,
    '--fetch-timeout',
    String(REGISTRY_FETCH_TIMEOUT_MS),
  ]);
  let version: unknown;
  try {
    version = JSON.parse(output);
  } catch {
    version = output.trim();
  }
  if (Array.isArray(version)) {
    if (version.length !== 1) {
      throw new Error('MCode registry returned an invalid latest version.');
    }
    version = version[0];
  }
  if (typeof version !== 'string') {
    throw new Error('MCode registry returned an invalid latest version.');
  }
  const parsed = parseMcodeVersion(version);
  if (tag === 'latest' && parsed.includes('-')) {
    throw new Error('MCode latest must resolve to a stable semantic version.');
  }
  return parsed;
}

function readEmbeddedTuiBuildEnvironment(): TuiBuildEnvironment | undefined {
  if (typeof __TUI_BUILD_ENV__ === 'undefined') return undefined;
  return __TUI_BUILD_ENV__;
}

function readEmbeddedTuiNpmDistTag(): McodeNpmDistTag | undefined {
  if (typeof __TUI_NPM_DIST_TAG__ === 'undefined') return undefined;
  return __TUI_NPM_DIST_TAG__;
}

export function bindMcodeNpmCommandToRuntime(
  command: McodePackageManagerCommand,
  runtimeExecutable: string,
): McodePackageManagerCommand {
  const npmExecutable = realpathSync(command.executable);
  const npmDirectory = path.dirname(npmExecutable);
  // Unix npm is normally a symlink to npm-cli.js. Windows npm.cmd prefers its
  // adjacent node.exe over PATH, so bypass that shim and invoke the JS entry.
  const candidates = [
    ...(path.basename(npmExecutable) === 'npm-cli.js' ? [npmExecutable] : []),
    path.join(npmDirectory, 'node_modules', 'npm', 'bin', 'npm-cli.js'),
    path.join(npmDirectory, '..', 'lib', 'node_modules', 'npm', 'bin', 'npm-cli.js'),
  ];
  const npmCli =
    candidates.find((file) => existsSync(file) && statSync(file).isFile()) ??
    resolvePnpmNpmShim(npmExecutable);
  if (!npmCli)
    throw new Error(`Cannot locate npm-cli.js for the owned npm executable: ${command.executable}`);
  return { ...command, executable: runtimeExecutable, args: [npmCli, ...command.args] };
}

function resolvePnpmNpmShim(npmExecutable: string): string | undefined {
  // pnpm env places npm behind a shell shim in PNPM_HOME. Read only its literal
  // versioned CLI target; never execute/source the shim or search other runtimes.
  try {
    const metadata = statSync(npmExecutable);
    if (!metadata.isFile() || metadata.size > 64 * 1024) return undefined;
    const lines = readFileSync(npmExecutable, 'utf8').split(/\r?\n/u);
    if (lines[0] !== '#!/bin/sh') return undefined;
    const commands = lines.map((line) => line.trim()).filter((line) => /^exec\s/u.test(line));
    if (commands.length === 0) return undefined;
    const targets = commands.map(
      (line) =>
        /^exec (?:"\$basedir\/node"|node) "\$basedir\/(nodejs\/\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?\/lib\/node_modules\/npm\/bin\/npm-cli\.js)" "\$@"$/u.exec(
          line,
        )?.[1],
    );
    const target = targets[0];
    if (!target || targets.some((candidate) => candidate !== target)) return undefined;
    const npmDirectory = path.dirname(npmExecutable);
    const versionRoot = path.join(npmDirectory, ...target.split('/').slice(0, 2));
    const cli = realpathSync(path.join(npmDirectory, target));
    // Reject symlinks that redirect the target outside this pnpm Node version.
    if (!isResolvedPathInside(versionRoot, cli, path) || !statSync(cli).isFile()) return undefined;
    return cli;
  } catch {
    return undefined;
  }
}

export function createMcodeNpmRuntimeEnvironment(
  environment: NodeJS.ProcessEnv,
  runtimeExecutable: string,
  platform: NodeJS.Platform = process.platform,
): NodeJS.ProcessEnv {
  const platformPath = platform === 'win32' ? path.win32 : path.posix;
  const result = { ...environment };
  // Windows environment keys are case-insensitive. Keep only one PATH key so Node and
  // cross-spawn cannot choose a different inherited spelling.
  const pathKeys = Object.keys(result)
    .filter((key) => (platform === 'win32' ? key.toLowerCase() === 'path' : key === 'PATH'))
    .sort();
  const inheritedPath = result[pathKeys[0] ?? 'PATH'];
  for (const key of pathKeys) delete result[key];
  result.PATH = [platformPath.dirname(runtimeExecutable), inheritedPath]
    .filter(Boolean)
    .join(platformPath.delimiter);
  return result;
}

export function runMcodePackageManagerCommand(
  command: McodePackageManagerCommand,
  environment: NodeJS.ProcessEnv = process.env,
  options: McodePackageManagerRunOptions = {},
): Promise<void> {
  return new Promise((resolve, reject) => {
    let settled = false;
    const child = spawn(command.executable, [...command.args], {
      env: environment,
      shell: false,
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    });
    const stdout: Buffer[] = [];
    const stderr: Buffer[] = [];
    child.stdout?.on('data', (chunk: Buffer) => {
      stdout.push(chunk);
      notifyPackageManagerOutput(options, chunk);
    });
    child.stderr?.on('data', (chunk: Buffer) => {
      stderr.push(chunk);
      notifyPackageManagerOutput(options, chunk);
    });
    child.once('error', (error) => {
      if (settled) return;
      settled = true;
      reject(error);
    });
    child.once('exit', (code, signal) => {
      if (settled) return;
      settled = true;
      if (code === 0) {
        resolve();
        return;
      }
      const details = Buffer.concat([...stderr, ...stdout])
        .toString('utf8')
        .trim();
      reject(
        new Error(
          `${command.executable} failed (${
            signal ? `signal ${signal}` : `exit ${String(code)}`
          })${details ? `: ${details}` : ''}`,
        ),
      );
    });
  });
}

function notifyPackageManagerOutput(options: McodePackageManagerRunOptions, chunk: Buffer): void {
  try {
    options.onOutput?.(chunk.toString('utf8'));
  } catch {
    // Progress rendering must never change the package-manager result.
  }
}

export function resolveMcodePackageName(
  entryFile = process.argv[1],
): McodeNpmPackageName | undefined {
  return resolveMcodePackageIdentity(entryFile)?.packageName;
}

export function isInternalMcodePackageName(packageName: string | undefined): boolean {
  return packageName === mcodePackageName(MCODE_INTERNAL_SCOPE);
}

export function resolveInstalledMcodePackageVersion(
  entryFile = process.argv[1],
): string | undefined {
  return resolveMcodePackageIdentity(entryFile)?.version;
}

export function resolveMcodeNpmPrefixInstall(
  entryFile = process.argv[1],
  platform: NodeJS.Platform = process.platform,
  nodeExecutable = process.execPath,
): McodeNpmPrefixInstall | undefined {
  const identity = resolveMcodePackageIdentity(entryFile);
  if (!identity) return undefined;
  const platformPath = platform === 'win32' ? path.win32 : path.posix;
  const nodeModules = platformPath.dirname(platformPath.dirname(identity.packageRoot));
  if (platformPath.basename(nodeModules).toLocaleLowerCase() !== 'node_modules') return undefined;
  const nodeModulesParent = platformPath.dirname(nodeModules);
  const packagePrefix =
    platform !== 'win32' && platformPath.basename(nodeModulesParent) === 'lib'
      ? platformPath.dirname(nodeModulesParent)
      : nodeModulesParent;
  const receipt = findNpmPrefixReceipt(packagePrefix, identity.packageRoot, platform, platformPath);
  if (receipt) {
    if (receipt.packageName !== identity.packageName) return undefined;
    return receipt;
  }

  if (platformPath.basename(packagePrefix).toLocaleLowerCase() !== '.minimax-code')
    return undefined;
  const adjacentNpm = platformPath.join(
    platformPath.dirname(nodeExecutable),
    platform === 'win32' ? 'npm.cmd' : 'npm',
  );
  if (!existsSync(adjacentNpm)) return undefined;
  const distribution = resolveMcodeNpmDistribution(identity.packageName);
  return {
    executable: adjacentNpm,
    packageName: identity.packageName,
    prefix: packagePrefix,
    registry: distribution.registry,
  };
}

function resolveMcodePackageRoot(entryFile = process.argv[1]): string | undefined {
  return resolveMcodePackageIdentity(entryFile)?.packageRoot;
}

function resolveMcodePackageIdentity(
  entryFile: string | undefined,
): { packageName: McodeNpmPackageName; packageRoot: string; version?: string } | undefined {
  if (!entryFile) return undefined;
  // A test runner executes each test file as the process entry, so under
  // `bun test` (and `node --test`) `process.argv[1]` is the test file itself.
  // Walking up from there would adopt the nearest manifest — inside this
  // checkout that is `packages/tui/package.json`, which carries the internal
  // package name — and flip update routing to the internal registry. A test
  // file is never a CLI installation, so it resolves no identity at all and
  // the callers fall back to the embedded package name.
  if (/\.(?:test|spec)\.[cm]?[jt]sx?$/u.test(path.basename(entryFile))) return undefined;
  let current: string;
  try {
    const resolved = realpathSync(entryFile);
    current = statSync(resolved).isDirectory() ? resolved : path.dirname(resolved);
  } catch {
    return undefined;
  }

  for (;;) {
    const manifestFile = path.join(current, 'package.json');
    if (existsSync(manifestFile)) {
      try {
        const manifest = JSON.parse(readFileSync(manifestFile, 'utf8')) as {
          name?: unknown;
          version?: unknown;
        };
        const packageName = parseMcodePackageName(manifest.name);
        if (packageName) {
          return {
            packageName,
            packageRoot: current,
            ...(typeof manifest.version === 'string' ? { version: manifest.version } : {}),
          };
        }
      } catch {
        return undefined;
      }
    }
    const parent = path.dirname(current);
    if (parent === current) return undefined;
    current = parent;
  }
}

function findNpmPrefixReceipt(
  packagePrefix: string,
  packageRoot: string,
  platform: NodeJS.Platform,
  platformPath: typeof path.posix | typeof path.win32,
): McodeNpmPrefixInstall | undefined {
  let candidate = packagePrefix;
  for (let depth = 0; depth < 3; depth += 1) {
    const receipt = readNpmPrefixReceipt(
      candidate,
      packagePrefix,
      packageRoot,
      platform,
      platformPath,
    );
    if (receipt) return receipt;
    const parent = platformPath.dirname(candidate);
    if (parent === candidate) break;
    candidate = parent;
  }
  return undefined;
}

function readNpmPrefixReceipt(
  prefix: string,
  packagePrefix: string,
  packageRoot: string,
  platform: NodeJS.Platform,
  platformPath: typeof path.posix | typeof path.win32,
): McodeNpmPrefixInstall | undefined {
  try {
    const raw = readFileSync(platformPath.join(prefix, 'install.json'), 'utf8').replace(
      /^\uFEFF/u,
      '',
    );
    const value = JSON.parse(raw) as {
      schemaVersion?: unknown;
      product?: unknown;
      updateOwner?: unknown;
      packageManager?: unknown;
      packageName?: unknown;
      registry?: unknown;
      distTag?: unknown;
      prefix?: unknown;
      npmExecutable?: unknown;
      nodeExecutable?: unknown;
      layoutVersion?: unknown;
      releasesDirectory?: unknown;
      currentFile?: unknown;
    };
    const packageName = parseMcodePackageName(value.packageName);
    const legacyLayout = value.schemaVersion === 1 && value.layoutVersion === undefined;
    const versionedLayout =
      value.schemaVersion === 2 &&
      value.layoutVersion === 2 &&
      value.releasesDirectory === 'releases' &&
      value.currentFile === 'current';
    if (
      (!legacyLayout && !versionedLayout) ||
      value.product !== 'minimax-code' ||
      value.updateOwner !== 'npm-prefix' ||
      value.packageManager !== 'npm' ||
      !packageName ||
      typeof value.registry !== 'string' ||
      value.distTag !== 'latest' ||
      typeof value.prefix !== 'string' ||
      typeof value.npmExecutable !== 'string'
    ) {
      return undefined;
    }
    const distribution = resolveMcodeNpmDistribution(packageName, value.registry);
    if (
      normalizeResolvedPath(value.prefix, platform) !== normalizeResolvedPath(prefix, platform) ||
      new URL(value.registry).href !== distribution.registry ||
      !existsSync(value.npmExecutable)
    ) {
      return undefined;
    }
    if (
      legacyLayout &&
      normalizeResolvedPath(packagePrefix, platform) !== normalizeResolvedPath(prefix, platform)
    ) {
      return undefined;
    }
    if (versionedLayout) {
      const expectedReleasesRoot = platformPath.join(prefix, 'releases');
      const relativeRelease = platformPath.relative(expectedReleasesRoot, packagePrefix);
      if (
        !relativeRelease ||
        relativeRelease.startsWith('..') ||
        platformPath.isAbsolute(relativeRelease) ||
        relativeRelease.includes(platformPath.sep) ||
        !/^[0-9A-Za-z][0-9A-Za-z._-]*$/u.test(relativeRelease) ||
        !isResolvedPathInside(packagePrefix, packageRoot, platformPath)
      ) {
        return undefined;
      }
    }
    const nodeExecutable =
      typeof value.nodeExecutable === 'string' && platformPath.isAbsolute(value.nodeExecutable)
        ? canonicalReceiptNodeExecutable(value.nodeExecutable)
        : undefined;
    return {
      executable: value.npmExecutable,
      packageName,
      prefix,
      registry: distribution.registry,
      ...(nodeExecutable ? { nodeExecutable } : {}),
    };
  } catch {
    return undefined;
  }
}

// Homebrew deletes versioned Cellar kegs on `brew upgrade` while the
// formula-managed opt/<formula> symlink keeps tracking the installed version,
// and keeps the update PATH prefix scoped to the Node formula instead of all
// of <brew>/bin. Receipts that recorded a Cellar keg (or the linked bin/node)
// therefore heal to the stable opt path when both resolve to the same
// executable; everything else keeps the recorded path unchanged.
const HOMEBREW_CELLAR_NODE_PATH =
  /^(?<prefix>.+)\/Cellar\/(?<formula>node(?:@\d+(?:\.\d+)*)?)\/[^/]+\/bin\/node$/u;
const HOMEBREW_MANAGED_NODE_PATH =
  /^(?<prefix>\/(?:opt\/homebrew|usr\/local|home\/linuxbrew\/\.linuxbrew))\/(?:opt\/(?<formula>node(?:@\d+(?:\.\d+)*)?)\/bin\/node|bin\/node)$/u;

function canonicalReceiptNodeExecutable(nodeExecutable: string): string | undefined {
  const canonical = canonicalHomebrewNodeExecutable(nodeExecutable);
  return usableNodeExecutable(canonical) ?? usableNodeExecutable(nodeExecutable);
}

function canonicalHomebrewNodeExecutable(nodeExecutable: string): string {
  const cellar = HOMEBREW_CELLAR_NODE_PATH.exec(nodeExecutable);
  const managed = HOMEBREW_MANAGED_NODE_PATH.exec(nodeExecutable);
  const prefix = cellar?.groups?.prefix ?? managed?.groups?.prefix;
  if (!prefix) return nodeExecutable;
  const formula = cellar?.groups?.formula ?? managed?.groups?.formula ?? 'node';
  const candidate = `${prefix}/opt/${formula}/bin/node`;
  if (candidate === nodeExecutable) return nodeExecutable;
  try {
    if (realpathSync(candidate) === realpathSync(nodeExecutable)) return candidate;
  } catch {
    // Keep the recorded path when either side does not resolve.
  }
  return nodeExecutable;
}

function usableNodeExecutable(nodeExecutable: string): string | undefined {
  try {
    if (!statSync(nodeExecutable).isFile()) return undefined;
    accessSync(nodeExecutable, constants.X_OK);
    return nodeExecutable;
  } catch {
    return undefined;
  }
}

function isResolvedPathInside(
  root: string,
  candidate: string,
  platformPath: typeof path.posix | typeof path.win32,
): boolean {
  const relative = platformPath.relative(
    platformPath.resolve(root),
    platformPath.resolve(candidate),
  );
  return relative !== '' && !relative.startsWith('..') && !platformPath.isAbsolute(relative);
}

function parseMcodePackageName(value: unknown): McodeNpmPackageName | undefined {
  if (value === mcodePackageName(MCODE_INTERNAL_SCOPE)) return value as McodeNpmPackageName;
  if (value === mcodePackageName(MCODE_PUBLIC_SCOPE)) return value as McodeNpmPackageName;
  return undefined;
}

function mcodePackageName(scope: string): McodeNpmPackageName {
  return `${scope}/${MCODE_PACKAGE_BASENAME}` as McodeNpmPackageName;
}

function mcodePackageNameFromPath(packageRoot: string): McodeNpmPackageName | undefined {
  const normalized = packageRoot.replaceAll('\\', '/');
  const segments = normalized.split('/');
  if (segments.at(-1) !== MCODE_PACKAGE_BASENAME) return undefined;
  return parseMcodePackageName(`${segments.at(-2)}/${MCODE_PACKAGE_BASENAME}`);
}

function normalizeResolvedPath(value: string, platform: NodeJS.Platform): string {
  let resolved: string;
  try {
    resolved = realpathSync(value);
  } catch {
    resolved = (platform === 'win32' ? path.win32 : path.posix).resolve(value);
  }
  return platform === 'win32' ? resolved.toLocaleLowerCase() : resolved;
}

/**
 * Run one command and collect its stdout, through Bun's own subprocess surface.
 *
 * The CLI runs on the Bun runtime, and Bun's `node:child_process` compatibility
 * layer proved unreliable on Windows for these npm invocations — spawned
 * Node/npm children intermittently resolved with empty output or surfaced
 * ENOENT for absolute executable paths. `Bun.spawn` is the runtime's native
 * path (the same doctrine as `packages/local-runtime/src/review/git-exec.ts`)
 * and reads both pipes to EOF before reporting the exit code, so a writer can
 * never block on a full pipe.
 */
async function runText(
  command: string,
  args: readonly string[],
  environment: NodeJS.ProcessEnv = process.env,
): Promise<string> {
  const child = Bun.spawn({
    cmd: [command, ...args],
    env: environment,
    stdin: 'ignore',
    stdout: 'pipe',
    stderr: 'pipe',
    windowsHide: true,
  });
  const decoder = new TextDecoder();
  const readAll = async (stream: ReadableStream<Uint8Array> | null): Promise<string> => {
    if (!stream) return '';
    const chunks: Uint8Array[] = [];
    for await (const chunk of stream) chunks.push(chunk);
    const total = chunks.reduce((sum, chunk) => sum + chunk.byteLength, 0);
    const merged = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) {
      merged.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return decoder.decode(merged);
  };
  const [stdout, stderr, exitCode] = await Promise.all([
    readAll(child.stdout),
    readAll(child.stderr),
    child.exited,
  ]);
  if (exitCode === 0) return stdout.trim();
  const details = `${stderr}${stdout}`.trim();
  throw new Error(
    `${command} failed (exit ${String(exitCode)})${details ? `: ${details}` : ''}`,
  );
}
