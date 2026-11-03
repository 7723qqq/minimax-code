/**
 * Focused coverage for the `/status` account identity and Token Plan quota
 * countdown that the public projection ships.
 *
 * Bun port: `jest.useFakeTimers` + `jest.setSystemTime` replace vitest's
 * `vi.useFakeTimers({ now })`; assertions are unchanged. The suite runner pins
 * `MCODE_LOCALE=en`, so the catalog-backed copy renders in English here.
 */
import { afterEach, describe, expect, it, jest } from 'bun:test';

import { normalizeAccountStatus } from '../../src/runtime/adapters/normalizers.js';
import { formatTuiAccountStatus } from '../../src/tui/features/inspection/product-inspection.js';

const nowMs = Date.UTC(2026, 9, 27, 7, 40);

function statusWithResets(
  fiveHourResetAtMs: number,
  weeklyResetAtMs: number,
): string {
  return formatTuiAccountStatus(
    normalizeAccountStatus({
      provider: { id: 'minimax', authMode: 'managed-login' },
      auth: { tokenPresent: true },
      modelSource: 'token-plan',
      tokenPlanQuotaState: 'available',
      tokenPlanQuota: {
        fiveHour: {
          remainingPercent: 100,
          unlimited: false,
          resetAtMs: fiveHourResetAtMs,
        },
        weekly: {
          remainingPercent: 99,
          unlimited: false,
          resetAtMs: weeklyResetAtMs,
        },
      },
      warnings: [],
    }),
  );
}

describe('MCode /status account presentation', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('shows the editable profile name before the account email', () => {
    const output = formatTuiAccountStatus({
      ...normalizeAccountStatus({
        provider: { id: 'minimax', authMode: 'managed-login' },
        auth: { tokenPresent: true },
        warnings: [],
      }),
      identity: { email: 'dev@example.com', name: '令酱' },
    });

    expect(output).toContain('Account: 令酱');
    expect(output).not.toContain('Account: dev@example.com');
  });

  it('falls back to the account email when no profile name is known', () => {
    const output = formatTuiAccountStatus({
      ...normalizeAccountStatus({
        provider: { id: 'minimax', authMode: 'managed-login' },
        auth: { tokenPresent: true },
        warnings: [],
      }),
      identity: { email: 'dev@example.com' },
    });

    expect(output).toContain('Account: dev@example.com');
  });

  it('rounds partial minutes down instead of overstating the time left', () => {
    jest.useFakeTimers();
    jest.setSystemTime(nowMs);

    const output = statusWithResets(
      nowMs + (4 * 60 + 59) * 60_000 + 30_000,
      nowMs + (22 * 60 + 43) * 60_000 + 59_000,
    );

    expect(output).toContain('5-hour: 100% left · resets in 4h 59m');
    expect(output).toContain('Weekly: 99% left · resets in 22h 43m');
  });

  it('never shows a 5-hour reset farther away than the window itself', () => {
    jest.useFakeTimers();
    jest.setSystemTime(nowMs);

    const output = statusWithResets(
      nowMs + (5 * 60 + 1) * 60_000 + 20_000,
      nowMs + 60_000,
    );

    expect(output).toContain('5-hour: 100% left · resets in 5h 0m');
    expect(output).not.toContain('5h 1m');
  });

  it('keeps the last minute visible until the reset is due', () => {
    jest.useFakeTimers();
    jest.setSystemTime(nowMs);

    expect(statusWithResets(nowMs + 30_000, nowMs - 1)).toMatch(
      /5-hour: 100% left · resets in <1m[\s\S]*Weekly: 99% left · reset pending/u,
    );
  });
});
