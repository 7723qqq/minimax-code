import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * The bridge imports the plugin-hook Session hooks from their own package
 * subpath rather than the Turn system barrel.
 *
 * Measured on the built bundle, resolving the barrel statically put the whole
 * in-process runtime into the eager closure of `tui/app.ts`: 855 modules /
 * 5.35 MB became 2375 modules / 12.7 MB and dragged in the 2.7 MB `o200k_base`
 * rank table. The launcher already defers the runtime itself
 * (`launcher.ts`, `loadRuntimeLifecycle`), and `app.ts` is imported eagerly at
 * the top of the launcher, so this one import defeated that split.
 *
 * The subpath must not be replaced by a dynamic `import()`: this file's callers
 * await the switch, and a lazy chunk transform cost seconds on the first `/new`
 * in the test suite.
 *
 * The module is mocked because these assertions are about which hook fires with
 * which arguments, not about the coordinator's own state.
 */
const hooks = vi.hoisted(() => ({
  markNextLocalPluginHookSessionStart: vi.fn(),
  endLocalPluginHookSession: vi.fn(async () => undefined),
  abortLocalPluginHookSessionTurn: vi.fn(
    async (_sessionId: string, abortSession: (id: string) => Promise<unknown>) => {
      await abortSession('execution-1');
    },
  ),
}));

vi.mock('@mavis/local-runtime-v2/plugin-hook-session', () => hooks);

const { createTuiSessionLifecycleBridge } = await import(
  '../../src/tui/controller/session-lifecycle-bridge.js'
);

const abortSession = vi.fn(async (_input: unknown) => undefined);
const runtime = { abortSession } as unknown as Parameters<
  typeof createTuiSessionLifecycleBridge
>[0];

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('createTuiSessionLifecycleBridge', () => {
  it('flags the first Session after a clear, and only that one', async () => {
    const bridge = createTuiSessionLifecycleBridge(runtime);

    // A Session that starts without a preceding clear must not be flagged.
    bridge.onSessionLifecycle('session-without-clear');
    await vi.waitFor(() =>
      expect(hooks.markNextLocalPluginHookSessionStart).not.toHaveBeenCalled(),
    );

    bridge.onSessionLifecycle(undefined);
    bridge.onSessionLifecycle('session-after-clear');
    await vi.waitFor(() =>
      expect(hooks.markNextLocalPluginHookSessionStart).toHaveBeenCalledWith(
        'session-after-clear',
        'clear',
      ),
    );

    // The latch is consumed once, so a later start is not flagged again.
    hooks.markNextLocalPluginHookSessionStart.mockClear();
    bridge.onSessionLifecycle('session-after-clear-again');
    await Promise.resolve();
    await Promise.resolve();
    expect(hooks.markNextLocalPluginHookSessionStart).not.toHaveBeenCalled();
  });

  it('aborts the live Turn as session_leave before ending the Session', async () => {
    const bridge = createTuiSessionLifecycleBridge(runtime);

    await bridge.preparePluginHookSessionSwitch('session-1', 'clear');

    expect(hooks.abortLocalPluginHookSessionTurn).toHaveBeenCalledWith(
      'session-1',
      expect.any(Function),
    );
    expect(hooks.endLocalPluginHookSession).toHaveBeenCalledWith('session-1', 'clear');
    // The abort callback must forward `session_leave`, not `user_stop`.
    expect(abortSession).toHaveBeenCalledWith({
      id: 'execution-1',
      reason: 'session_leave',
    });
  });

  it('adopts a foreground run only when it belongs to the active Session', () => {
    const bridge = createTuiSessionLifecycleBridge(runtime);
    const events = { adoptRuntimeTurn: vi.fn() };

    bridge.adoptForegroundRun(
      'session-1',
      { sessionId: 'session-1', turnId: 'turn-1', state: 'running' },
      events,
    );
    expect(events.adoptRuntimeTurn).toHaveBeenCalledWith(
      'session-1',
      'turn-1',
      expect.any(Number),
    );

    events.adoptRuntimeTurn.mockClear();
    bridge.adoptForegroundRun(
      'session-1',
      { sessionId: 'other-session', turnId: 'turn-2', state: 'running' },
      events,
    );
    bridge.adoptForegroundRun(
      'session-1',
      { sessionId: 'session-1', turnId: 'turn-3', state: 'idle' },
      events,
    );
    expect(events.adoptRuntimeTurn).not.toHaveBeenCalled();
  });
});
