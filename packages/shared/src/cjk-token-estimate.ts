/**
 * CJK / fullwidth ranges that consume roughly one BPE token per character.
 * Expressed as code-point comparisons to avoid source-encoding ambiguity.
 * Covers: CJK symbols & punctuation, Hiragana/Katakana, CJK Ext-A, CJK
 * Unified Ideographs, CJK Compatibility Ideographs, halfwidth/fullwidth forms,
 * Hangul syllables, and CJK Ext-B+ (astral).
 *
 * Range comparisons instead of a per-character regex: the fallback path scans
 * whole transcripts, and integer comparisons are allocation-free and measurably
 * faster than `RegExp.test` per code point for the exact same predicate.
 */
function isCjkCodePoint(cp: number): boolean {
  return (
    (cp >= 0x3000 && cp <= 0x303f) ||
    (cp >= 0x3040 && cp <= 0x30ff) ||
    (cp >= 0x3400 && cp <= 0x4dbf) ||
    (cp >= 0x4e00 && cp <= 0x9fff) ||
    (cp >= 0xf900 && cp <= 0xfaff) ||
    (cp >= 0xff00 && cp <= 0xffef) ||
    (cp >= 0xac00 && cp <= 0xd7af) ||
    (cp >= 0x20000 && cp <= 0x2fa1f)
  );
}

/**
 * CJK-aware char→token estimate. CJK / fullwidth code points consume roughly
 * one token each; other (mostly ASCII) text averages ~4 chars per token. This
 * is the fallback when a remote count endpoint times out or fails — far
 * closer to truth for Chinese than the legacy `chars/4` which under-counts
 * CJK 4-8x.
 *
 * Single source of truth consumed by context-manager, local-runtime and
 * agent-tools; do not re-implement per package.
 */
export function estimateCharsToTokensCjkAware(text: string): number {
  if (!text) return 0;
  let cjk = 0;
  let other = 0;
  for (let i = 0; i < text.length; i++) {
    const cp = text.codePointAt(i)!;
    if (cp > 0xffff) i += 1; // Astral code point: skip the trail surrogate.
    if (isCjkCodePoint(cp)) cjk += 1;
    else other += 1;
  }
  return cjk + Math.ceil(other / 4);
}
