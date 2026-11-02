import { dirname } from 'node:path';

import { atomicWriteFile, ensurePrivateDirectory } from '@mavis/shared';

export async function atomicWritePrivateFile(path: string, content: string): Promise<void> {
  await ensurePrivateDirectory(dirname(path));
  // Credential state survives a crash mid-write: fsync before the rename.
  await atomicWriteFile(path, content, { ensureDirectory: false, fsync: true });
}
