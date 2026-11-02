import {
  chmodSync,
  copyFileSync,
  linkSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
/* eslint-disable-next-line import/no-relative-packages -- repository-level test helper outside every package */
import { spawnSync } from '../../../../scripts/lib/exec.mjs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'bun:test';
import { McodeUpdateApplication } from '../../src/update/application.js';
import {
  createMcodeNpmRuntimeEnvironment,
  resolveMcodeNpmPrefixInstall,
} from '../../src/update/install-source.js';

const roots: string[] = [];
// The receipt pins the runtime that executes the CLI, which is Bun. These
// fixtures therefore use the test runner's own executable, and the npm-cli.js
// fixtures assert they were started by it rather than by a PATH `node`.
const runtimeExecutable = process.execPath;
afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe('npm-prefix runtime consistency', () => {
  it('normalizes Windows PATH aliases without mutating the parent environment', () => {
    const environment = { Path: 'C:\\system;C:\\tools', PATH: 'C:\\other', TOKEN: 'keep' };
    const updated = createMcodeNpmRuntimeEnvironment(
      environment,
      'C:\\mcode runtime\\node.exe',
      'win32',
    );
    expect(updated).toEqual({ PATH: 'C:\\mcode runtime;C:\\other', TOKEN: 'keep' });
    expect(environment.Path).toBe('C:\\system;C:\\tools');
    expect(environment.PATH).toBe('C:\\other');
    expect(
      createMcodeNpmRuntimeEnvironment({ Path: 'C:\\system' }, 'C:\\runtime\\node.exe', 'win32'),
    ).toEqual({ PATH: 'C:\\runtime;C:\\system' });
  });

  it('preserves non-PATH variables and supports an absent Unix PATH', () => {
    expect(
      createMcodeNpmRuntimeEnvironment(
        { Path: 'case-sensitive' },
        '/private/node/bin/node',
        'darwin',
      ),
    ).toEqual({ Path: 'case-sensitive', PATH: '/private/node/bin' });
  });

  it
    .skipIf(process.platform === 'win32')
    .each(['npm', 'npm.cmd'] as const)(
    'runs npm with the launcher runtime and gates activation on SQLite (shim=%s)',
    async (shim) => {
      const root = mkdtempSync(path.join(os.tmpdir(), 'mcode-update-runtime-'));
      roots.push(root);
      const prefix = path.join(root, 'install');
      const npm = path.join(root, shim);
      const npmCli = path.join(root, 'node_modules/npm/bin/npm-cli.js');
      mkdirSync(path.dirname(npmCli), { recursive: true });
      // Neither a Unix shim nor npm.cmd may choose its own runtime.
      writeFileSync(npm, '#!/bin/sh\nexit 42\n', { mode: 0o755 });
      const shadowBin = path.join(root, 'shadow');
      mkdirSync(shadowBin);
      mkdirSync(prefix);
      writeFileSync(path.join(prefix, 'current'), '1.2.3\n');
      // If npm resolves its runtime from the inherited PATH, it fails before installing.
      writeFileSync(path.join(shadowBin, 'node'), '#!/bin/sh\nexit 42\n', { mode: 0o755 });
      writeFileSync(
        npmCli,
        `#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
if (typeof process.versions.bun !== 'string') throw new Error('Wrong npm runtime');
if (process.execPath !== ${JSON.stringify(runtimeExecutable)}) throw new Error('Wrong npm runtime path');
if (process.argv.includes('view')) { console.log(JSON.stringify('1.2.4')); process.exit(0); }
const prefix = process.argv[process.argv.indexOf('--prefix') + 1];
const root = path.join(prefix, process.platform === 'win32' ? 'node_modules/@minimax-ai/code' : 'lib/node_modules/@minimax-ai/code');
fs.mkdirSync(root, { recursive: true });
fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify({name:'@minimax-ai/code',version:'1.2.4',bin:{mcode:'cli.js','mcode-tools':'tools.js'}}));
fs.writeFileSync(path.join(root, 'cli.js'), 'console.log("1.2.4");');
fs.writeFileSync(path.join(root, 'tools.js'), 'console.log("mcode-tools 1.2.4");');
`,
        { mode: 0o755 },
      );
      chmodSync(npm, 0o755);
      const environment = {
        ...process.env,
        PATH: `${shadowBin}${path.delimiter}${process.env.PATH ?? ''}`,
      };
      const application = new McodeUpdateApplication(
        {
          currentVersion: '1.2.3',
          entryFile: path.join(prefix, 'missing-old-entry.js'),
          runtimeExecutable,
          environment,
          prefixInstall: {
            executable: npm,
            prefix,
            packageName: '@minimax-ai/code',
            registry: 'https://registry.npmjs.org/',
          },
        },
        {
          detectInstallSource: async () => 'npm-prefix',
        },
      );
      const plan = await application.inspect();
      await expect(application.apply(plan)).resolves.toMatchObject({ applied: true });
      expect(readFileSync(path.join(prefix, 'current'), 'utf8')).toBe('1.2.4\n');
      expect(
        JSON.parse(readFileSync(path.join(prefix, 'install.json'), 'utf8')).nodeExecutable,
      ).toBe(runtimeExecutable);
      expect(environment.PATH.startsWith(shadowBin)).toBe(true);
    },
  );

  it.skipIf(process.platform === 'win32')(
    'pins npm-prefix updates to the receipt runtime across Homebrew-style upgrades',
    async () => {
    const root = mkdtempSync(path.join(os.tmpdir(), 'mcode-update-runtime-'));
    roots.push(root);
    const prefix = path.join(root, 'install');
    const npm = path.join(root, 'npm');
    const npmCli = path.join(root, 'node_modules/npm/bin/npm-cli.js');
    const brewBin = path.join(root, 'homebrew', 'bin');
    const pinnedNode = path.join(brewBin, 'node');
    mkdirSync(path.dirname(npmCli), { recursive: true });
    mkdirSync(brewBin, { recursive: true });
    writeFileSync(npm, '#!/bin/sh\nexit 42\n', { mode: 0o755 });
    symlinkSync(runtimeExecutable, pinnedNode);
    const packageRoot = path.join(
      prefix,
      'releases',
      '1.2.3',
      'lib',
      'node_modules',
      '@minimax',
      'code',
    );
    mkdirSync(packageRoot, { recursive: true });
    writeFileSync(
      path.join(packageRoot, 'package.json'),
      JSON.stringify({
        name: '@minimax-ai/code',
        version: '1.2.3',
        bin: { mcode: 'cli.js', 'mcode-tools': 'tools.js' },
      }),
    );
    writeFileSync(path.join(packageRoot, 'cli.js'), 'console.log("1.2.3");');
    writeFileSync(path.join(prefix, 'current'), '1.2.3\n');
    writeFileSync(
      path.join(prefix, 'install.json'),
      JSON.stringify({
        schemaVersion: 2,
        product: 'minimax-code',
        updateOwner: 'npm-prefix',
        packageManager: 'npm',
        packageName: '@minimax-ai/code',
        registry: 'https://registry.npmjs.org/',
        distTag: 'latest',
        npmExecutable: npm,
        nodeExecutable: pinnedNode,
        prefix,
        layoutVersion: 2,
        releasesDirectory: 'releases',
        currentFile: 'current',
      }),
    );
    writeFileSync(
      npmCli,
      `#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
if (process.argv.includes('view')) { console.log(JSON.stringify('1.2.4')); process.exit(0); }
const prefix = process.argv[process.argv.indexOf('--prefix') + 1];
const root = path.join(prefix, 'lib/node_modules/@minimax-ai/code');
fs.mkdirSync(path.join(root, 'node_modules/better-sqlite3'), { recursive: true });
fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify({name:'@minimax-ai/code',version:'1.2.4',bin:{mcode:'cli.js','mcode-tools':'tools.js'}}));
fs.writeFileSync(path.join(root, 'cli.js'), 'console.log("1.2.4");');
fs.writeFileSync(path.join(root, 'tools.js'), 'console.log("mcode-tools 1.2.4");');
fs.writeFileSync(path.join(root, 'node_modules/better-sqlite3/index.js'), 'module.exports = class { constructor() {} prepare() { return { get: () => ({ value: 1 }) }; } close() {} };');
`,
      { mode: 0o755 },
    );

    const application = new McodeUpdateApplication(
      {
        currentVersion: '1.2.3',
        entryFile: path.join(packageRoot, 'cli.js'),
        environment: { ...process.env },
      },
      {
        detectInstallSource: async () => 'npm-prefix',
      },
    );
    await expect(application.apply(await application.inspect())).resolves.toMatchObject({
      applied: true,
    });
    expect(readFileSync(path.join(prefix, 'current'), 'utf8')).toBe('1.2.4\n');
    expect(JSON.parse(readFileSync(path.join(prefix, 'install.json'), 'utf8')).nodeExecutable).toBe(
      pinnedNode,
    );
    const releaseLauncher = path.join(prefix, 'releases', '1.2.4', '.mcode-launcher');
    const launcherContents = readFileSync(releaseLauncher, 'utf8');
    expect(launcherContents).toContain(`runtime='${pinnedNode}'`);
    expect(launcherContents).not.toContain(runtimeExecutable);
    expect(spawnSync(releaseLauncher, ['--version']).stdout.toString()).toBe('1.2.4\n');

    rmSync(pinnedNode);
    const missing = spawnSync(releaseLauncher, ['--version']);
    expect(missing.status).toBe(127);
    expect(missing.stderr.toString()).toMatch(/runtime is missing/u);
    expect(missing.stderr.toString()).toMatch(/re-run the MCode installer/u);
  });

  it.skipIf(process.platform === 'win32')(
    'heals receipts pinned to a Homebrew Cellar keg via the stable opt path',
    async () => {
    const root = mkdtempSync(path.join(os.tmpdir(), 'mcode-update-runtime-'));
    roots.push(root);
    const brewRoot = path.join(root, 'homebrew');
    const kegNode = path.join(brewRoot, 'Cellar', 'node', '26.7.0', 'bin', 'node');
    placeNodeBinaryAt(kegNode);
    const optLink = path.join(brewRoot, 'opt', 'node');
    mkdirSync(path.dirname(optLink), { recursive: true });
    symlinkSync(path.join(brewRoot, 'Cellar', 'node', '26.7.0'), optLink);
    const optNode = path.join(optLink, 'bin', 'node');

    const result = await runNpmPrefixUpdate(root, kegNode);
    expect(result.outcome).toMatchObject({ applied: true });
    expect(result.receiptNode).toBe(optNode);
    expect(result.launcher).toContain(`runtime='${optNode}'`);
    expect(result.launcher).not.toContain('/Cellar/');
    const releaseLauncher = path.join(result.prefix, 'releases', '1.2.4', '.mcode-launcher');
    expect(spawnSync(releaseLauncher, ['--version']).stdout.toString()).toBe('1.2.4\n');
  });

  it.skipIf(process.platform === 'win32')(
    'falls back to the running runtime when the receipt runtime is unusable',
    async () => {
    const root = mkdtempSync(path.join(os.tmpdir(), 'mcode-update-runtime-'));
    roots.push(root);

    const result = await runNpmPrefixUpdate(root, path.join(root, 'removed', 'bin', 'node'));
    expect(result.outcome).toMatchObject({ applied: true });
    expect(result.receiptNode).toBe(runtimeExecutable);
    expect(result.launcher).toContain(`runtime='${runtimeExecutable}'`);
  });

  it.skipIf(process.platform === 'win32')(
    'ignores unusable receipt runtime executables and legacy receipts',
    () => {
    const root = mkdtempSync(path.join(os.tmpdir(), 'mcode-update-runtime-'));
    roots.push(root);
    const npm = path.join(root, 'npm');
    writeFileSync(npm, '#!/bin/sh\nexit 42\n', { mode: 0o755 });
    const prefix = path.join(root, 'install');
    const legacyEntry = path.join(prefix, 'lib', 'node_modules', '@minimax-ai', 'code', 'cli.js');
    const versionedEntry = path.join(
      prefix,
      'releases',
      '1.0.0',
      'lib',
      'node_modules',
      '@minimax-ai',
      'code',
      'cli.js',
    );
    for (const entry of [legacyEntry, versionedEntry]) {
      mkdirSync(path.dirname(entry), { recursive: true });
      writeFileSync(
        path.join(path.dirname(entry), 'package.json'),
        JSON.stringify({ name: '@minimax-ai/code', version: '1.0.0' }),
      );
      writeFileSync(entry, 'console.log("1.0.0");');
    }
    const directory = path.join(root, 'directory');
    mkdirSync(directory);
    const writeReceipt = (extra: Record<string, unknown> = {}) =>
      writeFileSync(
        path.join(prefix, 'install.json'),
        JSON.stringify({
          schemaVersion: 2,
          product: 'minimax-code',
          updateOwner: 'npm-prefix',
          packageManager: 'npm',
          packageName: '@minimax-ai/code',
          registry: 'https://registry.npmjs.org/',
          distTag: 'latest',
          npmExecutable: npm,
          prefix,
          layoutVersion: 2,
          releasesDirectory: 'releases',
          currentFile: 'current',
          ...extra,
        }),
      );

    writeReceipt({ nodeExecutable: 'bin/node' });
    expect(resolveMcodeNpmPrefixInstall(versionedEntry)?.nodeExecutable).toBeUndefined();
    writeReceipt({ nodeExecutable: path.join(root, 'missing', 'node') });
    expect(resolveMcodeNpmPrefixInstall(versionedEntry)?.nodeExecutable).toBeUndefined();
    writeReceipt({ nodeExecutable: directory });
    expect(resolveMcodeNpmPrefixInstall(versionedEntry)?.nodeExecutable).toBeUndefined();

    writeFileSync(
      path.join(prefix, 'install.json'),
      JSON.stringify({
        schemaVersion: 1,
        product: 'minimax-code',
        updateOwner: 'npm-prefix',
        packageManager: 'npm',
        packageName: '@minimax-ai/code',
        registry: 'https://registry.npmjs.org/',
        distTag: 'latest',
        npmExecutable: npm,
        prefix,
      }),
    );
    const legacyInstall = resolveMcodeNpmPrefixInstall(legacyEntry);
    expect(legacyInstall).toBeDefined();
    expect(legacyInstall?.nodeExecutable).toBeUndefined();

    const brewRoot = path.join(root, 'homebrew');
    const kegNode = path.join(brewRoot, 'Cellar', 'node', '26.7.0', 'bin', 'node');
    placeNodeBinaryAt(kegNode);
    const optLink = path.join(brewRoot, 'opt', 'node');
    mkdirSync(path.dirname(optLink), { recursive: true });
    symlinkSync(path.join(brewRoot, 'Cellar', 'node', '26.7.0'), optLink);
    writeReceipt({ nodeExecutable: path.join(optLink, 'bin', 'node') });
    expect(resolveMcodeNpmPrefixInstall(versionedEntry)?.nodeExecutable).toBe(
      path.join(optLink, 'bin', 'node'),
    );
  });
});

// Homebrew's Cellar/node/<version>/bin/node is the real binary, so the fixture
// places the fixture Node there via hardlink (copy fallback) to make
// process.execPath resolve inside the fake keg.
function placeNodeBinaryAt(target: string) {
  mkdirSync(path.dirname(target), { recursive: true });
  try {
    linkSync(runtimeExecutable, target);
  } catch {
    copyFileSync(runtimeExecutable, target);
  }
  chmodSync(target, 0o755);
}

async function runNpmPrefixUpdate(
  root: string,
  nodeExecutable: string | undefined,
): Promise<{ prefix: string; receiptNode: unknown; launcher: string; outcome: unknown }> {
  const prefix = path.join(root, 'install');
  const npm = path.join(root, 'npm');
  const npmCli = path.join(root, 'node_modules/npm/bin/npm-cli.js');
  mkdirSync(path.dirname(npmCli), { recursive: true });
  writeFileSync(npm, '#!/bin/sh\nexit 42\n', { mode: 0o755 });
  const packageRoot = path.join(
    prefix,
    'releases',
    '1.2.3',
    'lib',
    'node_modules',
    '@minimax-ai',
    'code',
  );
  mkdirSync(packageRoot, { recursive: true });
  writeFileSync(
    path.join(packageRoot, 'package.json'),
    JSON.stringify({
      name: '@minimax-ai/code',
      version: '1.2.3',
      bin: { mcode: 'cli.js', 'mcode-tools': 'tools.js' },
    }),
  );
  writeFileSync(path.join(packageRoot, 'cli.js'), 'console.log("1.2.3");');
  writeFileSync(path.join(prefix, 'current'), '1.2.3\n');
  writeFileSync(
    path.join(prefix, 'install.json'),
    JSON.stringify({
      schemaVersion: 2,
      product: 'minimax-code',
      updateOwner: 'npm-prefix',
      packageManager: 'npm',
      packageName: '@minimax-ai/code',
      registry: 'https://registry.npmjs.org/',
      distTag: 'latest',
      npmExecutable: npm,
      ...(nodeExecutable ? { nodeExecutable } : {}),
      prefix,
      layoutVersion: 2,
      releasesDirectory: 'releases',
      currentFile: 'current',
    }),
  );
  writeFileSync(
    npmCli,
    `#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
if (process.argv.includes('view')) { console.log(JSON.stringify('1.2.4')); process.exit(0); }
const prefix = process.argv[process.argv.indexOf('--prefix') + 1];
const root = path.join(prefix, 'lib/node_modules/@minimax-ai/code');
fs.mkdirSync(path.join(root, 'node_modules/better-sqlite3'), { recursive: true });
fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify({name:'@minimax-ai/code',version:'1.2.4',bin:{mcode:'cli.js','mcode-tools':'tools.js'}}));
fs.writeFileSync(path.join(root, 'cli.js'), 'console.log("1.2.4");');
fs.writeFileSync(path.join(root, 'tools.js'), 'console.log("mcode-tools 1.2.4");');
fs.writeFileSync(path.join(root, 'node_modules/better-sqlite3/index.js'), 'module.exports = class { constructor() {} prepare() { return { get: () => ({ value: 1 }) }; } close() {} };');
`,
    { mode: 0o755 },
  );

  const application = new McodeUpdateApplication(
    {
      currentVersion: '1.2.3',
      entryFile: path.join(packageRoot, 'cli.js'),
      runtimeExecutable,
      environment: { ...process.env },
    },
    {
      detectInstallSource: async () => 'npm-prefix',
    },
  );
  const outcome = await application.apply(await application.inspect());
  const receiptNode = JSON.parse(
    readFileSync(path.join(prefix, 'install.json'), 'utf8'),
  ).nodeExecutable;
  const launcher = readFileSync(path.join(prefix, 'releases', '1.2.4', '.mcode-launcher'), 'utf8');
  return { prefix, receiptNode, launcher, outcome };
}
