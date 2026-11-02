import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { atomicWriteFile } from '@mavis/shared';

const MODULE_DIRECTORY = dirname(fileURLToPath(import.meta.url));

export interface ProviderPresetRepositoryOptions {
  readonly dataDir?: string;
  readonly bundledCatalogPath?: string;
  readonly localCatalogPath?: string;
}

function resolveProviderPresetBundledCatalogPaths(
  options: ProviderPresetRepositoryOptions,
): string[] {
  if (options.bundledCatalogPath) return [options.bundledCatalogPath];
  return [
    join(MODULE_DIRECTORY, 'assets', 'models-dev-catalog.json.gz'),
    join(MODULE_DIRECTORY, '..', '..', '..', '..', '..', 'assets', 'models-dev-catalog.json.gz'),
  ];
}

export function resolveProviderPresetLocalCatalogPath(
  options: ProviderPresetRepositoryOptions,
): string | undefined {
  return (
    options.localCatalogPath ??
    (options.dataDir ? join(options.dataDir, 'cache', 'models-dev-catalog.json') : undefined)
  );
}

export async function readProviderPresetSnapshotCandidates(
  options: ProviderPresetRepositoryOptions,
): Promise<unknown[]> {
  const candidates = await Promise.all([
    ...resolveProviderPresetBundledCatalogPaths(options).map((filePath) =>
      readCatalogSnapshot(filePath),
    ),
    readCatalogSnapshot(resolveProviderPresetLocalCatalogPath(options)),
  ]);
  return candidates.filter((candidate) => candidate !== undefined);
}

export async function writeProviderPresetSnapshot(
  filePath: string,
  snapshot: unknown,
): Promise<void> {
  await atomicWriteFile(filePath, JSON.stringify(snapshot), { retryWindows: true });
}

async function readCatalogSnapshot(filePath: string | undefined): Promise<unknown> {
  if (!filePath) return undefined;
  try {
    // Bun.gunzipSync returns Uint8Array where node:zlib returned Buffer: wrap it
    // so the utf8 decode below runs on bytes rather than on indices.
    const contents = filePath.endsWith('.gz')
      ? Buffer.from(Bun.gunzipSync(await readFile(filePath))).toString('utf8')
      : await readFile(filePath, 'utf8');
    return JSON.parse(contents);
  } catch {
    return undefined;
  }
}
