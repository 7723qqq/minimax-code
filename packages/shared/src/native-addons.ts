/**
 * Load native addons out of a packaged executable.
 *
 * A `.node` file cannot be opened from inside an executable image: the platform
 * loader (`LoadLibrary` on Windows, `dlopen` elsewhere) takes a real filesystem
 * path. The packager embeds the addon bytes and this module writes them to a
 * versioned cache on first use, verifying the digest the packager recorded, then
 * hands that path to `require`.
 *
 * Nothing here runs in a normal build: the asset table is absent, every lookup
 * returns `undefined`, and callers keep their ordinary resolution.
 */
import { hasEmbeddedAssets, readBundledAssetBytes } from './bundled-assets.js';

/** Cache root for materialised addons. Versioned so an update replaces them. */
export function nativeAddonCacheDirectory(base: string, version: string): string {
  return `${base.replace(/[\/]+$/u, '')}/${version}`;
}

/**
 * Materialise a native addon and return a path `require` can load.
 *
 * `cacheDirectory` is the caller's cache root; the addon keeps its
 * `node_modules/<package>/…` shape underneath, so a loader that resolves relative
 * to its own package still finds sibling files. The digest is checked before an
 * existing copy is reused.
 */
export async function resolveNativeAddon(
  key: string,
  cacheDirectory: string,
  expectedSha256?: string,
): Promise<string | undefined> {
  if (!hasEmbeddedAssets()) return undefined;
  const target = `${cacheDirectory.replace(/[\/]+$/u, '')}/${key.replaceAll('\', '/')}`;
  if (expectedSha256 !== undefined && (await digestMatches(target, expectedSha256))) return target;

  const bytes = await readBundledAssetBytes(key);
  if (bytes === undefined) return undefined;
  await writeBytes(target, bytes);
  return target;
}

async function digestMatches(target: string, expected: string): Promise<boolean> {
  try {
    const hasher = new Bun.CryptoHasher('sha256');
    hasher.update(await Bun.file(target).arrayBuffer());
    return hasher.digest('hex') === expected;
  } catch {
    return false;
  }
}

async function writeBytes(target: string, bytes: Uint8Array): Promise<void> {
  const { mkdir, writeFile } = await import('node:fs/promises');
  const index = target.replaceAll('\', '/').lastIndexOf('/');
  if (index > 0) await mkdir(target.slice(0, index), { recursive: true });
  // Addon bytes are executable content; keep them owner-only.
  await writeFile(target, bytes, { mode: 0o700 });
}
