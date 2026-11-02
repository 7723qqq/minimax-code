import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'bun:test';

import { PluginHookRunner } from '../src/index.js';
import type {
  PluginHookCommandHandler,
  PluginHookEventInput,
} from '../src/contracts.js';

const roots: string[] = [];
function tmp(): string {
  const dir = mkdtempSync(join(tmpdir(), 'hook-stdin-'));
  roots.push(dir);
  return dir;
}
afterEach(() => {
  for (const dir of roots.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe('PluginHookRunner stdin writes', () => {
  it('swallows EPIPE when a hook exits without reading its stdin', async () => {
    const pluginRoot = tmp();
    // Under the 1 MiB serializeHookInput cap but far beyond the pipe buffer:
    // the child exits immediately, so the pending write ends as a rejection.
    // The bulk rides in `sessionId`, which serializeHookInput always emits —
    // vendor payload picking would drop an unknown payload key.
    const bulkySessionId = 'x'.repeat(800 * 1024);
    // The marker proves the hook actually ran: a filtered-out handler would
    // make every assertion below pass vacuously.
    const marker = join(pluginRoot, 'hook-ran.marker');
    const handler: PluginHookCommandHandler = {
      kind: 'command',
      sourceFormat: 'MINIMAX',
      pluginName: 'ePIPE-fixture',
      pluginRoot,
      sourcePath: 'hooks/hooks.json',
      event: 'Stop',
      command: process.execPath,
      args: ['-e', `require('fs').writeFileSync(${JSON.stringify(marker)}, 'ran'); process.exit(0);`],
      timeoutMs: 15_000,
      declarationOrder: 0,
    };
    const input = {
      event: 'Stop',
      sessionId: bulkySessionId,
      cwd: pluginRoot,
    } as unknown as PluginHookEventInput;

    const rejections: unknown[] = [];
    const onUnhandled = (reason: unknown): void => {
      rejections.push(reason);
    };
    process.on('unhandledRejection', onUnhandled);
    try {
      const runner = new PluginHookRunner();
      const result = await runner.run([handler], input);
      // The write settles after the child exits; give the rejection a turn to
      // surface before asserting the probe stayed empty.
      await new Promise((resolve) => setTimeout(resolve, 300));
      expect(existsSync(marker)).toBe(true);
      expect(rejections).toEqual([]);
      expect(result.diagnostics).toEqual([]);
    } finally {
      process.off('unhandledRejection', onUnhandled);
    }
  });
});
