import { describe, expect, it } from 'bun:test';

import type { AgentMessage } from '@earendil-works/pi-agent-core';
import type { Api, Model, Tool } from '@earendil-works/pi-ai';

import {
  buildCountTokensRequestBody,
  cjkFallbackTokens,
  cjkFallbackTokensForBody,
} from '../src/count-tokens-body.js';

const model = { id: 'test-model', maxTokens: 8_192 } as unknown as Model<Api>;

function user(text: string): AgentMessage {
  return {
    role: 'user',
    content: [{ type: 'text', text }],
    timestamp: 0,
  } as unknown as AgentMessage;
}

function assistant(content: unknown[]): AgentMessage {
  return { role: 'assistant', content, timestamp: 0 } as unknown as AgentMessage;
}

function toolResult(toolName: string, content: unknown[]): AgentMessage {
  return {
    role: 'toolResult',
    toolCallId: 'call-1',
    toolName,
    content,
    timestamp: 0,
  } as unknown as AgentMessage;
}

describe('buildCountTokensRequestBody flattening', () => {
  it('maps user and assistant text into an alternating transcript', () => {
    const body = buildCountTokensRequestBody(
      [user('hi'), assistant([{ type: 'text', text: 'hello' }])],
      undefined,
      model,
    );
    expect(body.messages).toEqual([
      { role: 'user', content: [{ type: 'text', text: 'hi' }] },
      { role: 'assistant', content: [{ type: 'text', text: 'hello' }] },
    ]);
    expect(body.model).toBe('test-model');
    expect(body.max_tokens).toBe(8_192);
    expect(body.stream).toBe(false);
    expect('system' in body).toBe(false);
    expect('tools' in body).toBe(false);
  });

  it('merges consecutive same-role messages with a newline', () => {
    const body = buildCountTokensRequestBody([user('one'), user('two'), user('three')], undefined, model);
    expect(body.messages).toEqual([
      { role: 'user', content: [{ type: 'text', text: 'one\ntwo\nthree' }] },
    ]);
  });

  it('prepends a synthetic user turn when the transcript starts with assistant', () => {
    const body = buildCountTokensRequestBody(
      [assistant([{ type: 'text', text: 'opened' }])],
      undefined,
      model,
    );
    expect(body.messages[0]).toEqual({ role: 'user', content: [{ type: 'text', text: '(context)' }] });
    expect(body.messages[1]?.role).toBe('assistant');
  });

  it('inlines thinking blocks and degrades tool calls to name(args-json)', () => {
    const body = buildCountTokensRequestBody(
      [
        assistant([
          { type: 'thinking', thinking: 'hmm' },
          { type: 'text', text: 'answer' },
          { type: 'toolCall', name: 'bash', arguments: { cmd: 'ls' } },
        ]),
      ],
      undefined,
      model,
    );
    expect(body.messages[1]).toEqual({
      role: 'assistant',
      content: [{ type: 'text', text: 'hmm\nanswer\nbash({"cmd":"ls"})' }],
    });
  });

  it('uses a placeholder for image blocks in user content', () => {
    const body = buildCountTokensRequestBody(
      [
        {
          role: 'user',
          content: [
            { type: 'image', data: 'AAAA', mimeType: 'image/png' },
            { type: 'text', text: 'see this' },
          ],
          timestamp: 0,
        } as unknown as AgentMessage,
      ],
      undefined,
      model,
    );
    expect(body.messages[0]).toEqual({
      role: 'user',
      content: [{ type: 'text', text: '[image]\nsee this' }],
    });
  });

  it('degrades tool results to labelled user text merged into the same turn', () => {
    const body = buildCountTokensRequestBody(
      [user('q'), toolResult('read', [{ type: 'text', text: 'file bytes' }])],
      undefined,
      model,
    );
    // tool_result becomes a user-role line and merges with the preceding
    // user turn (consecutive same-role messages are always merged).
    expect(body.messages).toEqual([
      { role: 'user', content: [{ type: 'text', text: 'q\n[tool_result read]\nfile bytes' }] },
    ]);
  });

  it('labels an empty tool result without a body line', () => {
    const body = buildCountTokensRequestBody([toolResult('read', [])], undefined, model);
    const texts = body.messages.map((m) => m.content[0]!.text);
    expect(texts).toContain('[tool_result read]');
  });

  it('substitutes a marker for empty text so content blocks stay valid', () => {
    const body = buildCountTokensRequestBody([user('')], undefined, model);
    expect(body.messages[0]!.content[0]!.text).toBe('(empty)');
  });

  it('includes a non-blank system prompt and omits a blank one', () => {
    const withSystem = buildCountTokensRequestBody([user('hi')], 'sys prompt', model);
    expect(withSystem.system).toEqual([{ type: 'text', text: 'sys prompt' }]);
    const blank = buildCountTokensRequestBody([user('hi')], '   ', model);
    expect('system' in blank).toBe(false);
  });

  it('normalizes tool declarations and drops nameless entries', () => {
    const tools = [
      { name: 't1', description: 'd1', parameters: { type: 'object' } },
      { name: '', description: 'no name' },
      { name: 't2' },
    ] as unknown as Tool[];
    const body = buildCountTokensRequestBody([user('hi')], undefined, model, tools);
    expect(body.tools).toEqual([
      { name: 't1', description: 'd1', input_schema: { type: 'object' } },
      { name: 't2', description: '', input_schema: { type: 'object', properties: {} } },
    ]);
  });

  it('floors max_tokens at 1 when the model reports no positive budget', () => {
    const zeroModel = { id: 'm0', maxTokens: 0 } as unknown as Model<Api>;
    expect(buildCountTokensRequestBody([user('hi')], undefined, zeroModel).max_tokens).toBe(1);
  });
});

describe('cjkFallbackTokensForBody', () => {
  it('sums system, per-message overhead and tool declarations', () => {
    const tools = [{ name: 't', description: '', parameters: {} }] as unknown as Tool[];
    const body = buildCountTokensRequestBody([user('hello')], '你好', model, tools);
    // system: '你好' → 2; message: 4 + ceil(5/4)=2 → 6;
    // tool: 4 + 't'→1 + ''→0 + '{}'→1 → 6.
    expect(cjkFallbackTokensForBody(body)).toBe(14);
  });

  it('counts an empty transcript as zero', () => {
    const body = buildCountTokensRequestBody([], undefined, model);
    expect(cjkFallbackTokensForBody(body)).toBe(0);
  });

  it('measures unserializable schemas by the placeholder length', () => {
    const circular: Record<string, unknown> = {};
    circular.self = circular;
    const tools = [{ name: 't', description: '', parameters: circular }] as unknown as Tool[];
    const body = buildCountTokensRequestBody([user('x')], undefined, model, tools);
    // message: 4 + 1 = 5; tool: 4 + 1 + 0 + ceil(16/4)=4 → 9.
    expect(cjkFallbackTokensForBody(body)).toBe(14);
  });
});

describe('cjkFallbackTokens', () => {
  it('matches the body-based fallback for the same inputs', () => {
    const messages = [user('你好'), assistant([{ type: 'text', text: 'world' }])];
    const tools = [{ name: 't', description: 'd', parameters: { type: 'object' } }] as unknown as Tool[];
    expect(cjkFallbackTokens(messages, 'sys', model, tools)).toBe(
      cjkFallbackTokensForBody(buildCountTokensRequestBody(messages, 'sys', model, tools)),
    );
  });
});
