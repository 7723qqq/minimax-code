import { describe, expect, it } from 'bun:test';

import { errorMessage } from '../../src/error-message.js';

describe('errorMessage', () => {
  it('extracts .message from Error instances without the "Error: " prefix', () => {
    expect(errorMessage(new Error('boom'))).toBe('boom');
    expect(errorMessage(new TypeError('bad type'))).toBe('bad type');
  });

  it('passes thrown non-Error values through String()', () => {
    expect(errorMessage('plain failure')).toBe('plain failure');
    expect(errorMessage(42)).toBe('42');
    expect(errorMessage(null)).toBe('null');
    expect(errorMessage(undefined)).toBe('undefined');
  });

  it('never returns undefined for non-Error throws (the retired (err as Error).message failure mode)', () => {
    // A thrown string used to log as `err=undefined`; the whole point of the
    // helper is that the failure detail survives.
    expect(typeof errorMessage('string-thrown')).toBe('string');
    expect(errorMessage('string-thrown')).not.toBe('undefined');
  });
});
