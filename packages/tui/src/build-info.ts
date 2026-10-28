import { readFileSync } from 'node:fs';

export const MINIMAX_CODE_MIN_BUN_VERSION = '1.4.4';
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

function parseVersion(version: string): [number, number, number] | undefined {
  const match = /^(\d+)(?:\.(\d+))?(?:\.(\d+))?/.exec(version.trim());
  if (!match) return undefined;
  return [Number(match[1]), Number(match[2] ?? 0), Number(match[3] ?? 0)];
}

/**
 * Whether a Bun release meets the CLI's minimum.
 *
 * Callers pass `process.versions.bun`; that field is absent under Node, whose
 * `process.versions.node` is a compatibility value rather than this runtime's
 * release. Only the leading numeric components matter, so pre-release suffixes
 * do not decide support.
 */
export function supportsBunVersion(version: string): boolean {
  const parts = parseVersion(version);
  const minimum = parseVersion(MINIMAX_CODE_MIN_BUN_VERSION);
  if (!parts || !minimum) return false;
  for (let index = 0; index < 3; index += 1) {
    const difference = (parts[index] ?? 0) - (minimum[index] ?? 0);
    if (difference !== 0) return difference > 0;
  }
  return true;
}

export const MINIMAX_CODE_VERSION = resolveTuiPackageVersion();
