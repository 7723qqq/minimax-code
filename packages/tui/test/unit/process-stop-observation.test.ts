import { describe, expect, it } from 'bun:test';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createTuiProcessStopObservation } from '../../src/tui/platform/process-stop-observation.js';

describe('createTuiProcessStopObservation', () => {
  it('labels the Bun runtime and omits the compatibility version', () => {
    const root = mkdtempSync(path.join(tmpdir(), 'mcode-stop-observation-'));
    try {
      const observation = createTuiProcessStopObservation(
        { source: 'signal', terminalDead: false, signal: 'SIGTERM' },
        { homeDirectory: root, workspaceDir: root },
      );
      expect(observation.runtime.kind).toBe('bun');
      expect(observation.runtime.bunVersion).toBe(process.versions.bun);
      expect(observation.runtime.nodeVersion).toBeUndefined();
      // Bun's node:async_hooks ids are stubs, so no ids are reported.
      expect(observation.asyncResource).toEqual({ source: 'unavailable' });
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('keeps an explicit async context instead of the stub defaults', () => {
    const observation = createTuiProcessStopObservation(
      { source: 'signal', terminalDead: false },
      {
        homeDirectory: '.',
        workspaceDir: '.',
        asyncContext: {
          executionAsyncId: 7,
          triggerAsyncId: 3,
          resource: process.stdout,
        },
      },
    );
    expect(observation.asyncResource?.source).toBe('provided');
    expect(observation.asyncResource?.executionAsyncId).toBe(7);
    expect(observation.asyncResource?.triggerAsyncId).toBe(3);
  });
});
