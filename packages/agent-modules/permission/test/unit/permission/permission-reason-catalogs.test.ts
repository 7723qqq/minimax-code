import { describe, expect, it } from 'bun:test';

import { EN_REASON_COPY, ZH_HANS_REASON_COPY } from '../../../src/reason-format.js';

/**
 * The permission-reason catalog and its translation.
 *
 * The `satisfies` clause in the translation already makes a missing key a
 * compile error. This suite keeps the guarantees the type system cannot
 * express: a non-empty template on both sides, the same set of `{name}`
 * placeholders in both, and bodies that carry no action label of their own —
 * the wrapper supplies the label, so a body that repeats it would be
 * double-prefixed in both languages.
 */
const CATALOGS: ReadonlyArray<
  readonly [
    name: string,
    english: Readonly<Record<string, string>>,
    chinese: Readonly<Record<string, string>>,
  ]
> = [['permission-reason', EN_REASON_COPY, ZH_HANS_REASON_COPY]];

function placeholders(value: string): string[] {
  return [...value.matchAll(/\{([A-Za-z0-9_.-]+)\}/gu)].map((match) => match[1]);
}

/** Leading action labels the wrapper owns, in both languages. */
const ACTION_PREFIXES = [
  'Allowed',
  'Blocked',
  'Needs confirmation',
  'Auto classifier',
  'LLM classifier',
  'No LLM client',
  '已允许',
  '已拒绝',
  '需要确认',
  '自动判定',
];

function bodyKeys(english: Readonly<Record<string, string>>): string[] {
  return Object.keys(english).filter((key) => key.startsWith('body.'));
}

describe('permission reason catalog', () => {
  it('covers every key in both languages', () => {
    expect(CATALOGS.length).toBeGreaterThanOrEqual(1);
    for (const [name, english, chinese] of CATALOGS) {
      expect(Object.keys(chinese).sort(), name).toEqual(Object.keys(english).sort());
    }
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

  it.each(CATALOGS)('%s translates every template', (_name, english, chinese) => {
    for (const [key, value] of Object.entries(english)) {
      expect(chinese[key], `zh ${key}`).not.toBe(value);
    }
  });

  it.each(CATALOGS)(
    '%s keeps the action label out of the body templates',
    (_name, english, chinese) => {
      for (const key of bodyKeys(english)) {
        const en = (english[key] ?? '').trimStart();
        const zh = (chinese[key] ?? '').trimStart();
        for (const prefix of ACTION_PREFIXES) {
          expect(en.startsWith(prefix), `en ${key}`).toBe(false);
          expect(zh.startsWith(prefix), `zh ${key}`).toBe(false);
        }
      }
    },
  );
});
