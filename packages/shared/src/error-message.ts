/**
 * Error → display/log string extraction, single source of truth.
 *
 * Standard semantics (identical to the per-package `describeError` /
 * `errorMessage` helpers this replaces at lossy call sites):
 *   - `Error` instances yield `.message` (no `"Error: "` prefix).
 *   - Anything else (thrown strings, numbers, plain objects) goes through
 *     `String(...)` so the value still shows up in the log/state field.
 *
 * The unsafe variant this exists to retire is `(err as Error).message` in a
 * `catch` path: for a non-Error throw it evaluates to `undefined`, so the
 * failure detail disappears from logs exactly when something unexpected
 * happened. Catch clauses receive `unknown`; do not cast the check away.
 *
 * Variants with genuinely different contracts (e.g. cause-chaining
 * `describeErrorWithCause`, or message-identity comparisons like
 * `err.message === 'Operation aborted'`) are NOT this function and stay local.
 */
export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
