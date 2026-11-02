import { afterEach, beforeEach, describe, expect, it } from 'bun:test';

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { atomicWriteFile, atomicWriteFileSync, ensurePrivateDirectory, ensurePrivateDirectorySync } from '../../src/atomic-write.js';

let root: string;

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'atomic-write-test-'));
});

afterEach(() => {
  fs.rmSync(root, { recursive: true, force: true });
});

function tempResidue(directory: string): string[] {
  return fs.readdirSync(directory).filter((name) => name.includes('.tmp'));
}

describe('atomicWriteFileSync', () => {
  it('writes exact bytes and replaces existing content', () => {
    const file = path.join(root, 'config.json');
    fs.writeFileSync(file, 'old-content-with-extra-length');
    atomicWriteFileSync(file, '{"next":true}\n');
    expect(fs.readFileSync(file, 'utf8')).toBe('{"next":true}\n');
    atomicWriteFileSync(file, Buffer.from([0, 1, 2, 255]));
    expect(fs.readFileSync(file)).toEqual(Buffer.from([0, 1, 2, 255]));
  });

  it('applies the default private mode on POSIX', () => {
    if (process.platform === 'win32') return;
    const file = path.join(root, 'private.json');
    atomicWriteFileSync(file, 'x');
    expect(fs.statSync(file).mode & 0o777).toBe(0o600);
  });

  it('applies a caller-provided mode on POSIX', () => {
    if (process.platform === 'win32') return;
    const file = path.join(root, 'launcher.sh');
    atomicWriteFileSync(file, '#!/bin/sh\n', { mode: 0o755 });
    expect(fs.statSync(file).mode & 0o777).toBe(0o755);
  });

  it('creates the parent directory by default and honors ensureDirectory:false', () => {
    const nested = path.join(root, 'missing', 'deep', 'file.json');
    atomicWriteFileSync(nested, 'x');
    expect(fs.readFileSync(nested, 'utf8')).toBe('x');
    if (process.platform !== 'win32') {
      expect(fs.statSync(path.dirname(nested)).mode & 0o777).toBe(0o700);
    }
    const blocked = path.join(root, 'absent', 'file.json');
    expect(() => atomicWriteFileSync(blocked, 'x', { ensureDirectory: false })).toThrow();
    expect(fs.existsSync(path.dirname(blocked))).toBe(false);
  });

  it('leaves no temporary file and keeps the original content when the rename fails', () => {
    // A directory at the target path makes the rename fail on every platform.
    const target = path.join(root, 'occupied');
    fs.mkdirSync(target);
    expect(() => atomicWriteFileSync(target, 'x', { ensureDirectory: false })).toThrow();
    expect(tempResidue(root)).toEqual([]);
    expect(fs.statSync(target).isDirectory()).toBe(true);
  });

  it('keeps the original file when the temporary write fails', () => {
    const file = path.join(root, 'kept.json');
    fs.writeFileSync(file, 'original');
    const missingParent = path.join(root, 'gone', 'file.json');
    expect(() =>
      atomicWriteFileSync(missingParent, 'x', { ensureDirectory: false }),
    ).toThrow();
    expect(tempResidue(root)).toEqual([]);
    expect(fs.readFileSync(file, 'utf8')).toBe('original');
  });

  it('supports fsync and retryWindows options', () => {
    const file = path.join(root, 'durable.json');
    atomicWriteFileSync(file, 'x', { fsync: true, retryWindows: true });
    expect(fs.readFileSync(file, 'utf8')).toBe('x');
  });
});

describe('atomicWriteFile', () => {
  it('writes exact bytes and replaces existing content', async () => {
    const file = path.join(root, 'state.json');
    await atomicWriteFile(file, 'first');
    await atomicWriteFile(file, 'second');
    expect(fs.readFileSync(file, 'utf8')).toBe('second');
  });

  it('applies the default private mode on POSIX', async () => {
    if (process.platform === 'win32') return;
    const file = path.join(root, 'private.json');
    await atomicWriteFile(file, 'x');
    expect(fs.statSync(file).mode & 0o777).toBe(0o600);
  });

  it('leaves no temporary file when the rename fails', async () => {
    const target = path.join(root, 'occupied');
    fs.mkdirSync(target);
    await expect(
      atomicWriteFile(target, 'x', { ensureDirectory: false }),
    ).rejects.toThrow();
    expect(tempResidue(root)).toEqual([]);
  });

  it('keeps concurrent writers on the same path from clobbering each other', async () => {
    const file = path.join(root, 'race.json');
    // Concurrent renames onto one target can hit transient EPERM/EACCES on
    // Windows under load; same-path concurrent writers opt into retryWindows.
    // The invariant: a write either lands completely or fails loudly — never
    // torn content, never temporary-file residue.
    const writes = Array.from({ length: 8 }, (_, index) =>
      atomicWriteFile(file, `writer-${index}-${'x'.repeat(1024)}`, { retryWindows: true }),
    );
    const results = await Promise.allSettled(writes);
    for (const result of results) {
      if (result.status === 'rejected') {
        expect((result.reason as NodeJS.ErrnoException)?.code).toMatch(/^(EPERM|EACCES|EBUSY)$/u);
      }
    }
    expect(results.some((result) => result.status === 'fulfilled')).toBe(true);
    const final = fs.readFileSync(file, 'utf8');
    expect(/^writer-\d-x{1024}$/u.test(final)).toBe(true);
    expect(tempResidue(root)).toEqual([]);
  });

  it('supports fsync', async () => {
    const file = path.join(root, 'durable.json');
    await atomicWriteFile(file, 'x', { fsync: true });
    expect(fs.readFileSync(file, 'utf8')).toBe('x');
  });

  it('keeps the platform creation default when mode is null', async () => {
    const file = path.join(root, 'asset.bin');
    await atomicWriteFile(file, Buffer.from([1, 2, 3]), { mode: null });
    expect(fs.readFileSync(file)).toEqual(Buffer.from([1, 2, 3]));
    if (process.platform !== 'win32') {
      // The creation default is umask-driven; it must not be forced private.
      expect(fs.statSync(file).mode & 0o077).not.toBe(0);
    }
  });
});

describe('ensurePrivateDirectory', () => {
  it('creates nested directories and tightens an existing permissive one on POSIX', async () => {
    const nested = path.join(root, 'a', 'b');
    await ensurePrivateDirectory(nested);
    ensurePrivateDirectorySync(nested);
    expect(fs.statSync(nested).isDirectory()).toBe(true);
    if (process.platform === 'win32') return;
    expect(fs.statSync(nested).mode & 0o777).toBe(0o700);
    fs.chmodSync(nested, 0o755);
    await ensurePrivateDirectory(nested);
    expect(fs.statSync(nested).mode & 0o777).toBe(0o700);
    fs.chmodSync(nested, 0o755);
    ensurePrivateDirectorySync(nested);
    expect(fs.statSync(nested).mode & 0o777).toBe(0o700);
  });
});
