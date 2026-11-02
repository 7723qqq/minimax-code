import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { registerLocalAsset, registerLocalAssetSync } from '../../src/assets/store.js';

let root: string;
let dataDir: string;

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'local-asset-store-test-'));
  dataDir = path.join(root, 'data');
});

afterEach(() => {
  fs.rmSync(root, { recursive: true, force: true });
});

function tempResidue(directory: string): string[] {
  if (!fs.existsSync(directory)) return [];
  return fs
    .readdirSync(directory, { recursive: true })
    .map(String)
    .filter((name) => name.includes('.tmp'));
}

function sourceFile(name: string, bytes: Buffer): string {
  const file = path.join(root, name);
  fs.writeFileSync(file, bytes);
  return file;
}

describe('registerLocalAsset atomic write', () => {
  it('materializes payload, sidecar and manifest with exact bytes (async)', async () => {
    const bytes = Buffer.from('asset-payload-\u00e4\u00b8\u00ad\u00e6\u0096\u0087', 'utf8');
    const record = await registerLocalAsset({
      dataDir,
      fileName: 'note.txt',
      mimeType: 'text/plain',
      sourcePath: sourceFile('note.txt', bytes),
    });
    expect(fs.readFileSync(record.absolutePath)).toEqual(bytes);
    const sidecar = JSON.parse(fs.readFileSync(`${record.absolutePath}.asset.json`, 'utf8')) as {
      sha256: string;
      bytes: number;
    };
    expect(sidecar.sha256).toBe(record.sha256);
    expect(sidecar.bytes).toBe(bytes.byteLength);
    const manifest = fs.readFileSync(path.join(path.dirname(record.absolutePath), 'assets.jsonl'), 'utf8');
    expect(manifest).toContain(record.assetId);
    expect(tempResidue(path.dirname(record.absolutePath))).toEqual([]);
  });

  it('materializes payload, sidecar and manifest with exact bytes (sync)', () => {
    const bytes = Buffer.from([0, 1, 2, 250, 251, 255]);
    const record = registerLocalAssetSync({
      dataDir,
      fileName: 'blob.bin',
      sourcePath: sourceFile('blob.bin', bytes),
    });
    expect(fs.readFileSync(record.absolutePath)).toEqual(bytes);
    expect(fs.existsSync(`${record.absolutePath}.asset.json`)).toBe(true);
    expect(tempResidue(path.dirname(record.absolutePath))).toEqual([]);
  });

  it('keeps the platform creation default for asset bytes on POSIX', () => {
    if (process.platform === 'win32') return;
    const record = registerLocalAssetSync({
      dataDir,
      fileName: 'perm.bin',
      sourcePath: sourceFile('perm.bin', Buffer.from('x')),
    });
    // Asset payloads are raw user files: no forced 0o600.
    expect(fs.statSync(record.absolutePath).mode & 0o077).not.toBe(0);
  });
});
