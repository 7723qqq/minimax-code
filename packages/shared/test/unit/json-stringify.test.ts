import { describe, expect, it } from 'bun:test';

import { safeJsonStringify, tryJsonStringify } from '../../src/json-stringify.js';

describe('safeJsonStringify', () => {
  it('serializes plain JSON values', () => {
    expect(safeJsonStringify({ a: 1 })).toBe('{"a":1}');
    expect(safeJsonStringify([1, 'x'])).toBe('[1,"x"]');
    expect(safeJsonStringify('x')).toBe('"x"');
    expect(safeJsonStringify(null)).toBe('null');
    expect(safeJsonStringify(0)).toBe('0');
    expect(safeJsonStringify(false)).toBe('false');
  });

  it('returns an empty string for values with no JSON representation', () => {
    expect(safeJsonStringify(undefined)).toBe('');
    expect(safeJsonStringify(() => {})).toBe('');
    expect(safeJsonStringify(Symbol('s'))).toBe('');
  });

  it('returns the placeholder when serialization throws', () => {
    const circular: Record<string, unknown> = {};
    circular.self = circular;
    expect(safeJsonStringify(circular)).toBe('[unserializable]');
    expect(safeJsonStringify({ big: 1n })).toBe('[unserializable]');
  });

  it('never throws for hostile input', () => {
    const poison = {
      toJSON() {
        throw new Error('boom');
      },
    };
    expect(safeJsonStringify(poison)).toBe('[unserializable]');
  });
});

describe('tryJsonStringify', () => {
  it('serializes plain JSON values', () => {
    expect(tryJsonStringify({ a: 1 })).toBe('{"a":1}');
    expect(tryJsonStringify('x')).toBe('"x"');
    expect(tryJsonStringify(null)).toBe('null');
  });

  it('returns undefined for values with no JSON representation', () => {
    expect(tryJsonStringify(undefined)).toBeUndefined();
    expect(tryJsonStringify(() => {})).toBeUndefined();
    expect(tryJsonStringify(Symbol('s'))).toBeUndefined();
  });

  it('returns undefined when serialization throws', () => {
    const circular: Record<string, unknown> = {};
    circular.self = circular;
    expect(tryJsonStringify(circular)).toBeUndefined();
    expect(tryJsonStringify({ big: 1n })).toBeUndefined();
  });
});
