import { describe, expect, it } from 'bun:test';

import { TuiAcpUpdateProjector } from '../../src/acp/updates.js';

describe('ACP update projection of runtime lifecycle frames', () => {
  it('sends no agent message chunk for compaction or review activity', () => {
    const lifecycle = [
      { id: 'c1', kind: 'compaction_start', content: 'compacting' },
      { id: 'c1', kind: 'compaction', content: '## Goal\ninternal checkpoint' },
      { id: 'c1', kind: 'compaction_failed', content: 'compaction failed' },
      { id: 'r1', kind: 'review_start', content: 'reviewing' },
      { id: 'r1', kind: 'review_result', content: 'review found issues' },
    ] as const;

    for (const frame of lifecycle) {
      const updates = new TuiAcpUpdateProjector().project({
        type: 'message',
        message: { id: frame.id, role: 'assistant', kind: frame.kind, content: frame.content },
      });
      expect(updates, `kind ${frame.kind} must not reach the client as content`).toEqual([]);
    }
  });

  it('still streams a real assistant response and its tool calls', () => {
    const updates = new TuiAcpUpdateProjector().project({
      type: 'message',
      message: {
        id: 'assistant-1',
        role: 'assistant',
        content: 'The real answer.',
        toolCalls: [{ id: 'tool-1', name: 'read', status: 'completed' }],
      },
    });

    expect(updates.some((update) => update.sessionUpdate === 'agent_message_chunk')).toBe(true);
    expect(updates.some((update) => update.sessionUpdate === 'tool_call')).toBe(true);
  });
});
