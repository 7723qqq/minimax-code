import { describe, expect, it } from 'bun:test';

import type { Api, Context, Model } from '@earendil-works/pi-ai';
import type { StreamFn } from '@earendil-works/pi-agent-core';
import { LLM_RETRY_CALL_IDENTITY } from '@mavis/agent-core/pi-turn-runner';

import { withLocalDynamicMaxTokens } from './dynamic-max-tokens.js';

type StreamOptions = Parameters<StreamFn>[2];

// resolveDynamicMaxTokens only lowers the budget when the configured output
// exceeds the 16_384-token reserve floor, so the configured budget here must
// be above it for the reduction paths to engage at all.
const CONFIGURED = 32_000;
const WINDOW = 40_000;
const RESERVE_FLOOR = 16_384;
const MIN_OUTPUT_TOKENS = 1_024;

function makeModel(overrides: Record<string, unknown> = {}): Model<Api> {
  return {
    id: 'test-model',
    api: 'openai-completions',
    contextWindow: WINDOW,
    maxTokens: CONFIGURED,
    ...overrides,
  } as unknown as Model<Api>;
}

function makeContext(systemPrompt = ''): Context {
  return { systemPrompt, messages: [], tools: [] } as unknown as Context;
}

/** 120_000 ASCII chars ≈ 30_000 tokens, pushing the window remainder below the reserve floor. */
function makeLargeContext(): Context {
  return makeContext('x'.repeat(120_000));
}

function recordInner() {
  const calls: { readonly options: StreamOptions }[] = [];
  const inner = ((_model: unknown, _context: unknown, options: StreamOptions) => {
    calls.push({ options });
    return undefined;
  }) as unknown as StreamFn;
  return { calls, inner };
}

describe('withLocalDynamicMaxTokens', () => {
  it('passes through unchanged when the model has no usable context window', () => {
    const { calls, inner } = recordInner();
    const wrapped = withLocalDynamicMaxTokens(inner);
    const options = { maxTokens: CONFIGURED } as unknown as StreamOptions;
    wrapped(makeModel({ contextWindow: 0 }), makeContext(), options);
    expect(calls[0].options).toBe(options);
  });

  it('passes through unchanged when no max tokens are configured', () => {
    const { calls, inner } = recordInner();
    const wrapped = withLocalDynamicMaxTokens(inner);
    wrapped(makeModel({ maxTokens: undefined }), makeContext(), undefined);
    expect(calls[0].options).toBeUndefined();
  });

  it('keeps the configured budget when the context easily fits', () => {
    const { calls, inner } = recordInner();
    const wrapped = withLocalDynamicMaxTokens(inner);
    const options = { maxTokens: CONFIGURED } as unknown as StreamOptions;
    wrapped(makeModel(), makeContext('short prompt'), options);
    expect(calls[0].options).toBe(options);
  });

  it('lowers maxTokens to the reserve floor when the context fills the window', () => {
    const { calls, inner } = recordInner();
    const wrapped = withLocalDynamicMaxTokens(inner);
    wrapped(makeModel(), makeLargeContext(), { maxTokens: CONFIGURED } as unknown as StreamOptions);
    expect(calls[0].options?.maxTokens).toBe(RESERVE_FLOOR);
  });

  it('subtracts the thinking budget for anthropic reasoning calls', () => {
    const { calls, inner } = recordInner();
    const wrapped = withLocalDynamicMaxTokens(inner);
    const options = { maxTokens: CONFIGURED, reasoning: 'medium' } as unknown as StreamOptions;
    wrapped(makeModel({ api: 'anthropic-messages' }), makeLargeContext(), options);
    // medium defaults to an 8_192 thinking budget: 16_384 - 8_192.
    expect(calls[0].options?.maxTokens).toBe(RESERVE_FLOOR - 8_192);
  });

  it('honours an explicit thinkingBudgets override', () => {
    const { calls, inner } = recordInner();
    const wrapped = withLocalDynamicMaxTokens(inner);
    const options = {
      maxTokens: CONFIGURED,
      reasoning: 'high',
      thinkingBudgets: { high: 4_096 },
    } as unknown as StreamOptions;
    wrapped(makeModel({ api: 'anthropic-messages' }), makeLargeContext(), options);
    expect(calls[0].options?.maxTokens).toBe(RESERVE_FLOOR - 4_096);
  });

  it('keeps the full floor when compat forces adaptive thinking', () => {
    const { calls, inner } = recordInner();
    const wrapped = withLocalDynamicMaxTokens(inner);
    const options = { maxTokens: CONFIGURED, reasoning: 'high' } as unknown as StreamOptions;
    const model = makeModel({ api: 'anthropic-messages', compat: { forceAdaptiveThinking: true } });
    wrapped(model, makeLargeContext(), options);
    expect(calls[0].options?.maxTokens).toBe(RESERVE_FLOOR);
  });

  it('falls back to the emergency budget with reasoning stripped when estimation throws', () => {
    const { calls, inner } = recordInner();
    const wrapped = withLocalDynamicMaxTokens(inner);
    const hostile = Object.defineProperty({}, 'messages', {
      get() {
        throw new Error('boom');
      },
    }) as unknown as Context;
    const options = { maxTokens: CONFIGURED, reasoning: 'high' } as unknown as StreamOptions;
    wrapped(makeModel({ api: 'anthropic-messages' }), hostile, options);
    expect(calls[0].options?.maxTokens).toBe(1);
    expect(
      calls[0].options !== undefined &&
        'reasoning' in calls[0].options &&
        (calls[0].options as { reasoning?: unknown }).reasoning === undefined,
    ).toBe(true);
  });

  it('reuses the first budget for retried calls carrying the same retry identity', () => {
    const { calls, inner } = recordInner();
    const wrapped = withLocalDynamicMaxTokens(inner);
    const identity = {};
    const options = (maxTokens: number) =>
      ({ maxTokens, [LLM_RETRY_CALL_IDENTITY]: identity }) as unknown as StreamOptions;
    wrapped(makeModel(), makeLargeContext(), options(CONFIGURED));
    const firstBudget = calls[0].options?.maxTokens;
    expect(firstBudget).toBe(RESERVE_FLOOR);
    // A retry with a now-small context must keep the original (reduced) budget.
    wrapped(makeModel(), makeContext('short prompt'), options(CONFIGURED));
    expect(calls[1].options?.maxTokens).toBe(firstBudget);
  });

  it('clamps the reduced budget to at least the minimum output tokens', () => {
    const { calls, inner } = recordInner();
    const wrapped = withLocalDynamicMaxTokens(inner);
    // Reasoning budget larger than the floor: 16_384 - 20_000 < 1_024.
    const options = {
      maxTokens: CONFIGURED,
      reasoning: 'high',
      thinkingBudgets: { high: 20_000 },
    } as unknown as StreamOptions;
    wrapped(makeModel({ api: 'anthropic-messages' }), makeLargeContext(), options);
    expect(calls[0].options?.maxTokens).toBe(MIN_OUTPUT_TOKENS);
  });
});
