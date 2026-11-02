import { describe, expect, it } from 'bun:test';
import { MINIMAX_CODE_MIN_BUN_VERSION, supportsBunVersion } from '../../src/build-info.js';

describe('supportsBunVersion', () => {
  it('accepts the minimum and newer Bun releases', () => {
    expect(supportsBunVersion(MINIMAX_CODE_MIN_BUN_VERSION)).toBe(true);
    expect(supportsBunVersion('1.5.0')).toBe(true);
    expect(supportsBunVersion('2.0.0')).toBe(true);
  });

  it('accepts a pre-release suffix on a supported release line', () => {
    expect(supportsBunVersion('1.4.4-canary.1')).toBe(true);
  });

  it('rejects older releases', () => {
    expect(supportsBunVersion('1.4.3')).toBe(false);
    expect(supportsBunVersion('1.3.9')).toBe(false);
    expect(supportsBunVersion('0.8.0')).toBe(false);
  });

  it('rejects values that are not a version', () => {
    expect(supportsBunVersion('')).toBe(false);
    expect(supportsBunVersion('bun')).toBe(false);
  });
});
