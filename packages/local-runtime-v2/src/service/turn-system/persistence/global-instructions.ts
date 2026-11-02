import { mkdir, readFile, stat, unlink } from 'node:fs/promises';
import { resolve } from 'node:path';

import { atomicWriteFile } from '@mavis/shared';

export const GLOBAL_INSTRUCTIONS_MAX_BYTES = 32 * 1024;

export type GlobalInstructionsErrorCode =
  | 'GLOBAL_INSTRUCTIONS_READ_FAILED'
  | 'GLOBAL_INSTRUCTIONS_TOO_LARGE'
  | 'GLOBAL_INSTRUCTIONS_WRITE_FAILED';

export class GlobalInstructionsError extends Error {
  override readonly name = 'GlobalInstructionsError';

  constructor(readonly code: GlobalInstructionsErrorCode) {
    super(code);
  }
}

export interface GlobalInstructionsState {
  readonly content: string;
  readonly exists: boolean;
  readonly maxBytes: number;
}

/** Turn-owned access to the profile-wide AGENTS.md file. */
export class GlobalInstructions {
  private readonly filePath: string;

  constructor(private readonly dataDir: string) {
    this.filePath = resolve(dataDir, 'AGENTS.md');
  }

  async read(): Promise<GlobalInstructionsState> {
    try {
      return {
        content: await readFile(this.filePath, 'utf8'),
        exists: true,
        maxBytes: GLOBAL_INSTRUCTIONS_MAX_BYTES,
      };
    } catch (error) {
      if (isNodeError(error) && error.code === 'ENOENT') return emptyState();
      throw new GlobalInstructionsError('GLOBAL_INSTRUCTIONS_READ_FAILED');
    }
  }

  async readForPrompt(): Promise<string | undefined> {
    try {
      if ((await stat(this.filePath)).size > GLOBAL_INSTRUCTIONS_MAX_BYTES) return undefined;
      const content = await readFile(this.filePath, 'utf8');
      if (Buffer.byteLength(content, 'utf8') > GLOBAL_INSTRUCTIONS_MAX_BYTES) return undefined;
      return content.trim() || undefined;
    } catch {
      return undefined;
    }
  }

  async write(content: string): Promise<GlobalInstructionsState> {
    if (Buffer.byteLength(content, 'utf8') > GLOBAL_INSTRUCTIONS_MAX_BYTES) {
      throw new GlobalInstructionsError('GLOBAL_INSTRUCTIONS_TOO_LARGE');
    }
    if (!content.trim()) {
      try {
        await unlink(this.filePath);
      } catch (error) {
        if (!isNodeError(error) || error.code !== 'ENOENT') {
          throw new GlobalInstructionsError('GLOBAL_INSTRUCTIONS_WRITE_FAILED');
        }
      }
      return emptyState();
    }

    try {
      await mkdir(this.dataDir, { recursive: true });
      // Global instructions survive a crash mid-write: fsync before the rename.
      await atomicWriteFile(this.filePath, content, { ensureDirectory: false, fsync: true });
      return { content, exists: true, maxBytes: GLOBAL_INSTRUCTIONS_MAX_BYTES };
    } catch {
      throw new GlobalInstructionsError('GLOBAL_INSTRUCTIONS_WRITE_FAILED');
    }
  }
}

function emptyState(): GlobalInstructionsState {
  return { content: '', exists: false, maxBytes: GLOBAL_INSTRUCTIONS_MAX_BYTES };
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error;
}
