import { describe, expect, it } from 'bun:test';

import { EN_CONFIG_COPY } from '../src/copy.en.js';
import { ZH_HANS_CONFIG_COPY } from '../src/copy.zh-Hans.js';
import { configText } from '../src/copy.js';

/**
 * The configuration catalog, paired with its translation.
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
> = [['config', EN_CONFIG_COPY, ZH_HANS_CONFIG_COPY]];

function placeholders(value: string): string[] {
  return [...value.matchAll(/\{([A-Za-z0-9_.-]+)\}/gu)].map((match) => match[1]);
}

describe('Configuration catalog', () => {
  it('covers the configuration surface', () => {
    expect(CATALOGS.length).toBeGreaterThanOrEqual(1);
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
    const key = 'skillEvolve.lifecycle.invalid';
    const values = { staleThresholdDays: 15, archiveThresholdDays: 30 };
    expect(configText(key, values, 'en')).toBe(
      EN_CONFIG_COPY[key].replace('{staleThresholdDays}', '15').replace('{archiveThresholdDays}', '30'),
    );
    expect(configText(key, values, 'zh-Hans')).toBe(
      ZH_HANS_CONFIG_COPY[key]
        .replace('{staleThresholdDays}', '15')
        .replace('{archiveThresholdDays}', '30'),
    );
  });

  it('keeps the unknown provider auth-mode warning verbatim and translates it', () => {
    expect(EN_CONFIG_COPY['provider.authMode.unknown']).toBe(
      'Unknown provider authMode "{value}"; falling back to compatibility resolution.',
    );
    expect(configText('provider.authMode.unknown', { value: 'team-mode' }, 'en')).toBe(
      'Unknown provider authMode "team-mode"; falling back to compatibility resolution.',
    );
    expect(configText('provider.authMode.unknown', { value: 'team-mode' }, 'zh-Hans')).toBe(
      '未知的 provider authMode "team-mode"，已回退到兼容解析。',
    );
  });
});
