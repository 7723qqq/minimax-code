/**
 * Access to assets compiled into a packaged executable.
 *
 * A source or npm build reads these from `dist/` on disk. A packaged build has no
 * such directory: `bun build --compile` moves every asset into the executable
 * image, where the only handle is the table the packager generated. Directory
 * structure is not preserved, because the imports are flat — `readFile` can open
 * an embedded path, but `join(dir, 'name')` cannot synthesise one.
 *
 * `resolveBundledAsset` bridges the two: it takes the logical key a caller already
 * knows (for example `assets/agents/builtin-agents.json`) and returns a readable
 * path. Outside a packaged build that is `join(rootDir, key)`; inside one it is
 * the embedded path, or `undefined` when the build did not include the key.
 */

/** Shape the packager writes for each embedded asset. */
interface BundledAsset {
  readonly path: string;
  /** Present for native addons, which are verified before being written to disk. */
  readonly sha256?: string;
}

/** Populated by the generated setup module in a packaged build. */
const EMBEDDED_KEY = '__MCODE_BUNDLED_ASSETS__';

function embeddedAssets(): Record<string, BundledAsset> | undefined {
  return (globalThis as unknown as Record<string, Record<string, BundledAsset> | undefined>)[
    EMBEDDED_KEY
  ];
}

/** Whether this process is a packaged executable with an embedded asset table. */
export function hasEmbeddedAssets(): boolean {
  const table = embeddedAssets();
  return table !== undefined && Object.keys(table).length > 0;
}

/**
 * Map one logical asset key to a readable path.
 *
 * Returns `undefined` when a packaged build does not carry the key, so a caller
 * can treat it exactly like a missing file instead of reading a wrong path.
 */
export function resolveBundledAsset(rootDir: string, key: string): string | undefined {
  const table = embeddedAssets();
  if (table === undefined) return joinPath(rootDir, key);
  return table[normalizeKey(key)]?.path;
}

/** Every key the packaged build carries under `prefix`, for directory-style reads. */
export function listBundledAssets(prefix: string): string[] | undefined {
  const table = embeddedAssets();
  if (table === undefined) return undefined;
  const normalized = normalizeKey(prefix).replace(/\/+$/u, '');
  return Object.keys(table)
    .filter((key) => key === normalized || key.startsWith(`${normalized}/`))
    .sort();
}

/** Embedded bytes for one key, or `undefined` when the build did not include it. */
export async function readBundledAssetBytes(key: string): Promise<Uint8Array | undefined> {
  const path = embeddedAssets()?.[normalizeKey(key)]?.path;
  if (path === undefined) return undefined;
  return new Uint8Array(await Bun.file(path).arrayBuffer());
}

function normalizeKey(key: string): string {
  return key.replaceAll('\\', '/').replace(/^\.\//u, '');
}

function joinPath(rootDir: string, key: string): string {
  const separator = rootDir.endsWith('/') || rootDir.endsWith('\\') ? '' : '/';
  return `${rootDir}${separator}${normalizeKey(key)}`;
}
