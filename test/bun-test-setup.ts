// Test setup for the Bun test runner.
//
// `bun:test` covers the test primitives this repository needs: `describe`,
// `it`, `expect`, `mock()` for mock functions, `mock.module()` for module
// replacement, `spyOn`, and the `jest` timer and spy surface.
//
// A few capabilities have no Bun equivalent, and they are collected here
// rather than spread across the suite:
//
//   * `waitFor` — polling an assertion until it passes. Bun ships no
//     equivalent, so the retry loop uses Bun's own scheduler.
//   * `mocked` — narrowing a function to its mock type. It is a compile-time
//     concern only, so the value passes through unchanged.
//   * `stubEnv` / `stubGlobal` — replacing an environment variable or a global
//     for the duration of a test.
//   * `advanceTimersByTimeAsync` — advancing fake timers and draining the
//     microtask queue.
//   * `toHaveBeenCalledExactlyOnceWith` — the combined call-count and
//     argument matcher.
//
// Nothing here emulates a module runner or another test framework. Module
// replacement is `mock.module()` from `bun:test`.
//
// Load it with `bun test --preload ./test/bun-test-setup.ts`.
import { expect, jest, mock } from 'bun:test';

export type MockedFunction<T> = T extends (...args: never[]) => unknown ? T : never;

/**
 * Narrow a function to its mock type.
 *
 * The narrowing is a compile-time concern, so the value passes through
 * unchanged and only the type is refined.
 */
export function mocked<T>(value: T): T {
  return value;
}

export type WaitForOptions = {
  readonly timeout?: number;
  readonly interval?: number;
};

/**
 * Poll `callback` until it stops throwing.
 *
 * The retry loop is Bun's own scheduler plus `Bun.sleep`, so no timer is faked
 * while waiting.
 */
export async function waitFor<T>(
  callback: () => T | Promise<T>,
  options: WaitForOptions = {},
): Promise<T> {
  const timeout = options.timeout ?? 1_000;
  const interval = options.interval ?? 50;
  const deadline = performance.now() + Math.max(0, timeout);
  let lastError: unknown;
  for (;;) {
    try {
      return await callback();
    } catch (error) {
      lastError = error;
    }
    if (performance.now() >= deadline) throw lastError;
    await Bun.sleep(interval);
  }
}

const savedEnvironment = new Map<string, string | undefined>();
const savedGlobals = new Map<string, unknown>();

/**
 * Set environment variables for the duration of a test.
 *
 * A value of `undefined` removes the variable, matching what the runtime's
 * configuration code observes.
 */
export function stubEnv(name: string | Record<string, string>, value?: string): void {
  const entries = typeof name === 'string' ? { [name]: value } : name;
  for (const [key, next] of Object.entries(entries)) {
    if (!savedEnvironment.has(key)) savedEnvironment.set(key, process.env[key]);
    if (next === undefined) delete process.env[key];
    else process.env[key] = next;
  }
}

/** Restore every environment variable replaced by `stubEnv`. */
export function unstubAllEnvs(): void {
  for (const [key, value] of savedEnvironment) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  savedEnvironment.clear();
}

/** Replace a global for the duration of a test. */
export function stubGlobal(name: string, value: unknown): void {
  if (!savedGlobals.has(name)) {
    savedGlobals.set(name, (globalThis as Record<string, unknown>)[name]);
  }
  (globalThis as Record<string, unknown>)[name] = value;
}

/** Restore every global replaced by `stubGlobal`. */
export function unstubAllGlobals(): void {
  for (const [name, value] of savedGlobals) {
    (globalThis as Record<string, unknown>)[name] = value;
  }
  savedGlobals.clear();
}

/**
 * Advance fake timers and let the code under test settle.
 *
 * `bun:test` exposes `advanceTimersByTime()` but not the async variant, so the
 * helper has to do both halves itself.
 *
 * The clock cannot simply move once. `advanceTimersByTime()` fires the timers
 * that are already registered, and a timer the code under test registers
 * *after* an `await` only comes into existence once that await has settled.
 * Moving the clock first would leave such a timer scheduled past the moment
 * the clock already reached, so it would never fire.
 *
 * The helper therefore alternates: drain the microtask queue, and move the
 * clock by the budget that is still unspent whenever a timer is waiting for
 * it. The budget is spent once, not per round, so a timer that is registered
 * late still fires at the requested deadline instead of an earlier one. That
 * is the shape of `sinon`'s `tickAsync`, which Vitest's
 * `advanceTimersByTimeAsync` is built on.
 */
export async function advanceTimersByTimeAsync(milliseconds: number): Promise<void> {
  let remaining = Math.max(0, milliseconds);
  for (let round = 0; round < 100; round += 1) {
    for (let index = 0; index < 10; index += 1) await Promise.resolve();
    // The budget is spent once. Advancing again with `0` would move the clock
    // by a millisecond — Bun treats `advanceTimersByTime(0)` as one millisecond
    // so that zero-delay timers fire — and that would fire a timer before its
    // deadline.
    if (remaining <= 0 || jest.getTimerCount() === 0) continue;
    jest.advanceTimersByTime(remaining);
    remaining = 0;
  }
  for (let index = 0; index < 10; index += 1) await Promise.resolve();
}

interface MockCallState {
  readonly mock?: {
    readonly calls?: readonly unknown[][];
  };
}

expect.extend({
  /**
   * Assert a mock was called exactly once, with the given arguments.
   *
   * `bun:test` ships `toHaveBeenCalledOnce()` and `toHaveBeenCalledWith()`, but
   * not the combined matcher. The recorded calls live on `mock.calls`, matching
   * Vitest's layout.
   */
  toHaveBeenCalledExactlyOnceWith(received: unknown, ...expected: unknown[]) {
    const calls = (received as MockCallState | undefined)?.mock?.calls;
    if (!Array.isArray(calls)) {
      return {
        pass: false,
        message: () => 'expected a mock function with recorded calls',
      };
    }
    if (calls.length !== 1) {
      return {
        pass: false,
        message: () => `expected 1 call, received ${calls.length}`,
      };
    }
    const [arguments_] = calls;
    const pass = expected.every((value, index) => Object.is(arguments_[index], value));
    return {
      pass,
      message: () =>
        pass
          ? 'expected the mock not to be called exactly once with these arguments'
          : `expected the single call to receive ${JSON.stringify(expected)}, received ${JSON.stringify(arguments_)}`,
    };
  },
});

export { mock };
