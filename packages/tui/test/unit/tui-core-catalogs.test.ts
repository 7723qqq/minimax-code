import { describe, expect, it } from 'vitest';

import { EN_TUI_COPY } from '../../src/tui/copy.en.js';
import { ZH_HANS_TUI_COPY } from '../../src/tui/copy.zh-Hans.js';
import { tuiText } from '../../src/tui/copy.js';
import { EN_LAUNCHER_COPY } from '../../src/tui/launcher-copy.en.js';
import { ZH_HANS_LAUNCHER_COPY } from '../../src/tui/launcher-copy.zh-Hans.js';
import { launcherText } from '../../src/tui/launcher-copy.js';

/**
 * The TUI catalogs for the surfaces that do not own a dedicated catalog: the
 * agent-team panel and summary, the background-work panel, the settings list,
 * the side-session command, the application action failures and the
 * history/hook projections, plus the launcher's exit slogan and TTY notice.
 *
 * The `satisfies` clause in the translation already makes a missing key a
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
  ['tui', EN_TUI_COPY, ZH_HANS_TUI_COPY],
  ['launcher', EN_LAUNCHER_COPY, ZH_HANS_LAUNCHER_COPY],
];

function placeholders(value: string): string[] {
  return [...value.matchAll(/\{([A-Za-z0-9_.-]+)\}/gu)].map((match) => match[1]);
}

describe('TUI core catalog', () => {
  it('covers the TUI surfaces that have no dedicated catalog', () => {
    // A catalog that is not listed here is a catalog no test checks, which is
    // how an incomplete translation reaches production.
    expect(CATALOGS.length).toBeGreaterThanOrEqual(2);
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

  it('renders the requested locale through its helper', () => {
    expect(tuiText('status.done', 'en')).toBe(EN_TUI_COPY['status.done']);
    expect(tuiText('status.done', 'zh-Hans')).toBe(ZH_HANS_TUI_COPY['status.done']);
    expect(launcherText('launcher.exitSlogan', 'en')).toBe(EN_LAUNCHER_COPY['launcher.exitSlogan']);
    expect(launcherText('launcher.exitSlogan', 'zh-Hans')).toBe(
      ZH_HANS_LAUNCHER_COPY['launcher.exitSlogan'],
    );
  });
});
