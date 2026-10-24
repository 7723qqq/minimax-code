import { beforeAll, describe, expect, it } from 'bun:test';

import { setProcessLocale } from '@mavis/shared/i18n';

import { turnAdmissionError } from '../../src/application/conversation/errors.js';
import { v2ConversationText } from '../../src/application/conversation/copy.js';
import { EN_V2_CONVERSATION_COPY } from '../../src/application/conversation/copy.en.js';
import { ZH_HANS_V2_CONVERSATION_COPY } from '../../src/application/conversation/copy.zh-Hans.js';
import { v2TurnSystemText } from '../../src/service/turn-system/copy.js';
import { EN_V2_TURN_SYSTEM_COPY } from '../../src/service/turn-system/copy.en.js';
import { ZH_HANS_V2_TURN_SYSTEM_COPY } from '../../src/service/turn-system/copy.zh-Hans.js';

/**
 * Every v2 runtime catalog, paired with its translation.
 *
 * The `satisfies` clause in each translation already makes a missing key a
 * compile error. This suite keeps the guarantees the type system cannot
 * express: a non-empty template on both sides, and the same set of `{name}`
 * placeholders in both, so an English template and a Chinese one can never
 * end up filling different arguments.
 */
const CATALOGS: ReadonlyArray<
  readonly [
    name: string,
    english: Readonly<Record<string, string>>,
    chinese: Readonly<Record<string, string>>,
  ]
> = [
  ['v2-conversation', EN_V2_CONVERSATION_COPY, ZH_HANS_V2_CONVERSATION_COPY],
  ['v2-turn-system', EN_V2_TURN_SYSTEM_COPY, ZH_HANS_V2_TURN_SYSTEM_COPY],
];

function placeholders(value: string): string[] {
  return [...value.matchAll(/\{([A-Za-z0-9_.-]+)\}/gu)].map((match) => match[1]);
}

describe('v2 runtime catalogs', () => {
  it('covers every v2 catalog surface', () => {
    // A new v2 catalog that is not listed here is a catalog no test checks,
    // which is how an incomplete translation reaches production.
    expect(CATALOGS.length).toBeGreaterThanOrEqual(2);
  });

  it.each(CATALOGS)('%s translates every English key into Chinese', (_name, english, chinese) => {
    expect(Object.keys(chinese).sort()).toEqual(Object.keys(english).sort());
  });

  it.each(CATALOGS)(
    '%s keeps every template non-empty in both languages',
    (_name, english, chinese) => {
      for (const [key, value] of Object.entries(english)) {
        expect(value.trim(), `en ${key}`).not.toBe('');
      }
      for (const [key, value] of Object.entries(chinese)) {
        expect(value.trim(), `zh ${key}`).not.toBe('');
      }
    },
  );

  it.each(CATALOGS)(
    '%s preserves the same placeholders in both languages',
    (_name, english, chinese) => {
      for (const [key, value] of Object.entries(english)) {
        expect(placeholders(chinese[key] ?? ''), `zh ${key}`).toEqual(placeholders(value));
      }
    },
  );
});

describe('v2 runtime catalog lookup', () => {
  it('renders the Chinese template for an explicit locale', () => {
    expect(v2ConversationText('handoff.notAllowed', 'zh-Hans')).toBe('不允许进行 Cloud 交接。');
    expect(v2TurnSystemText('pluginHook.outcome.toolUnchanged', 'zh-Hans')).toBe(
      '本次 Hook 未改变工具执行与结果。',
    );
  });

  it('keeps the English Plugin Hook warnings verbatim', () => {
    expect(v2TurnSystemText('pluginHook.terminalControlUnsupported', 'en')).toBe(
      'A Plugin Hook requested terminal control output, but this runtime surface does not execute terminal control sequences.',
    );
    const toolOutcome = v2TurnSystemText('pluginHook.outcome.toolUnchanged', 'en');
    const conversationOutcome = v2TurnSystemText('pluginHook.outcome.conversationContinued', 'en');
    const values = (outcome: string) => ({ pluginName: 'demo', event: 'PreToolUse', outcome });
    expect(v2TurnSystemText('pluginHook.skippedCompatibility', values(toolOutcome), 'en')).toBe(
      'A compatibility-limited Hook from Plugin "demo" was skipped during PreToolUse. ' +
        'The tool execution and result were not changed by this Hook.',
    );
    expect(v2TurnSystemText('pluginHook.timedOut', values(toolOutcome), 'en')).toBe(
      'Plugin "demo" Hook timed out and was skipped during PreToolUse. ' +
        'The tool execution and result were not changed by this Hook.',
    );
    expect(v2TurnSystemText('pluginHook.incomplete', values(conversationOutcome), 'en')).toBe(
      'Plugin "demo" Hook could not complete and was skipped during PreToolUse. ' +
        'The conversation continued without this Hook.',
    );
  });
});

describe('turn admission errors', () => {
  beforeAll(() => {
    // The admission message follows the process locale, so pin English here:
    // the assertions below read the English wording, not the host language.
    setProcessLocale('en');
  });

  it('reports the Cloud handoff denial cause with its own message', () => {
    expect(turnAdmissionError('policy:cloud-handoff:denied:proposal-pending')).toEqual({
      status: 409,
      key: 'HANDOFF_PREFLIGHT_DENIED:proposal-pending',
      message: 'This session already has a handoff proposal awaiting approval.',
    });
  });

  it('falls back to the generic denial for an unknown cause', () => {
    expect(turnAdmissionError('policy:cloud-handoff:denied:unknown-cause')).toEqual({
      status: 409,
      key: 'HANDOFF_PREFLIGHT_DENIED',
      message: 'Cloud handoff is not allowed.',
    });
  });

  it('reports a turn aborted before admission', () => {
    expect(turnAdmissionError('policy:turn-abort:pre-admission')).toEqual({
      status: 409,
      key: 'local_turn_aborted',
      message: 'Turn was stopped before execution.',
    });
  });

  it('renders the Chinese message for an explicit locale', () => {
    expect(v2ConversationText('handoff.cleanupPending', 'zh-Hans')).toBe(
      '上一次 Cloud 交接正在等待清理。',
    );
    expect(v2ConversationText('handoff.preparationFailed', 'zh-Hans')).toBe(
      '无法准备 Cloud 交接，请稍后重试。',
    );
  });
});
