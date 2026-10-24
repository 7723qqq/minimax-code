import { waitFor } from '../../../../../../../test/bun-test-setup.js';
import { describe, expect, it, mock } from 'bun:test';

import type { TuiModel } from '../../../../../src/runtime/port.js';
import { TuiModelState } from '../../../../../src/tui/controller/product/model-state.js';

function model(modelId: string, selected = false): TuiModel {
  return {
    providerId: 'minimax',
    modelId,
    displayName: modelId,
    selected,
  };
}

describe('TuiModelState', () => {
  it('restores the saved global effort on a fresh welcome screen', async () => {
    const runtime = {
      listModels: mock(async () => [
        { ...model('byok-large-5', true), thinking: { effort: 'max' } },
      ]),
      selectModel: mock(async () => true),
      getSession: mock(),
    };
    const state = new TuiModelState({
      runtime,
      currentSessionId: () => undefined,
      onChanged: mock(),
    });
    await state.refresh();
    expect(state.selectedEffort()).toBe('max');
    expect(runtime.getSession).not.toHaveBeenCalled();
    expect(runtime.selectModel).not.toHaveBeenCalled();
  });

  it('shows a recovered official model without inheriting legacy Session effort or saving the selection', async () => {
    const runtime = {
      listModels: mock(async () => [model('MiniMax-M3', true)]),
      selectModel: mock(async () => true),
      getSession: mock(async () => ({
        sessionId: 'session-a',
        model: {
          providerId: 'custom_provider:minimax-legacy',
          modelId: 'retired',
          thinking: { effort: 'high' },
        },
      })),
    };
    const state = new TuiModelState({
      runtime,
      currentSessionId: () => 'session-a',
      onChanged: mock(),
    });
    await state.refresh('session-a');
    expect(state.selected()).toMatchObject({ providerId: 'minimax', modelId: 'MiniMax-M3' });
    expect(state.selectedEffort()).toBeUndefined();
    expect(runtime.selectModel).not.toHaveBeenCalled();
  });
  it('does not let stale Session hydration overwrite a later user selection', async () => {
    let resolveHydration: ((models: TuiModel[]) => void) | undefined;
    const runtime = {
      listModels: mock(
        async () =>
          await new Promise<TuiModel[]>((resolve) => {
            resolveHydration = resolve;
          }),
      ),
      selectModel: mock(async () => true),
    };
    const state = new TuiModelState({
      runtime,
      currentSessionId: () => 'session-a',
      onChanged: mock(),
    });

    const hydration = state.refresh('session-a');
    await waitFor(() => expect(resolveHydration).toBeTypeOf('function'));
    await expect(state.select(model('MiniMax-M3'), 'session-a')).resolves.toMatchObject({
      status: 'selected',
    });
    resolveHydration?.([model('MiniMax-M2.7', true)]);
    await hydration;

    expect(state.selected()).toMatchObject({ modelId: 'MiniMax-M3', selected: true });
  });

  it('serializes rapid selections so Runtime and the status rail finish on the latest choice', async () => {
    const releases: Array<() => void> = [];
    const applied: string[] = [];
    const runtime = {
      listModels: mock(async () => []),
      selectModel: mock(
        async (selection: Pick<TuiModel, 'modelId'>) =>
          await new Promise<boolean>((resolve) => {
            releases.push(() => {
              applied.push(selection.modelId);
              resolve(true);
            });
          }),
      ),
    };
    const state = new TuiModelState({
      runtime: runtime as never,
      currentSessionId: () => 'session-a',
      onChanged: mock(),
    });

    const first = state.select(model('MiniMax-M2.7'), 'session-a');
    const second = state.select(model('MiniMax-M3'), 'session-a');
    await waitFor(() => expect(releases).toHaveLength(1));
    releases[0]?.();
    await waitFor(() => expect(releases).toHaveLength(2));
    releases[1]?.();
    await Promise.all([first, second]);

    expect(applied).toEqual(['MiniMax-M2.7', 'MiniMax-M3']);
    expect(state.selected()).toMatchObject({ modelId: 'MiniMax-M3', selected: true });
  });

  it('sends the chosen think effort and keeps it as the optimistic value', async () => {
    const runtime = {
      listModels: mock(async () => []),
      selectModel: mock(async () => true),
    };
    const state = new TuiModelState({
      runtime,
      currentSessionId: () => 'session-a',
      onChanged: mock(),
    });

    await state.select(
      {
        providerId: 'custom_provider:byok',
        modelId: 'byok-large-5',
        thinking: { effort: 'max' },
      },
      'session-a',
    );

    expect(runtime.selectModel).toHaveBeenCalledWith(
      expect.objectContaining({ thinking: { effort: 'max' } }),
      'session-a',
    );
    expect(state.selectedEffort()).toBe('max');
    // The selection shape must not leak into the model roster type.
    expect(state.selected()).not.toHaveProperty('thinking');
  });

  it('restores the think effort from the Session echo on refresh', async () => {
    const runtime = {
      listModels: mock(async () => [model('byok-large-5', true)]),
      selectModel: mock(async () => true),
      getSession: mock(async () => ({
        sessionId: 'session-a',
        model: { thinking: { effort: 'xhigh' } },
      })),
    };
    const state = new TuiModelState({
      runtime: runtime as never,
      currentSessionId: () => 'session-a',
      onChanged: mock(),
    });

    await state.refresh('session-a');

    expect(runtime.getSession).toHaveBeenCalledWith('session-a');
    expect(state.selectedEffort()).toBe('xhigh');
  });

  it('keeps the last known effort when the Session echo fails', async () => {
    const runtime = {
      listModels: mock(async () => [model('byok-large-5', true)]),
      selectModel: mock(async () => true),
      getSession: mock(async () => {
        throw new Error('session read failed');
      }),
    };
    const state = new TuiModelState({
      runtime: runtime as never,
      currentSessionId: () => 'session-a',
      onChanged: mock(),
    });

    await state.select(
      { providerId: 'minimax', modelId: 'byok-large-5', thinking: { effort: 'high' } },
      'session-a',
    );
    await state.refresh('session-a');

    expect(state.selected()).toMatchObject({ modelId: 'byok-large-5' });
    expect(state.selectedEffort()).toBe('high');
  });

  it('drops the effort once the Session is reset', async () => {
    const runtime = {
      listModels: mock(async () => []),
      selectModel: mock(async () => true),
    };
    const state = new TuiModelState({
      runtime,
      currentSessionId: () => 'session-a',
      onChanged: mock(),
    });

    await state.select(
      { providerId: 'minimax', modelId: 'MiniMax-M3', thinking: { effort: 'low' } },
      'session-a',
    );
    state.reset();

    expect(state.selectedEffort()).toBeUndefined();
  });
});
