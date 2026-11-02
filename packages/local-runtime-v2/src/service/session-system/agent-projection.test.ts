import { describe, expect, it } from 'bun:test';

import {
  createSessionSystemAgentProjection,
  type SessionSystemAgentProjectionOptions,
} from './agent-projection.js';

interface RecordedCalls {
  readonly markTerminal: Record<string, unknown>[];
  readonly update: { readonly id: string; readonly patch: Record<string, unknown> }[];
  readonly write: Record<string, unknown>[];
}

function makeProjection(input: { readonly updateResult?: boolean } = {}) {
  const calls: RecordedCalls = { markTerminal: [], update: [], write: [] };
  const projection = createSessionSystemAgentProjection({
    state: {
      markStarted: async () => ({ status: 'applied' }),
      markIdle: async () => ({ status: 'applied' }),
      markTerminal: async (args: Record<string, unknown>) => {
        calls.markTerminal.push(args);
        return { status: 'applied' };
      },
    },
    sessions: {
      update: async (id: string, patch: Record<string, unknown>) => {
        calls.update.push({ id, patch });
        return input.updateResult ?? true;
      },
    },
    messages: {
      upsert: async () => undefined,
      listTurn: async () => [],
      rewind: async () => undefined,
    },
    stream: {
      write: (frame: Record<string, unknown>) => {
        calls.write.push(frame);
      },
    },
    conversationFacts: { handle: () => undefined },
  } as unknown as SessionSystemAgentProjectionOptions);
  return { calls, projection };
}

describe('historyFailures.projectHistoryFailure', () => {
  it('marks the session errored without errorDetail when metadata is undefined', async () => {
    const { calls, projection } = makeProjection();
    await projection.historyFailures.projectHistoryFailure({ sessionId: 's1', turnId: 't1' });
    expect(calls.update).toHaveLength(1);
    const { id, patch } = calls.update[0]!;
    expect(id).toBe('s1');
    expect(patch['status']).toBe('error');
    expect(patch['errorSource']).toBe('canonical-history');
    expect(patch['errorMessage']).toContain('t1');
    expect('errorDetail' in patch).toBe(false);
  });

  it('serializes metadata into errorDetail', async () => {
    const { calls, projection } = makeProjection();
    await projection.historyFailures.projectHistoryFailure({
      sessionId: 's1',
      turnId: 't1',
      metadata: { attempt: 2, reason: 'disk-full' },
    });
    expect(calls.update[0]!.patch['errorDetail']).toBe('{"attempt":2,"reason":"disk-full"}');
  });

  it('falls back to the placeholder when metadata cannot be serialized', async () => {
    const { calls, projection } = makeProjection();
    const circular: Record<string, unknown> = {};
    circular['self'] = circular;
    await projection.historyFailures.projectHistoryFailure({
      sessionId: 's1',
      turnId: 't1',
      metadata: circular,
    });
    expect(calls.update[0]!.patch['errorDetail']).toBe('[unserializable]');
  });

  it('throws when the session row does not exist', async () => {
    const { projection } = makeProjection({ updateResult: false });
    await expect(
      projection.historyFailures.projectHistoryFailure({ sessionId: 's-gone', turnId: 't1' }),
    ).rejects.toThrow('Session not found: s-gone');
  });
});

describe('failures.project', () => {
  const baseInput = { sessionId: 's1', turnId: 't1', turnSequence: 3, eventId: 'e1' };

  it('marks the turn failed and writes a turn-failure frame', async () => {
    const { calls, projection } = makeProjection();
    await projection.failures.project({ ...baseInput, error: new Error('boom') });
    expect(calls.markTerminal).toHaveLength(1);
    expect(calls.markTerminal[0]).toMatchObject({
      sessionId: 's1',
      turnId: 't1',
      turnSequence: 3,
      eventId: 'e1',
      outcome: 'failed',
      errorMessage: 'boom',
      errorSource: 'turn-system',
    });
    expect(calls.write).toHaveLength(1);
    const frame = calls.write[0]!;
    expect(frame['identity']).toBe('turn-failure:e1');
    expect(frame['kind']).toBe('turn-terminal');
    expect(frame['data']).toEqual({ status: 'failed', error: 'boom' });
  });

  it('marks an aborted turn without error fields', async () => {
    const { calls, projection } = makeProjection();
    await projection.failures.project({ ...baseInput, error: new Error('boom'), status: 'aborted' });
    expect(calls.markTerminal[0]).toMatchObject({ outcome: 'aborted' });
    expect('errorMessage' in calls.markTerminal[0]!).toBe(false);
    const frame = calls.write[0]!;
    expect(frame['identity']).toBe('turn-abort:e1');
    expect(frame['data']).toEqual({ status: 'aborted' });
  });

  it('stringifies non-Error failures', async () => {
    const { calls, projection } = makeProjection();
    await projection.failures.project({ ...baseInput, error: 'plain failure' });
    expect(calls.markTerminal[0]).toMatchObject({ errorMessage: 'plain failure' });
  });
});
