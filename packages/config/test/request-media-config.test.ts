import { stubEnv, unstubAllEnvs } from '../../../test/bun-test-setup.js';
import { afterEach, describe, expect, it } from 'bun:test';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { resolveConfigFromRaw } from '../src/config.js';
import {
  REQUEST_MEDIA_DEFAULTS,
  REQUEST_MEDIA_MAX_BASE64_BYTES,
  parseRequestMediaConfig,
} from '../src/request-media-config.js';

const directories: string[] = [];
afterEach(() => {
  unstubAllEnvs();
  for (const directory of directories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

function temporaryDataDir(): string {
  const directory = mkdtempSync(join(tmpdir(), 'mcode-request-media-'));
  directories.push(directory);
  stubEnv('MINIMAX_DATA_DIR', directory);
  stubEnv('__MAVIS_RUNTIME_DATA_DIR', directory);
  stubEnv('__MAVIS_RUNTIME_DISABLE_GIT_AUTO_CONFIG', '1');
  return directory;
}

describe('requestMedia config', () => {
  it('uses the published defaults', () => {
    expect(REQUEST_MEDIA_DEFAULTS).toEqual({
      recoveryDivisor: 2,
      image: {
        max_width: 2_000,
        max_height: 2_000,
        max_base64_bytes: 4_718_592,
      },
    });
    expect(parseRequestMediaConfig(undefined)).toEqual(REQUEST_MEDIA_DEFAULTS);
    expect(parseRequestMediaConfig(null)).toEqual(REQUEST_MEDIA_DEFAULTS);
    expect(parseRequestMediaConfig('requestMedia')).toEqual(REQUEST_MEDIA_DEFAULTS);
    expect(parseRequestMediaConfig({ image: [] })).toEqual(REQUEST_MEDIA_DEFAULTS);
  });

  it('resolves defaults into the full config', () => {
    const directory = temporaryDataDir();
    expect(resolveConfigFromRaw({}, directory).requestMedia).toEqual(REQUEST_MEDIA_DEFAULTS);
  });

  it('accepts overrides for the divisor and image limits', () => {
    expect(
      parseRequestMediaConfig({
        recoveryDivisor: 3,
        image: {
          max_width: 1_200,
          max_height: 800,
          max_base64_bytes: 2_000_000,
        },
      }),
    ).toEqual({
      recoveryDivisor: 3,
      image: {
        max_width: 1_200,
        max_height: 800,
        max_base64_bytes: 2_000_000,
      },
    });
  });

  it('caps the base64 limit at 5 MiB', () => {
    expect(
      parseRequestMediaConfig({ image: { max_base64_bytes: 9_000_000 } }).image
        .max_base64_bytes,
    ).toBe(REQUEST_MEDIA_MAX_BASE64_BYTES);
  });

  it('keeps valid fields when only one field is invalid', () => {
    expect(
      parseRequestMediaConfig({
        recoveryDivisor: 4,
        image: { max_width: -1, max_height: 640 },
      }),
    ).toEqual({
      recoveryDivisor: 4,
      image: {
        max_width: REQUEST_MEDIA_DEFAULTS.image.max_width,
        max_height: 640,
        max_base64_bytes: REQUEST_MEDIA_DEFAULTS.image.max_base64_bytes,
      },
    });
  });

  it('ignores invalid values', () => {
    expect(
      parseRequestMediaConfig({
        recoveryDivisor: 1,
        image: { max_width: 1.5, max_height: 0, max_base64_bytes: -2 },
      }),
    ).toEqual(REQUEST_MEDIA_DEFAULTS);
    expect(parseRequestMediaConfig({ recoveryDivisor: Number.NaN })).toEqual(
      REQUEST_MEDIA_DEFAULTS,
    );
  });
});
