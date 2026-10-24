import { describe, expect, it } from 'bun:test';

import type { ConversationCommittedMessage } from '@mavis/conversation-contract';

import { collectChannelResponseFromMessages } from '../../src/channels/sse-collector.js';

function message(
  overrides: Partial<ConversationCommittedMessage> & { msgId: string },
): ConversationCommittedMessage {
  return {
    role: 'assistant',
    text: '',
    ...overrides,
  } as ConversationCommittedMessage;
}

describe('chat channel reply projection', () => {
  it('excludes every lifecycle frame, not only the terminal compaction state', () => {
    const response = collectChannelResponseFromMessages([
      message({ msgId: 'user-1', role: 'user', text: 'please compact' }),
      message({ msgId: 'compaction-1', kind: 'compaction_start', text: 'compacting' }),
      message({ msgId: 'compaction-1', kind: 'compaction_failed', text: 'compaction failed' }),
      message({ msgId: 'review-1', kind: 'review_start', text: 'reviewing' }),
      message({ msgId: 'review-1', kind: 'review_result', text: 'review found issues' }),
      message({ msgId: 'assistant-1', text: 'The real answer.' }),
    ]);

    expect(response.text).toContain('The real answer.');
    for (const leaked of [
      'compacting',
      'compaction failed',
      'reviewing',
      'review found issues',
    ]) {
      expect(response.text).not.toContain(leaked);
    }
    expect(response.finalMessages).toBe(1);
  });
});
