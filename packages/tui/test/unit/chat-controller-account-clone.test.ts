import { describe, expect, it } from 'vitest';

import {
  cloneAccountStatus,
  cloneAccountStatusForSnapshot,
} from '../../src/tui/controller/chat-controller-support.js';
import type { TuiAccountStatus } from '../../src/runtime/port.js';

/**
 * The controller clones the account on every notification, and a notification
 * fires per stream delta. The clone is a defensive copy that callers must not be
 * able to use to mutate controller state, so it has to stay; memoizing it on the
 * source object identity keeps that guarantee while avoiding the copy when no
 * token delta could have changed the account.
 */

function account(overrides: Partial<TuiAccountStatus> = {}): TuiAccountStatus {
  return {
    status: 'authenticated',
    tokenPlanSummary: { plan: 'pro', remaining: 100 },
    tokenPlanQuota: {
      fiveHour: { used: 1, limit: 10 },
      weekly: { used: 2, limit: 20 },
    },
    warnings: ['first warning'],
    ...overrides,
  } as unknown as TuiAccountStatus;
}

describe('cloneAccountStatus', () => {
  it('deep-copies the nested quota, summary and warnings', () => {
    const source = account();
    const cloned = cloneAccountStatus(source)!;

    expect(cloned).not.toBe(source);
    expect(cloned.tokenPlanQuota?.fiveHour).not.toBe(source.tokenPlanQuota?.fiveHour);
    expect(cloned.tokenPlanQuota?.weekly).not.toBe(source.tokenPlanQuota?.weekly);
    expect(cloned.tokenPlanSummary).not.toBe(source.tokenPlanSummary);
    expect(cloned.warnings).not.toBe(source.warnings);
    expect(cloned.warnings).toEqual(source.warnings);
  });

  it('returns undefined for an absent account', () => {
    expect(cloneAccountStatus(undefined)).toBeUndefined();
    expect(cloneAccountStatusForSnapshot(undefined)).toBeUndefined();
  });
});

describe('cloneAccountStatusForSnapshot', () => {
  it('reuses the clone for an unchanged account object', () => {
    const source = account();
    expect(cloneAccountStatusForSnapshot(source)).toBe(cloneAccountStatusForSnapshot(source));
  });

  it('still hands every caller a copy that cannot mutate the source', () => {
    const source = account();
    const cloned = cloneAccountStatusForSnapshot(source)!;

    // The memoized object is still a detached copy, not the source itself.
    expect(cloned).not.toBe(source);
    cloned.warnings.push('mutated by a consumer');
    cloned.tokenPlanQuota!.fiveHour.used = 999;

    expect(source.warnings).toEqual(['first warning']);
    expect(source.tokenPlanQuota?.fiveHour.used).toBe(1);
  });

  it('recomputes when the account object is replaced', () => {
    const first = account();
    const second = account({ warnings: ['second warning'] });

    expect(cloneAccountStatusForSnapshot(first)!.warnings).toEqual(['first warning']);
    expect(cloneAccountStatusForSnapshot(second)!.warnings).toEqual(['second warning']);
  });
});
