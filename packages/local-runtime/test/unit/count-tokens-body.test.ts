import { describe, expect, it } from 'bun:test';

import { cjkFallbackTokensForBody, type CountTokensRequestBody } from '../../src/context/count-tokens-body.js';
import { FALLBACK_IMAGE_TOKENS } from '../../src/context/image-detection.js';

function body(partial: Partial<CountTokensRequestBody>): CountTokensRequestBody {
  return { model: 'm', messages: [], stream: false, ...partial } as CountTokensRequestBody;
}

// NOTE: the local-runtime fallback walks the whole payload recursively, so a
// message's `role` string and a block's `type` string contribute to the count
// as ordinary short text. The assertions below include them deliberately.

describe('cjkFallbackTokensForBody (local-runtime recursive walker)', () => {
  it('walks a string system field without per-message overhead', () => {
    expect(cjkFallbackTokensForBody(body({ system: '你好' as never }))).toBe(2);
  });

  it('sums text blocks, role text and per-message overhead', () => {
    const total = cjkFallbackTokensForBody(
      body({
        messages: [
          { role: 'user', content: [{ type: 'text', text: '你好' }] },
          { role: 'assistant', content: [{ type: 'text', text: 'hello' }] },
        ] as never,
      }),
    );
    // user msg: role 'user'→1 + text '你好'→2 = 3, +4 overhead → 7
    // assistant msg: role 'assistant'→3 + 'hello'→2 = 5, +4 → 9
    // (typed blocks like 'text' count their payload only, not the type string)
    expect(total).toBe(16);
  });

  it('counts thinking text and signature but not the block type string', () => {
    const total = cjkFallbackTokensForBody(
      body({
        messages: [
          {
            role: 'assistant',
            content: [{ type: 'thinking', thinking: 'abcd', signature: 'efgh' }],
          },
        ] as never,
      }),
    );
    // role 'assistant'→3 + ('abcd'→1 + 'efgh'→1), +4 overhead → 9
    expect(total).toBe(9);
  });

  it('counts tool_use id, name and serialized input', () => {
    const total = cjkFallbackTokensForBody(
      body({
        messages: [
          {
            role: 'assistant',
            content: [{ type: 'tool_use', id: 'a', name: 'bash', input: { cmd: 'ls' } }],
          },
        ] as never,
      }),
    );
    // role→3 + id 'a'→1 + name 'bash'→1 + input '{"cmd":"ls"}'→ceil(12/4)=3; +4 → 12
    expect(total).toBe(12);
  });

  it('counts tool_result id, content and is_error', () => {
    const total = cjkFallbackTokensForBody(
      body({
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'tool_result',
                tool_use_id: 'a',
                content: [{ type: 'text', text: 'ok' }],
                is_error: false,
              },
            ],
          },
        ] as never,
      }),
    );
    // role 'user'→1 + id→1 + 'ok'→1 + 'false'→ceil(5/4)=2; +4 overhead → 9
    expect(total).toBe(9);
  });

  it('charges the fallback visual cost for image blocks', () => {
    const imageOnly = cjkFallbackTokensForBody(
      body({ messages: [{ role: 'user', content: [{ type: 'image' }] }] as never }),
    );
    expect(imageOnly).toBe(4 + 1 + FALLBACK_IMAGE_TOKENS); // overhead + role + visual
  });

  it('recurses unknown blocks but skips data, source and cache_control keys', () => {
    const total = cjkFallbackTokensForBody(
      body({
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'custom',
                keep: 'abcd',
                data: 'x'.repeat(400),
                source: 'y'.repeat(400),
                cache_control: { type: 'ephemeral' },
              },
            ],
          },
        ] as never,
      }),
    );
    // role 'user'→1 + type 'custom'→2 + keep 'abcd'→1; skipped keys ignored; +4 → 8
    expect(total).toBe(8);
  });

  it('stringifies number and boolean leaves and ignores nullish values', () => {
    const total = cjkFallbackTokensForBody(
      body({
        messages: [
          {
            role: 'user',
            content: [{ type: 'custom2', n: 42, b: true, nil: null, missing: undefined }],
          },
        ] as never,
      }),
    );
    // role→1 + type 'custom2'→2 + '42'→1 + 'true'→1; null/undefined → 0; +4 → 9
    expect(total).toBe(9);
  });

  it('counts tool declarations with per-tool overhead', () => {
    const total = cjkFallbackTokensForBody(
      body({
        tools: [
          { name: 'read', description: 'reads files', input_schema: { type: 'object' } },
        ] as never,
      }),
    );
    // 4 + 'read'→1 + ceil(11/4)=3 + '{"type":"object"}'→ceil(17/4)=5 → 13
    expect(total).toBe(13);
  });
});
