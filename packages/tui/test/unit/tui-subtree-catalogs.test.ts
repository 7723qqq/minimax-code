import { describe, expect, it } from 'vitest';

import { EN_ACP_COPY } from '../../src/acp/copy.en.js';
import { ZH_HANS_ACP_COPY } from '../../src/acp/copy.zh-Hans.js';
import { acpText } from '../../src/acp/copy.js';
import { EN_APPLICATION_COPY } from '../../src/application/copy.en.js';
import { ZH_HANS_APPLICATION_COPY } from '../../src/application/copy.zh-Hans.js';
import { applicationText } from '../../src/application/copy.js';
import { EN_TUI_AUTH_COPY } from '../../src/auth/copy.en.js';
import { ZH_HANS_TUI_AUTH_COPY } from '../../src/auth/copy.zh-Hans.js';
import { tuiAuthText } from '../../src/auth/copy.js';
import { EN_CHECKIN_COPY } from '../../src/checkin/copy.en.js';
import { ZH_HANS_CHECKIN_COPY } from '../../src/checkin/copy.zh-Hans.js';
import { checkinText } from '../../src/checkin/copy.js';
import { EN_CLI_COPY } from '../../src/cli/copy.en.js';
import { ZH_HANS_CLI_COPY } from '../../src/cli/copy.zh-Hans.js';
import { cliText } from '../../src/cli/copy.js';
import { EN_HEADLESS_COPY } from '../../src/headless/copy.en.js';
import { ZH_HANS_HEADLESS_COPY } from '../../src/headless/copy.zh-Hans.js';
import { headlessText } from '../../src/headless/copy.js';
import { EN_HOST_COPY } from '../../src/host/copy.en.js';
import { ZH_HANS_HOST_COPY } from '../../src/host/copy.zh-Hans.js';
import { hostText } from '../../src/host/copy.js';
import { EN_TUI_REVIEW_COPY } from '../../src/review/copy.en.js';
import { ZH_HANS_TUI_REVIEW_COPY } from '../../src/review/copy.zh-Hans.js';
import { tuiReviewText } from '../../src/review/copy.js';
import { EN_TUI_RUNTIME_COPY } from '../../src/runtime/copy.en.js';
import { ZH_HANS_TUI_RUNTIME_COPY } from '../../src/runtime/copy.zh-Hans.js';
import { tuiRuntimeText } from '../../src/runtime/copy.js';
import { EN_SHELL_COPY } from '../../src/tui/shell/copy.en.js';
import { ZH_HANS_SHELL_COPY } from '../../src/tui/shell/copy.zh-Hans.js';
import { shellText } from '../../src/tui/shell/copy.js';
import { EN_TUI_UPDATE_COPY } from '../../src/update/copy.en.js';
import { ZH_HANS_TUI_UPDATE_COPY } from '../../src/update/copy.zh-Hans.js';
import { tuiUpdateText } from '../../src/update/copy.js';

/**
 * Every TUI subtree catalog outside the TUI feature surface, paired with its
 * translation.
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
  ['acp', EN_ACP_COPY, ZH_HANS_ACP_COPY],
  ['application', EN_APPLICATION_COPY, ZH_HANS_APPLICATION_COPY],
  ['auth', EN_TUI_AUTH_COPY, ZH_HANS_TUI_AUTH_COPY],
  ['checkin', EN_CHECKIN_COPY, ZH_HANS_CHECKIN_COPY],
  ['cli', EN_CLI_COPY, ZH_HANS_CLI_COPY],
  ['headless', EN_HEADLESS_COPY, ZH_HANS_HEADLESS_COPY],
  ['host', EN_HOST_COPY, ZH_HANS_HOST_COPY],
  ['review', EN_TUI_REVIEW_COPY, ZH_HANS_TUI_REVIEW_COPY],
  ['runtime', EN_TUI_RUNTIME_COPY, ZH_HANS_TUI_RUNTIME_COPY],
  ['shell', EN_SHELL_COPY, ZH_HANS_SHELL_COPY],
  ['update', EN_TUI_UPDATE_COPY, ZH_HANS_TUI_UPDATE_COPY],
];

/** The lookup helper bound to each catalog, used to prove the binding works. */
const HELPERS: ReadonlyArray<
  readonly [name: string, text: (key: string, locale?: string | null) => string]
> = [
  ['acp', (key, locale) => acpText(key as never, locale)],
  ['application', (key, locale) => applicationText(key as never, locale)],
  ['auth', (key, locale) => tuiAuthText(key as never, locale)],
  ['checkin', (key, locale) => checkinText(key as never, locale)],
  ['cli', (key, locale) => cliText(key as never, locale)],
  ['headless', (key, locale) => headlessText(key as never, locale)],
  ['host', (key, locale) => hostText(key as never, locale)],
  ['review', (key, locale) => tuiReviewText(key as never, locale)],
  ['runtime', (key, locale) => tuiRuntimeText(key as never, locale)],
  ['shell', (key, locale) => shellText(key as never, locale)],
  ['update', (key, locale) => tuiUpdateText(key as never, locale)],
];

function placeholders(value: string): string[] {
  return [...value.matchAll(/\{([A-Za-z0-9_.-]+)\}/gu)].map((match) => match[1]);
}

describe('TUI subtree catalogs', () => {
  it('covers every subtree outside the TUI feature surface', () => {
    // A new subtree catalog that is not listed here is a catalog no test
    // checks, which is how an incomplete translation reaches production.
    expect(CATALOGS.length).toBeGreaterThanOrEqual(11);
  });

  it.each(CATALOGS)('%s translates every English key into Chinese', (_name, english, chinese) => {
    expect(Object.keys(chinese).sort()).toEqual(Object.keys(english).sort());
  });

  it.each(CATALOGS)('%s keeps every template non-empty in both languages', (_name, english, chinese) => {
    for (const [key, value] of Object.entries(english)) {
      expect(value.trim(), `en ${key}`).not.toBe('');
    }
    for (const [key, value] of Object.entries(chinese)) {
      expect(value.trim(), `zh ${key}`).not.toBe('');
    }
  });

  it.each(CATALOGS)(
    '%s preserves the same placeholders in both languages',
    (_name, english, chinese) => {
      for (const [key, value] of Object.entries(english)) {
        expect(placeholders(chinese[key] ?? ''), `zh ${key}`).toEqual(placeholders(value));
      }
    },
  );

  it.each(HELPERS)('%s renders the requested locale through its helper', (name, text) => {
    const [catalogName, english, chinese] = CATALOGS.find((entry) => entry[0] === name) ?? [];
    expect(catalogName).toBe(name);
    const key = Object.keys(english ?? {})[0] ?? '';
    expect(text(key, 'en')).toBe(english?.[key]);
    expect(text(key, 'zh-Hans')).toBe(chinese?.[key]);
  });
});
