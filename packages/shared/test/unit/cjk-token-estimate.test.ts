import { describe, expect, it } from 'bun:test';

import { estimateCharsToTokensCjkAware } from '../../src/cjk-token-estimate.js';

describe('estimateCharsToTokensCjkAware', () => {
  it('returns 0 for empty text', () => {
    expect(estimateCharsToTokensCjkAware('')).toBe(0);
  });

  it('averages ~4 chars per token for non-CJK text', () => {
    expect(estimateCharsToTokensCjkAware('hello')).toBe(2); // ceil(5/4)
    expect(estimateCharsToTokensCjkAware('abcd')).toBe(1);
    expect(estimateCharsToTokensCjkAware('abcde')).toBe(2);
  });

  it('counts one token per CJK character instead of chars/4', () => {
    expect(estimateCharsToTokensCjkAware('你好')).toBe(2);
    expect(estimateCharsToTokensCjkAware('你好世界')).toBe(4); // chars/4 would say 1
    expect(estimateCharsToTokensCjkAware('こんにちは')).toBe(5);
    expect(estimateCharsToTokensCjkAware('한글')).toBe(2);
  });

  it('mixes CJK and ASCII independently', () => {
    expect(estimateCharsToTokensCjkAware('你好ab')).toBe(3); // 2 + ceil(2/4)
    expect(estimateCharsToTokensCjkAware('a你b世c')).toBe(3); // 2 + ceil(3/4)
  });

  it('counts astral CJK code points once, not per surrogate half', () => {
    expect(estimateCharsToTokensCjkAware('\u{20000}')).toBe(1); // CJK Ext-B
    expect(estimateCharsToTokensCjkAware('\u{20000}\u{20001}')).toBe(2);
    // An astral non-CJK code point counts as ONE "other" char.
    expect(estimateCharsToTokensCjkAware('\u{1F600}')).toBe(1); // ceil(1/4)
  });

  it('treats lone surrogates as ordinary non-CJK chars without throwing', () => {
    expect(estimateCharsToTokensCjkAware('\uD842')).toBe(1); // lone high surrogate
    expect(estimateCharsToTokensCjkAware('\uDC00')).toBe(1); // lone low surrogate
    expect(estimateCharsToTokensCjkAware('\uD842x')).toBe(1); // ceil(2/4)
  });

  it.each([
    // [codePoint, isCjk]
    [0x2fff, false], // just below CJK Symbols
    [0x3000, true], // ideographic space
    [0x303f, true],
    [0x30ff, true], // end of Katakana
    [0x3100, false], // gap between Katakana and Ext-A (Bopomofo)
    [0x33ff, false], // still in the gap
    [0x3400, true], // CJK Ext-A start
    [0x4dbf, true],
    [0x4dc0, false], // gap (Yijing hexagrams)
    [0x4e00, true], // Unified Ideographs start
    [0x9fff, true],
    [0xa000, false],
    [0xf900, true], // Compatibility Ideographs
    [0xfaff, true],
    [0xfb00, false],
    [0xff00, true], // Halfwidth/Fullwidth Forms
    [0xffef, true],
    [0xfff0, false],
    [0xac00, true], // Hangul syllables
    [0xd7af, true],
    [0xd7b0, false],
    [0x20000, true], // CJK Ext-B (astral)
    [0x2fa1f, true],
    [0x2fa20, false],
  ] as const)('classifies U+%s boundary code points correctly', (cp, isCjk) => {
    const text = String.fromCodePoint(cp);
    // Two copies plus 4 ASCII chars: CJK → 2 + ceil(4/4) = 3;
    // non-CJK → ceil(6/4) = 2.
    const pair = text + text + 'abcd';
    expect(estimateCharsToTokensCjkAware(pair)).toBe(isCjk ? 3 : 2);
  });
});
