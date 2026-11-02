/**
 * JSON.stringify that never throws and always returns a string.
 *
 * Standard semantics for token estimators and byte measurement:
 *   - `JSON.stringify` returns `undefined` for `undefined`, functions and
 *     symbols at the top level — normalized to `''` (there is no JSON
 *     representation to count or measure).
 *   - Serialization failures (circular references, BigInt values) yield the
 *     `'[unserializable]'` placeholder so callers keep a "something was here"
 *     signal instead of a throw.
 *
 * This is the single source of truth for the estimator/measurement helper;
 * do not re-implement it per package. Variants with genuinely different
 * contracts are NOT this function: redaction-aware or byte-budgeted
 * serialization has its own sibling in this package (`bounded-json-stringify`),
 * pretty-printing for display stays local, and the `string | undefined`
 * flavour has its own shared home below as `tryJsonStringify`.
 */
export function safeJsonStringify(value: unknown): string {
  try {
    return JSON.stringify(value) ?? '';
  } catch {
    return '[unserializable]';
  }
}

/**
 * JSON.stringify that reports failure as `undefined` instead of throwing.
 *
 * Deliberately distinct from `safeJsonStringify`: no `''` normalization and
 * no placeholder — `undefined` means "there is no usable JSON string"
 * (input was `undefined`/function/symbol, or serialization threw). Use it
 * where the absence of a string is itself the signal (e.g. permission-rule
 * target extraction, peek-line formatting) and a placeholder would end up
 * being matched against or displayed.
 */
export function tryJsonStringify(value: unknown): string | undefined {
  try {
    return JSON.stringify(value);
  } catch {
    return undefined;
  }
}
