import { describe, expect, it } from 'bun:test';

import {
  deliverToAllBoundChannels,
  deliverToChannel,
} from '../../src/report-delivery.js';
import type { CronChannelBinding, CronChannelRunner } from '../../src/host-ports.js';
import type { CronHostUtils } from '../../src/host-utils.js';
import type { CronTaskState, DeliveryConfig } from '../../src/types.js';

interface SentMessage {
  chatId: string;
  text: string;
  sessionId?: string;
}

function makeHost(bindings?: CronChannelBinding[]) {
  const sent: SentMessage[] = [];
  const runner: CronChannelRunner = {
    isRunning: true,
    sendProactiveMessage: async (chatId, text, meta) => {
      sent.push({ chatId, text, ...(meta?.sessionId ? { sessionId: meta.sessionId } : {}) });
    },
  };
  const host: CronHostUtils = {
    channelDelivery: {
      getRunner: () => runner,
      ...(bindings ? { listBindingsByAgent: async () => bindings } : {}),
    },
  };
  return { sent, host };
}

const STATE = { agentName: 'mavis', cronName: 'watch-x' } as unknown as CronTaskState;
const DELIVERY = { channel: 'mavis', chatId: 'chat-1' } as unknown as DeliveryConfig;

describe('deliverToChannel', () => {
  it('strips paired mavis system tags before the IM send', async () => {
    const { sent, host } = makeHost();
    await deliverToChannel(
      STATE,
      DELIVERY,
      '<mavis-thinking>trace</mavis-thinking>visible <mavis-progress>waiting</mavis-progress>',
      's1',
      host,
    );
    expect(sent).toHaveLength(1);
    expect(sent[0]!.text).toBe('visible');
    expect(sent[0]!.sessionId).toBe('s1');
  });

  it('peels nested mavis blocks innermost-first', async () => {
    const { sent, host } = makeHost();
    await deliverToChannel(
      STATE,
      DELIVERY,
      '<mavis-thinking>outer <mavis-progress>inner</mavis-progress></mavis-thinking>kept',
      's1',
      host,
    );
    expect(sent[0]!.text).toBe('kept');
  });

  it('sends nothing for a thinking/progress-only tick (quiet policy)', async () => {
    const { sent, host } = makeHost();
    await deliverToChannel(STATE, DELIVERY, '<mavis-progress>still waiting</mavis-progress>', 's1', host);
    expect(sent).toHaveLength(0);
  });

  it('passes plain text through unchanged', async () => {
    const { sent, host } = makeHost();
    await deliverToChannel(STATE, DELIVERY, 'plain reply', 's1', host);
    expect(sent[0]!.text).toBe('plain reply');
  });

  it('skips empty results without touching the runner', async () => {
    const { sent, host } = makeHost();
    await deliverToChannel(STATE, DELIVERY, '', 's1', host);
    expect(sent).toHaveLength(0);
  });
});

describe('deliverToAllBoundChannels', () => {
  it('delivers the stripped text to every bound chat, deduped by client+chat', async () => {
    const bindings: CronChannelBinding[] = [
      { clientName: 'mavis', chatId: 'chat-1' },
      { clientName: 'telegram:mavis', chatId: 'chat-2' },
      { clientName: 'mavis', chatId: 'chat-1' }, // duplicate pair — must not double-send
    ];
    const { sent, host } = makeHost(bindings);
    await deliverToAllBoundChannels(
      'mavis',
      '<mavis-progress>tick</mavis-progress>result',
      'cron-s1',
      host,
    );
    expect(sent).toHaveLength(2);
    expect(sent.map((m) => m.chatId)).toEqual(['chat-1', 'chat-2']);
    for (const message of sent) {
      expect(message.text).toBe('result');
      expect(message.sessionId).toBe('cron-s1');
    }
  });

  it('stays off when the host cannot enumerate bindings (auto-delivery gate)', async () => {
    const { sent, host } = makeHost();
    await deliverToAllBoundChannels('mavis', 'result', 'cron-s1', host);
    expect(sent).toHaveLength(0);
  });
});
