import { randomBytes } from 'node:crypto';
import {
  chmodSync,
  closeSync,
  constants,
  fchmodSync,
  fsyncSync,
  mkdirSync,
  openSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { chmod, mkdir, open, rename, rm, type FileHandle } from 'node:fs/promises';
import { dirname } from 'node:path';

import {
  retryWindowsFileSystemOperation,
  retryWindowsFileSystemOperationAsync,
} from './windows-file-system.js';

export interface AtomicWriteFileOptions {
  /**
   * Permission bits of the replaced file, applied to the temporary file before
   * the rename so the mode survives it. Defaults to 0o600. Pass `null` to keep
   * the platform creation default (umask-driven on POSIX).
   */
  readonly mode?: number | null;
  /** fsync the temporary file before renaming it into place. Defaults to false. */
  readonly fsync?: boolean;
  /**
   * Create the parent directory recursively (mode 0o700) when missing.
   * Defaults to true. Pass false when the caller manages the directory itself
   * or when a missing directory must fail the write.
   */
  readonly ensureDirectory?: boolean;
  /**
   * Retry transient Windows file-system errors (EACCES/EBUSY/EPERM) around the
   * rename. The sync variant blocks with backoff; the async variant waits on
   * the event loop.
   */
  readonly retryWindows?: boolean;
}

const TEMP_NAME_ATTEMPTS = 3;

/**
 * Create `directory` (recursively) with owner-only permissions, tightening an
 * existing directory to 0o700 on POSIX. Fails closed: a chmod rejection (e.g.
 * a foreign-owned directory) propagates instead of leaving secrets in a
 * permissive directory. The chmod is skipped on Windows, where POSIX mode bits
 * do not apply.
 */
export async function ensurePrivateDirectory(directory: string): Promise<void> {
  await mkdir(directory, { recursive: true, mode: 0o700 });
  if (process.platform !== 'win32') await chmod(directory, 0o700);
}

/** Synchronous variant of {@link ensurePrivateDirectory}. */
export function ensurePrivateDirectorySync(directory: string): void {
  mkdirSync(directory, { recursive: true, mode: 0o700 });
  if (process.platform !== 'win32') chmodSync(directory, 0o700);
}

/**
 * Atomic file replacement: write a temporary file in the same directory as the
 * target, then rename it over the target. Same-directory placement keeps the
 * rename on one volume; a random exclusive-create name keeps concurrent writers
 * on the same path from clobbering each other (the last rename wins); a failed
 * write or rename removes the temporary file so no residue remains.
 */
export function atomicWriteFileSync(
  path: string,
  data: string | Uint8Array,
  options: AtomicWriteFileOptions = {},
): void {
  const mode = options.mode === undefined ? 0o600 : options.mode;
  if (options.ensureDirectory !== false)
    mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
  let temporaryPath: string | undefined;
  let fd: number | undefined;
  for (let attempt = 0; attempt < TEMP_NAME_ATTEMPTS && fd === undefined; attempt += 1) {
    temporaryPath = `${path}.${process.pid}.${randomBytes(8).toString('hex')}.tmp`;
    try {
      fd = openSync(
        temporaryPath,
        constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL,
        mode === null ? undefined : mode,
      );
    } catch (error) {
      if (isFileExistsError(error)) continue;
      rmSync(temporaryPath, { force: true });
      throw error;
    }
  }
  if (fd === undefined || temporaryPath === undefined) {
    throw new Error(`atomic_write_temp_unavailable:${path}`);
  }
  try {
    if (mode !== null && process.platform !== 'win32') fchmodSync(fd, mode);
    writeFileSync(fd, data);
    if (options.fsync) fsyncSync(fd);
    closeSync(fd);
    fd = undefined;
    const replace = () => renameSync(temporaryPath, path);
    if (options.retryWindows) retryWindowsFileSystemOperation(replace);
    else replace();
  } catch (error) {
    if (fd !== undefined) {
      try {
        closeSync(fd);
      } catch {
        // Best effort: the original write failure is the one being reported.
      }
    }
    rmSync(temporaryPath, { force: true });
    throw error;
  }
}

/** Async variant of {@link atomicWriteFileSync}. */
export async function atomicWriteFile(
  path: string,
  data: string | Uint8Array,
  options: AtomicWriteFileOptions = {},
): Promise<void> {
  const mode = options.mode === undefined ? 0o600 : options.mode;
  if (options.ensureDirectory !== false) await mkdir(dirname(path), { recursive: true, mode: 0o700 });
  let temporaryPath: string | undefined;
  let handle: FileHandle | undefined;
  for (let attempt = 0; attempt < TEMP_NAME_ATTEMPTS && handle === undefined; attempt += 1) {
    temporaryPath = `${path}.${process.pid}.${randomBytes(8).toString('hex')}.tmp`;
    try {
      handle = await open(temporaryPath, 'wx', mode === null ? undefined : mode);
    } catch (error) {
      if (isFileExistsError(error)) continue;
      await rm(temporaryPath, { force: true }).catch(() => undefined);
      throw error;
    }
  }
  if (handle === undefined || temporaryPath === undefined) {
    throw new Error(`atomic_write_temp_unavailable:${path}`);
  }
  try {
    if (mode !== null && process.platform !== 'win32') await handle.chmod(mode);
    await handle.writeFile(data);
    if (options.fsync) await handle.sync();
    await handle.close();
    handle = undefined;
    if (options.retryWindows) {
      await retryWindowsFileSystemOperationAsync(() => rename(temporaryPath, path));
    } else {
      await rename(temporaryPath, path);
    }
  } catch (error) {
    if (handle !== undefined) await handle.close().catch(() => undefined);
    await rm(temporaryPath, { force: true }).catch(() => undefined);
    throw error;
  }
}

function isFileExistsError(error: unknown): boolean {
  return Boolean(error && typeof error === 'object' && 'code' in error && error.code === 'EEXIST');
}
