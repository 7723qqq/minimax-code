import { waitFor } from '../../../../test/bun-test-setup.js';
import { afterEach, describe, expect, it, jest, mock, spyOn } from 'bun:test';

import { RespDataType } from '@mavis/agent-core/protocol/agent-message';
import { RuntimeEventStatus, RuntimeEventType, type IRuntimeEvent } from '@mavis/protocol';
import { LocalRuntimeHost, type LocalTurnRunner } from '../../src/runtime/host.js';
import { OUTPUT_REVISION_INSTRUCTION } from '../../src/runtime/output-safety-policy.js';

const baseTurn = {
  sessionId: 'ses',
  turnId: 'turn',
  workspaceDir: '/tmp/ws',
  systemPrompt: 'base',
  userMessage: { text: 'question' },
  reviewUserInput: 'question',
  llm: { model: { api: 'anthropic-messages', provider: 'minimax', id: 'test' } as never },
};
const finalMessage = (content: string): IRuntimeEvent =>
  ({
    schema: 'runtime.event/v1',
    event_id: 'final',
    session_id: 'ses',
    turn_id: 'turn',
    type: RuntimeEventType.STREAM_RESP,
    payload: {
      stream_resp: JSON.stringify({
        type: RespDataType.AgentMessage,
        agent_message: { msg_id: 'answer', msg_content: content },
      }),
    },
  }) as IRuntimeEvent;
const pass = { action: 1 };
function installInputVerdict(verdict: unknown) {
  return spyOn(globalThis, 'fetch').mockImplementation(async (_url, init) => {
    const body = JSON.parse(String(init?.body));
    return Response.json(body.scene === 110 ? verdict : pass);
  });
}
afterEach(() => jest.restoreAllMocks());

describe('LocalRuntimeHost V2 input safety', () => {
  it('starts generation while input review is pending', async () => {
    let resolveReview!: (response: Response) => void;
    const pending = new Promise<Response>((resolve) => {
      resolveReview = resolve;
    });
    spyOn(globalThis, 'fetch')
      .mockImplementationOnce(() => pending)
      .mockImplementation(async () => Response.json(pass));
    const runTurn = mock(async (input) => {
      await input.eventWriter.pushRuntime(finalMessage('answer'));
    });
    const run = new LocalRuntimeHost({ safetyApiVersion: 'v2', piRunner: { runTurn } }).runTurn(
      baseTurn,
    );
    await waitFor(() => expect(runTurn).toHaveBeenCalledOnce());
    resolveReview(Response.json(pass));
    expect((await run).retracted).toBe(false);
    expect(runTurn).toHaveBeenCalledOnce();
  });

  it('cancels a terminal waiting for input review without waiting for its HTTP response', async () => {
    let resolveReview!: (response: Response) => void;
    const pendingReview = new Promise<Response>((resolve) => {
      resolveReview = resolve;
    });
    spyOn(globalThis, 'fetch').mockImplementation(() => pendingReview);
    const abort = new AbortController();
    const observer = mock();
    const runTurn = mock(async (input) => {
      await input.eventWriter.pushRuntime({
        schema: 'runtime.event/v1',
        event_id: 'held-completed',
        session_id: baseTurn.sessionId,
        turn_id: baseTurn.turnId,
        type: RuntimeEventType.SESSION_STATUS,
        payload: { status: RuntimeEventStatus.COMPLETED },
      });
    });
    let output: Awaited<ReturnType<LocalRuntimeHost['runTurn']>> | undefined;
    const run = (async () => {
      output = await new LocalRuntimeHost({
        safetyApiVersion: 'v2',
        piRunner: { runTurn },
      }).runTurn({
        ...baseTurn,
        signal: abort.signal,
        onInputReviewResolved: observer,
      });
    })();
    try {
      await waitFor(() => expect(runTurn).toHaveBeenCalledOnce());
      abort.abort();
      await waitFor(() => expect(output).toBeDefined(), { timeout: 500 });
      expect(
        output?.events
          .filter((event) => event.type === RuntimeEventType.SESSION_STATUS)
          .map((event) => event.payload?.status),
      ).toEqual([RuntimeEventStatus.ABORTED]);
      expect(observer).not.toHaveBeenCalled();
      expect(output?.retracted).toBe(false);
    } finally {
      resolveReview(
        Response.json({
          action: 4,
          errorCode: 50201,
          guide_prompt: 'LATE_GUIDE',
        }),
      );
      await run;
    }
    expect(observer).not.toHaveBeenCalled();
    expect(runTurn).toHaveBeenCalledOnce();
    expect(JSON.stringify(output?.events)).not.toContain('LATE_GUIDE');
  });

  it('keeps an output Block terminal when an input Guide arrives afterward', async () => {
    let resolveReview!: (response: Response) => void;
    const pendingReview = new Promise<Response>((resolve) => {
      resolveReview = resolve;
    });
    spyOn(globalThis, 'fetch').mockImplementation(async (_url, init) => {
      const body = JSON.parse(String(init?.body));
      return body.scene === 110
        ? pendingReview
        : Response.json({ action: 2, errorCode: 50201 });
    });
    const outputBlocked = mock();
    const runTurn = mock(async (input) => {
      await input.eventWriter.pushRuntime(finalMessage('BLOCKED_DRAFT'));
      expect(input.signal?.aborted).toBe(true);
      outputBlocked();
    });
    const onOutputRecall = mock();
    const rewindPiHistory = mock();
    const run = new LocalRuntimeHost({ safetyApiVersion: 'v2', piRunner: { runTurn } }).runTurn({
      ...baseTurn,
      onOutputRecall,
      rewindPiHistory,
    });
    await waitFor(() => expect(outputBlocked).toHaveBeenCalledOnce());
    resolveReview(
      Response.json({
        action: 4,
        errorCode: 50201,
        guide_prompt: 'LATE_INPUT_GUIDE',
      }),
    );
    const output = await run;
    expect(runTurn).toHaveBeenCalledOnce();
    expect(onOutputRecall).not.toHaveBeenCalled();
    expect(rewindPiHistory).not.toHaveBeenCalled();
    expect(output).toMatchObject({ retracted: true, retractionVariant: 'content' });
    expect(
      output.events
        .filter((event) => event.type === RuntimeEventType.SESSION_STATUS)
        .map((event) => event.payload?.status),
    ).toEqual([RuntimeEventStatus.COMPLETED]);
    expect(JSON.stringify(output.events)).not.toMatch(/BLOCKED_DRAFT|LATE_INPUT_GUIDE/);
  });

  it.each(['chunk', 'final'] as const)(
    'does not release a late-approved output %s after input Block',
    async (kind) => {
      let resolveInput!: (response: Response) => void;
      let resolveOutput!: (response: Response) => void;
      const pendingInput = new Promise<Response>((resolve) => {
        resolveInput = resolve;
      });
      const pendingOutput = new Promise<Response>((resolve) => {
        resolveOutput = resolve;
      });
      const outputReviewStarted = mock();
      spyOn(globalThis, 'fetch').mockImplementation(async (_url, init) => {
        const body = JSON.parse(String(init?.body));
        if (body.scene === 110) return pendingInput;
        outputReviewStarted();
        return pendingOutput;
      });
      let attemptSignal: AbortSignal | undefined;
      const runTurn = mock(async (input) => {
        attemptSignal = input.signal;
        const event =
          kind === 'final'
            ? finalMessage('LATE_APPROVED_DRAFT')
            : {
                ...finalMessage(''),
                payload: {
                  stream_resp: JSON.stringify({
                    type: RespDataType.AgentMessageChunk,
                    agent_message_chunk: {
                      msg_id: 'answer',
                      msg_content: 'LATE_APPROVED_DRAFT'.repeat(1024),
                    },
                  }),
                },
              };
        await input.eventWriter.pushRuntime(event);
      });
      const run = new LocalRuntimeHost({ safetyApiVersion: 'v2', piRunner: { runTurn } }).runTurn(
        baseTurn,
      );
      await waitFor(() => expect(outputReviewStarted).toHaveBeenCalledOnce());
      resolveInput(Response.json({ action: 2, errorCode: 50201 }));
      await waitFor(() => expect(attemptSignal?.aborted).toBe(true));
      resolveOutput(Response.json(pass));
      const output = await run;
      expect(output).toMatchObject({ retracted: true, retractionVariant: 'content' });
      expect(runTurn).toHaveBeenCalledOnce();
      expect(
        output.events.filter((event) => event.type === RuntimeEventType.STREAM_RESP),
      ).toHaveLength(0);
      expect(output.events.at(-1)?.payload?.status).toBe(RuntimeEventStatus.COMPLETED);
    },
  );

  it.each([
    [
      { action: 4, errorCode: 50201, guide_prompt: 'PRIVATE_INPUT_GUIDE' },
      'PRIVATE_INPUT_GUIDE',
    ],
  ])('restarts a concurrent draft with the input guide once: %j', async (verdict, instruction) => {
    let outputIndex = 0;
    spyOn(globalThis, 'fetch').mockImplementation(async (_url, init) => {
      const body = JSON.parse(String(init?.body));
      return Response.json(
        body.scene === 110
          ? verdict
          : outputIndex++ === 0
            ? { action: 4, errorCode: 50201, guide_prompt: '' }
            : pass,
      );
    });
    const prompts: string[] = [];
    const onInputReviewResolved = mock();
    const piRunner: LocalTurnRunner = {
      async runTurn(input) {
        prompts.push(input.systemPrompt);
        if (prompts.length === 1 && !input.signal?.aborted) {
          await new Promise<void>((resolve) =>
            input.signal?.addEventListener('abort', () => resolve(), { once: true }),
          );
        }
        await input.eventWriter.pushRuntime(finalMessage(`draft-${prompts.length}`));
      },
    };
    const output = await new LocalRuntimeHost({ safetyApiVersion: 'v2', piRunner }).runTurn({
      ...baseTurn,
      onInputReviewResolved,
      rewindPiHistory: mock(),
      onOutputRecall: mock(),
    });
    expect(prompts).toEqual([
      'base',
      `base\n\n${instruction}`,
      `base\n\n${OUTPUT_REVISION_INSTRUCTION}`,
    ]);
    expect(onInputReviewResolved).toHaveBeenCalledWith(true);
    expect(output.retracted).toBe(false);
    expect(JSON.stringify(output.events)).not.toContain('PRIVATE_INPUT_GUIDE');
    expect(JSON.stringify(output.events)).not.toContain('draft-1');
  });

  it.each([undefined, '', '  '])('passes an input guide without text: %j', async (guide) => {
    installInputVerdict({ action: 4, errorCode: 50201, ...(guide !== undefined ? { guide_prompt: guide } : {}) });
    const onInputReviewResolved = mock();
    const onOutputRecall = mock();
    const rewindPiHistory = mock();
    const runTurn = mock(async (input) => {
      await input.eventWriter.pushRuntime(finalMessage('original answer'));
      expect(input.signal?.aborted).toBe(false);
    });
    const output = await new LocalRuntimeHost({ safetyApiVersion: 'v2', piRunner: { runTurn } }).runTurn({
      ...baseTurn, onInputReviewResolved, onOutputRecall, rewindPiHistory,
    });
    expect(runTurn).toHaveBeenCalledOnce();
    expect(runTurn.mock.calls[0]?.[0].systemPrompt).toBe('base');
    expect(onInputReviewResolved).toHaveBeenCalledWith(false);
    expect(onOutputRecall).not.toHaveBeenCalled();
    expect(rewindPiHistory).not.toHaveBeenCalled();
    expect(output.retracted).toBe(false);
    expect(JSON.stringify(output.events)).toContain('original answer');
  });

  it('replaces the concurrent draft with a persisted input fixed answer', async () => {
    const fetchSpy = installInputVerdict({
      action: 3,
      errorCode: 50201,
      suggestion: 'fixed answer',
    });
    const runTurn = mock();
    const history = mock();
    const output = await new LocalRuntimeHost({
      safetyApiVersion: 'v2',
      piRunner: { runTurn },
    }).runTurn({
      ...baseTurn,
      hooks: { onHistoryChangedHook: [history] },
    });
    expect(runTurn).toHaveBeenCalledOnce();
    expect(fetchSpy).toHaveBeenCalledOnce();
    expect(output.retracted).toBe(false);
    expect(history.mock.calls[0]?.[0]?.messages).toMatchObject([
      { role: 'user', content: [{ type: 'text', text: 'question' }] },
      { role: 'assistant', content: [{ type: 'text', text: 'fixed answer' }] },
    ]);
    expect(JSON.stringify(output.events)).toContain('fixed answer');
    expect(JSON.stringify(output.events)).not.toContain('PRIVATE_UNUSED_GUIDE');
    expect(output.events.at(-1)?.payload?.status).toBe(RuntimeEventStatus.COMPLETED);
  });

  it('retracts a concurrent draft on input block without retry', async () => {
    installInputVerdict({
      action: 2,
      errorCode: 50201,
    });
    const runTurn = mock();
    const onInputReviewResolved = mock();
    const output = await new LocalRuntimeHost({
      safetyApiVersion: 'v2',
      piRunner: { runTurn },
    }).runTurn({
      ...baseTurn,
      onInputReviewResolved,
    });
    expect(runTurn).toHaveBeenCalledOnce();
    expect(onInputReviewResolved).toHaveBeenCalledWith(true);
    expect(output).toMatchObject({ retracted: true, retractionVariant: 'content' });
    expect(output.events.filter((event) => event.type === RuntimeEventType.STREAM_RESP)).toEqual(
      [],
    );
  });

  it.each([401, 503, 200])(
    'fails closed without a usable input verdict (HTTP %s)',
    async (status) => {
      spyOn(globalThis, 'fetch').mockImplementation(
        async () => new Response('invalid', { status }),
      );
      const runTurn = mock();
      const output = await new LocalRuntimeHost({
        safetyApiVersion: 'v2',
        piRunner: { runTurn },
      }).runTurn(baseTurn);
      expect(runTurn).toHaveBeenCalledOnce();
      expect(output).toMatchObject({ retracted: true, retractionVariant: 'network' });
    },
  );

  it('retracts the concurrent draft when input review is unavailable', async () => {
    spyOn(globalThis, 'fetch').mockRejectedValue(new Error('offline'));
    const runTurn = mock();
    const onInputReviewResolved = mock();
    const output = await new LocalRuntimeHost({
      safetyApiVersion: 'v2',
      piRunner: { runTurn },
    }).runTurn({
      ...baseTurn,
      onInputReviewResolved,
    });
    expect(onInputReviewResolved).toHaveBeenCalledWith(true);
    expect(runTurn).toHaveBeenCalledOnce();
    expect(output).toMatchObject({ retracted: true, retractionVariant: 'network' });
  });

  it.each([
    { action: 1 },
    { action: 4, errorCode: 50201, guide_prompt: 'PRIVATE_GUIDE' },
    { action: 3, errorCode: 50201, suggestion: 'FIXED' },
  ])('does not deliver a late verdict after cancellation: %j', async (verdict) => {
    let resolveReview!: (response: Response) => void;
    const pending = new Promise<Response>((resolve) => {
      resolveReview = resolve;
    });
    spyOn(globalThis, 'fetch').mockImplementation(() => pending);
    const runTurn = mock();
    const history = mock();
    const observer = mock();
    const abort = new AbortController();
    const run = new LocalRuntimeHost({ safetyApiVersion: 'v2', piRunner: { runTurn } }).runTurn({
      ...baseTurn,
      signal: abort.signal,
      onInputReviewResolved: observer,
      hooks: { onHistoryChangedHook: [history] },
    });
    abort.abort();
    resolveReview(Response.json(verdict));
    const output = await run;
    expect(runTurn).toHaveBeenCalledOnce();
    expect(history).not.toHaveBeenCalled();
    expect(observer).not.toHaveBeenCalled();
    expect(output.events.at(-1)?.payload?.status).toBe(RuntimeEventStatus.ABORTED);
    expect(JSON.stringify(output.events)).not.toMatch(/FIXED|PRIVATE_GUIDE/);
  });

  it('restores canonical history when cancellation wins during fixed-answer persistence', async () => {
    installInputVerdict({ action: 3, errorCode: 50201, suggestion: 'FIXED' });
    let enterHistory!: () => void;
    let releaseHistory!: () => void;
    const entered = new Promise<void>((resolve) => {
      enterHistory = resolve;
    });
    const held = new Promise<void>((resolve) => {
      releaseHistory = resolve;
    });
    const history = mock().mockImplementationOnce(async () => {
      enterHistory();
      await held;
    });
    const runTurn = mock();
    const abort = new AbortController();
    const baseline = [{ role: 'user' as const, content: 'PRIOR', timestamp: 1 }];
    const pending = new LocalRuntimeHost({ safetyApiVersion: 'v2', piRunner: { runTurn } }).runTurn(
      {
        ...baseTurn,
        history: baseline,
        signal: abort.signal,
        hooks: { onHistoryChangedHook: [history] },
      },
    );
    await entered;
    abort.abort();
    releaseHistory();
    const output = await pending;
    expect(history).toHaveBeenCalledTimes(2);
    expect(history.mock.calls[1]?.[0]).toMatchObject({
      reason: 'replaceMessages',
      messages: baseline,
    });
    expect(runTurn).toHaveBeenCalledOnce();
    expect(JSON.stringify(output.events)).not.toContain('FIXED');
    expect(output.events.at(-1)?.payload?.status).toBe(RuntimeEventStatus.ABORTED);
  });

  it('does not review absent input on continuation turns', async () => {
    const fetchSpy = installInputVerdict({ action: 2, errorCode: 50201 });
    const runTurn = mock(async (input) => {
      await input.eventWriter.pushRuntime(finalMessage('answer'));
    });
    const { reviewUserInput: _, ...continuation } = baseTurn;
    const output = await new LocalRuntimeHost({
      safetyApiVersion: 'v2',
      piRunner: { runTurn },
    }).runTurn(continuation);
    expect(output.retracted).toBe(false);
    expect(
      fetchSpy.mock.calls.every(([, init]) => JSON.parse(String(init?.body)).scene === 11),
    ).toBe(true);
  });
});
