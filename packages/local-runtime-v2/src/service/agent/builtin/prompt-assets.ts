import { readFile, readdir } from 'node:fs/promises';
import { join, posix } from 'node:path';

import { hasEmbeddedAssets, listBundledAssets, resolveBundledAsset } from '@mavis/shared/bundled-assets';

/**
 * Source this module reads from a packaged executable's image.
 *
 * The caller passes the sentinel `assetsDir()` returns when assets are embedded;
 * `readdir` cannot walk it, so the embedded key list stands in for the directory.
 */
const EMBEDDED_ROOT_PREFIX = '<mcode-embedded-assets>';

/** Eagerly captures the complete package before any template in the run is rendered. */
export async function captureLocalPromptAssets(root: string): Promise<ReadonlyMap<string, string>> {
  if (hasEmbeddedAssets() && root.startsWith(EMBEDDED_ROOT_PREFIX)) {
    return captureEmbeddedPromptAssets();
  }

  const contents = new Map<string, string>();
  async function visit(relativeDir: string): Promise<void> {
    for (const entry of await readdir(join(root, relativeDir), { withFileTypes: true })) {
      const relativePath = posix.join(relativeDir, entry.name);
      if (entry.isDirectory()) await visit(relativePath);
      else if (entry.isFile() && /(?:\.md(?:\.hbs)?|\.json)$/u.test(entry.name)) {
        contents.set(relativePath, await readFile(join(root, relativePath), 'utf8'));
      }
    }
  }
  await visit('');
  return contents;
}

/**
 * Collect the same map from the embedded asset table.
 *
 * A packaged build has no directory tree to walk — the assets are flattened inside
 * the executable and keyed by their original relative path — so the key list
 * replaces the recursion, and each entry is read through its embedded path.
 */
async function captureEmbeddedPromptAssets(): Promise<ReadonlyMap<string, string>> {
  const contents = new Map<string, string>();
  const keys = listBundledAssets('assets/agents') ?? [];
  for (const key of keys) {
    const relativePath = key.slice('assets/agents/'.length);
    if (!/(?:\.md(?:\.hbs)?|\.json)$/u.test(relativePath)) continue;
    const embeddedPath = resolveBundledAsset('', key);
    if (embeddedPath === undefined) continue;
    contents.set(relativePath, await readFile(embeddedPath, 'utf8'));
  }
  return contents;
}
