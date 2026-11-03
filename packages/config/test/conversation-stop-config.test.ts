import { stubEnv, unstubAllEnvs } from '../../../test/bun-test-setup.js';
import { afterEach, describe, expect, it } from 'bun:test';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { resolveConfigFromRaw } from '../src/config.js';
import {
  CONVERSATION_STOP_CONFIG_DEFAULTS,
  parseConversationStopConfig,
} from '../src/conversation-stop-config.js';

const directories: string[] = [];
afterEach(() => {
  unstubAllEnvs();
  for (const directory of directories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

function temporaryDataDir(): string {
  const directory = mkdtempSync(join(tmpdir(), 'mcode-conversation-stop-'));
  directories.push(directory);
  stubEnv('MINIMAX_DATA_DIR', directory);
  stubEnv('__MAVIS_RUNTIME_DATA_DIR', directory);
  stubEnv('__MAVIS_RUNTIME_DISABLE_GIT_AUTO_CONFIG', '1');
  return directory;
}

describe('conversation stop config', () => {
  it('enables both cascades by default', () => {
    expect(CONVERSATION_STOP_CONFIG_DEFAULTS).toEqual({
      stopSubAgent: true,
      stopAsyncBash: true,
    });
    expect(parseConversationStopConfig(undefined)).toEqual(CONVERSATION_STOP_CONFIG_DEFAULTS);
    expect(parseConversationStopConfig('conversation')).toEqual(
      CONVERSATION_STOP_CONFIG_DEFAULTS,
    );
    expect(parseConversationStopConfig({ stopSubAgent: 'false' })).toEqual(
      CONVERSATION_STOP_CONFIG_DEFAULTS,
    );
  });

  it('resolves defaults into the full config', () => {
    const directory = temporaryDataDir();
    expect(resolveConfigFromRaw({}, directory).conversation).toEqual(
      CONVERSATION_STOP_CONFIG_DEFAULTS,
    );
  });

  it('accepts explicit booleans', () => {
    expect(
      parseConversationStopConfig({ stopSubAgent: false, stopAsyncBash: false }),
    ).toEqual({ stopSubAgent: false, stopAsyncBash: false });
    expect(parseConversationStopConfig({ stopAsyncBash: false })).toEqual({
      stopSubAgent: true,
      stopAsyncBash: false,
    });
  });
});
