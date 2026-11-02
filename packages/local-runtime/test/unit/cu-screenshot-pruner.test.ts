import { describe, expect, it } from 'bun:test';

import type { PiBeforeLlmCallHookInput } from '@mavis/agent-core/pi-turn-runner';
import type { AgentMessage } from '@mavis/agent-core/protocol/agent-message';

import { createCuScreenshotPrunerHook } from '../../src/cu/cu-screenshot-pruner.js';

type MessageContentPart = {
  type: string;
  text?: string;
  data?: string;
  mimeType?: string;
};

function screenshotMessage(
  overrides: { role?: string; toolNameKey?: 'toolName' | 'tool_name' | 'name'; data?: string } = {},
): AgentMessage {
  const { role = 'toolResult', toolNameKey = 'toolName', data = 'a'.repeat(256) } = overrides;
  return {
    role,
    [toolNameKey]: 'desktop_screenshot',
    content: [{ type: 'image', data, mimeType: 'image/png' } satisfies MessageContentPart],
  } as unknown as AgentMessage;
}

function inputOf(messages: AgentMessage[]): PiBeforeLlmCallHookInput {
  return { sessionId: 's1', turnId: 't1', messages } as unknown as PiBeforeLlmCallHookInput;
}

function partOf(message: unknown, index: number): MessageContentPart {
  const content = (message as { content: MessageContentPart[] }).content;
  return content[index]!;
}

describe('createCuScreenshotPrunerHook', () => {
  it('returns undefined when the count is within the limit', async () => {
    const hook = createCuScreenshotPrunerHook(2);
    const input = inputOf([screenshotMessage(), screenshotMessage()]);
    expect(await hook(input)).toBeUndefined();
  });

  it('returns undefined when disabled via a non-positive limit', async () => {
    const hook = createCuScreenshotPrunerHook(0);
    const input = inputOf([screenshotMessage()]);
    expect(await hook(input)).toBeUndefined();
  });

  it('replaces the oldest screenshots and keeps the newest N intact', async () => {
    const hook = createCuScreenshotPrunerHook(2);
    const input = inputOf([
      screenshotMessage({ data: 'old-1' }),
      screenshotMessage({ data: 'old-2' }),
      screenshotMessage({ data: 'new-3' }),
      screenshotMessage({ data: 'new-4' }),
    ]);
    const decision = (await hook(input)) as {
      type: string;
      messages: AgentMessage[];
      metadata: { summary: string; strategyVersion: string };
    };
    expect(decision.type).toBe('replaceMessages');
    expect(decision.messages).toHaveLength(4);
    expect(partOf(decision.messages[0], 0).type).toBe('text');
    expect(partOf(decision.messages[0], 0).text).toContain('pruned');
    expect(partOf(decision.messages[1], 0).type).toBe('text');
    expect(partOf(decision.messages[2], 0)).toMatchObject({ type: 'image', data: 'new-3' });
    expect(partOf(decision.messages[3], 0)).toMatchObject({ type: 'image', data: 'new-4' });
    expect(decision.metadata.summary).toContain('Pruned 2');
    expect(decision.metadata.strategyVersion).toBe('cu-screenshot-pruner-v1');
  });

  it('does not mutate the original message array', async () => {
    const hook = createCuScreenshotPrunerHook(1);
    const input = inputOf([screenshotMessage({ data: 'old-1' }), screenshotMessage({ data: 'new-2' })]);
    await hook(input);
    expect(partOf(input.messages[0], 0).type).toBe('image');
    expect(partOf(input.messages[0], 0).data).toBe('old-1');
    expect(partOf(input.messages[1], 0).data).toBe('new-2');
  });

  it('ignores image parts from non-CU tools', async () => {
    const hook = createCuScreenshotPrunerHook(1);
    const otherTool = {
      role: 'toolResult',
      toolName: 'fs_read',
      content: [{ type: 'image', data: 'not-a-screenshot' }],
    } as unknown as AgentMessage;
    const input = inputOf([otherTool, screenshotMessage({ data: 'new-1' })]);
    expect(await hook(input)).toBeUndefined();
  });

  it('recognizes the legacy tool/tool_name message shape', async () => {
    const hook = createCuScreenshotPrunerHook(1);
    const input = inputOf([
      screenshotMessage({ role: 'tool', toolNameKey: 'tool_name', data: 'old-1' }),
      screenshotMessage({ role: 'tool', toolNameKey: 'tool_name', data: 'new-2' }),
    ]);
    const decision = (await hook(input)) as { messages: AgentMessage[] };
    expect(partOf(decision.messages[0], 0).type).toBe('text');
    expect(partOf(decision.messages[1], 0)).toMatchObject({ type: 'image', data: 'new-2' });
  });
});
