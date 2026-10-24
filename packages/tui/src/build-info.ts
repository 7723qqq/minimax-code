import { readFileSync } from 'node:fs';

export const MINIMAX_CODE_MIN_NODE_VERSION = '22.19.0';
export const MINIMAX_CODE_SUPPORTED_NODE_VERSIONS = '22.19+, 24, 25, or 26';
export const TUI_BUILD_PROFILE = 'tui';
export const MINIMAX_CODE_PACKAGE_NAME = '@minimax-ai/code';

interface PackageManifest {
  name: string;
  version: string;
}

/**
 * Version of the running CLI.
 *
 * The bundle defines `__CLI_VERSION__` at build time, so a packaged executable
 * knows its version without touching the filesystem: `import.meta.url` points
 * inside the executable (`B:/~BUN/root/...`), and there is no `package.json`
 * beside it to read. Source checkouts and tests do not define the constant, so
 * the manifest lookup below still runs for them.
 */
declare const __CLI_VERSION__: string | undefined;

export function resolveTuiPackageVersion(moduleUrl: string | URL = import.meta.url): string {
  const buildVersion = typeof __CLI_VERSION__ === 'string' ? __CLI_VERSION__ : undefined;
  if (buildVersion !== undefined && buildVersion.length > 0) return buildVersion;

  for (const relativePath of ['./package.json', '../package.json']) {
    try {
      const manifest = JSON.parse(
        readFileSync(new URL(relativePath, moduleUrl), 'utf8'),
      ) as Partial<PackageManifest>;
      if (
        (manifest.name === MINIMAX_CODE_PACKAGE_NAME || manifest.name === '@minimax/code') &&
        typeof manifest.version === 'string' &&
        manifest.version.length > 0
      ) {
        return manifest.version;
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }
  }
  throw new Error(`Cannot resolve ${MINIMAX_CODE_PACKAGE_NAME} package version`);
}

function parseVersion(version: string): number[] | undefined {
  const parts = version.split('.');
  if (parts.length === 0 || parts.some((part) => !/^\d+$/.test(part))) return undefined;
  return parts.map((part) => Number.parseInt(part, 10));
}

/**
 * Whether the running runtime is one this CLI supports.
 *
 * The check reads `process.versions.node` because that is what a Node install
 * reports, but under Bun the same field is the *compatibility* value
 * (`process.versions.bun` is set alongside it), not a Node release. Comparing
 * that compatibility number against a Node range would reject the CLI the moment
 * Bun raises it past the supported window, even though nothing is wrong with the
 * runtime.
 *
 * An explicit `version` argument means the caller is asking about a specific Node
 * release, so the range always applies to it regardless of the current runtime.
 * Only the default call — "is *this* process supported?" — accepts a Bun runtime
 * on its own identity.
 */
export function supportsTuiNodeVersion(version?: string): boolean {
  const explicit = version !== undefined;
  if (!explicit && isBunRuntime()) return true;

  const currentParts = parseVersion(version ?? process.versions.node);
  if (!currentParts) return false;

  const [major = -1, minor = 0] = currentParts;
  return (major === 22 && minor >= 19) || (major >= 24 && major <= 26);
}

/** Whether this process is Bun rather than a Node build. */
export function isBunRuntime(): boolean {
  return typeof process.versions.bun === 'string' && process.versions.bun.length > 0;
}

export const MINIMAX_CODE_VERSION = resolveTuiPackageVersion();
