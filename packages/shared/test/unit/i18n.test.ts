import { afterEach, describe, expect, it } from 'vitest';

import {
  createCatalogSet,
  createCatalogText,
  interpolate,
  lookupCatalog,
  translate,
} from '../../src/i18n/catalog.js';
import {
  DEFAULT_LOCALE,
  ELECTRON_LOCALE_ENV,
  LOCALE_OVERRIDE_ENV,
  isChineseLocale,
  isValidLocaleTag,
  localeLanguage,
  processLocaleOverride,
  resolveLocale,
  resolveLocaleName,
  setProcessLocale,
  type LocaleName,
} from '../../src/i18n/locale.js';
import { EN_RUNTIME_TRANSLATIONS } from '../../src/i18n/runtime-catalog.en.js';
import { translateRuntimeText, type RuntimeLocaleName } from '../../src/i18n/runtime-catalog.js';
import { ZH_HANS_RUNTIME_TRANSLATIONS } from '../../src/i18n/runtime-catalog.zh-Hans.js';

describe('locale resolution', () => {
  it('reduces BCP 47 tags to a lowercase language subtag', () => {
    expect(localeLanguage('zh-CN')).toBe('zh');
    expect(localeLanguage('zh_CN.UTF-8')).toBe('zh');
    expect(localeLanguage('ZH-Hans')).toBe('zh');
    expect(localeLanguage('en-US')).toBe('en');
    expect(localeLanguage('  pt-BR  ')).toBe('pt');
  });

  it('falls back to English for empty and malformed input instead of throwing', () => {
    expect(localeLanguage(undefined)).toBe(DEFAULT_LOCALE);
    expect(localeLanguage(null)).toBe(DEFAULT_LOCALE);
    expect(localeLanguage('')).toBe(DEFAULT_LOCALE);
    expect(localeLanguage('   ')).toBe(DEFAULT_LOCALE);
    expect(localeLanguage('not a locale!!')).toBe(DEFAULT_LOCALE);
    expect(localeLanguage('123')).toBe(DEFAULT_LOCALE);
  });

  it('treats every Chinese variant as Chinese', () => {
    for (const tag of ['zh', 'zh-CN', 'zh-Hans', 'zh_TW', 'ZH-Hant-HK']) {
      expect(isChineseLocale(tag)).toBe(true);
    }
    for (const tag of ['en', 'en-US', 'ja', 'ko', undefined]) {
      expect(isChineseLocale(tag)).toBe(false);
    }
  });

  it('prefers an explicit locale over every implicit source', () => {
    const environment = {
      [LOCALE_OVERRIDE_ENV]: 'en',
      [ELECTRON_LOCALE_ENV]: 'en',
      LANG: 'en_US.UTF-8',
    };
    expect(resolveLocale('zh-CN', environment)).toBe('zh-CN');
  });

  it('honors the Electron handshake, then the runtime override, then LANG', () => {
    // Step 5 is injected away so this case tests the environment chain itself:
    // left to the host, `Intl` answers before `LANG` and the result differs
    // between macOS, Linux CI and a zh-CN desktop.
    const noSystemLocale = () => undefined;
    expect(
      resolveLocale(
        undefined,
        { [ELECTRON_LOCALE_ENV]: 'zh', [LOCALE_OVERRIDE_ENV]: 'en' },
        noSystemLocale,
      ),
    ).toBe('zh');
    expect(resolveLocale(undefined, { [LOCALE_OVERRIDE_ENV]: 'zh-Hans' }, noSystemLocale)).toBe(
      'zh-Hans',
    );
    expect(resolveLocale(undefined, { LANG: 'zh_CN.UTF-8' }, noSystemLocale)).toBe('zh-CN');
  });

  it('prefers the host Intl locale over LANG and LC_ALL', () => {
    // The other half of the contract: `LANG` is not a way to override the host.
    expect(resolveLocale(undefined, { LANG: 'zh_CN.UTF-8' }, () => 'pt-BR')).toBe('pt-BR');
    expect(resolveLocale(undefined, { LC_ALL: 'zh_TW.UTF-8' }, () => 'en-GB')).toBe('en-GB');
  });

  it('ignores blank overrides rather than resolving to an empty locale', () => {
    // Blank values are skipped, so the next source in the documented order wins.
    expect(resolveLocale('   ', { [LOCALE_OVERRIDE_ENV]: 'zh' })).toBe('zh');
    expect(resolveLocale(undefined, { [ELECTRON_LOCALE_ENV]: '  ', [LOCALE_OVERRIDE_ENV]: 'zh' })).toBe(
      'zh',
    );
    expect(
      resolveLocale(undefined, { [ELECTRON_LOCALE_ENV]: '', [LOCALE_OVERRIDE_ENV]: '   ' }),
    ).not.toBe('');
  });

  it('maps Chinese variants to the zh-Hans catalog name', () => {
    expect(resolveLocaleName('zh-CN', {})).toBe('zh-Hans');
    expect(resolveLocaleName('en-GB', {})).toBe('en');
    expect(resolveLocaleName('fr-FR', {})).toBe('en');
  });

  it('resolves into the one declared set of catalog names', () => {
    // The annotation is the assertion: widening the resolver's return type to
    // `string` stops this file compiling, so the resolver and the catalogs can
    // never disagree about which locale names exist.
    const resolved: LocaleName = resolveLocaleName('zh-CN', {});
    const catalogNames: readonly RuntimeLocaleName[] = ['en', 'zh-Hans'];
    expect(resolved).toBe('zh-Hans');
    expect(catalogNames).toContain(resolved);
  });
});

describe('catalog interpolation', () => {
  it('replaces named placeholders with stringified values', () => {
    expect(interpolate('MCode {version} is installed.', { version: '0.6.5' })).toBe(
      'MCode 0.6.5 is installed.',
    );
    expect(interpolate('{count} messages', { count: 3 })).toBe('3 messages');
  });

  it('leaves unknown placeholders untouched instead of emitting gaps', () => {
    expect(interpolate('Hello {name}', {})).toBe('Hello {name}');
    expect(interpolate('Hello {name}', { other: 'x' })).toBe('Hello {name}');
  });

  it('substitutes in a single pass so a value cannot inject a later placeholder', () => {
    // The previous `replaceAll` loop over entries could expand `{b}` inside the
    // value supplied for `{a}`. One pass keeps the value literal.
    expect(interpolate('{a}{b}', { a: '{b}', b: 'X' })).toBe('{b}X');
  });

  it('returns the template unchanged when no values are supplied', () => {
    expect(interpolate('No placeholders here')).toBe('No placeholders here');
    expect(interpolate('')).toBe('');
  });
});

describe('catalog lookup and fallback', () => {
  const reference = { hello: 'Hello', goodbye: 'Goodbye' } as const;
  const set = createCatalogSet(reference, { 'zh-Hans': { hello: '你好', goodbye: '再见' } });

  it('returns the requested translation when present', () => {
    expect(lookupCatalog(set, 'zh-Hans', 'hello')).toBe('你好');
  });

  it('falls back to English for an unknown catalog name', () => {
    expect(lookupCatalog(set, 'de', 'hello')).toBe('Hello');
  });

  it('falls back to English for a key missing from a translation', () => {
    const partial = createCatalogSet(reference, {
      'zh-Hans': { hello: '你好', goodbye: undefined as unknown as string },
    });
    expect(lookupCatalog(partial, 'zh-Hans', 'goodbye')).toBe('Goodbye');
  });

  it('returns the key itself when neither catalog has it, never undefined', () => {
    const sparse = createCatalogSet({} as Record<string, string>, {});
    expect(lookupCatalog(sparse, 'zh-Hans', 'absent' as never)).toBe('absent');
  });

  it('interpolates through translate', () => {
    const withPlaceholder = createCatalogSet({ greeting: 'Hi {name}' } as const, {
      'zh-Hans': { greeting: '你好 {name}' },
    });
    expect(translate(withPlaceholder, 'zh-Hans', 'greeting', { name: 'Ada' })).toBe('你好 Ada');
  });
});

describe('catalog text helper', () => {
  const reference = { 'greeting.hello': 'Hello {name}', 'greeting.bye': 'Bye' } as const;
  const set = createCatalogSet(reference, {
    'zh-Hans': { 'greeting.hello': '你好 {name}', 'greeting.bye': '再见' },
  });
  const text = createCatalogText(set, (explicit) =>
    explicit && isChineseLocale(explicit) ? 'zh-Hans' : 'en',
  );

  it('uses the resolver when no locale is supplied', () => {
    expect(text('greeting.bye')).toBe('Bye');
  });

  it('accepts a locale as the second argument, matching the migrated helpers', () => {
    expect(text('greeting.bye', 'zh-CN')).toBe('再见');
    expect(text('greeting.bye', null)).toBe('Bye');
  });

  it('accepts values as the second argument and a locale as the third', () => {
    expect(text('greeting.hello', { name: 'Ada' }, 'zh-CN')).toBe('你好 Ada');
    expect(text('greeting.hello', { name: 'Ada' })).toBe('Hello Ada');
  });
});

describe('runtime catalog completeness', () => {
  it('translates every English key into Chinese', () => {
    // `satisfies RuntimeTranslations` already enforces this at compile time;
    // asserting it at runtime keeps the guarantee if the assertion is ever lost.
    const englishKeys = Object.keys(EN_RUNTIME_TRANSLATIONS).sort();
    const chineseKeys = Object.keys(ZH_HANS_RUNTIME_TRANSLATIONS).sort();
    expect(chineseKeys).toEqual(englishKeys);
  });

  it('keeps every template non-empty in both languages', () => {
    for (const [key, value] of Object.entries(EN_RUNTIME_TRANSLATIONS)) {
      expect(value.trim(), `en ${key}`).not.toBe('');
    }
    for (const [key, value] of Object.entries(ZH_HANS_RUNTIME_TRANSLATIONS)) {
      expect(value.trim(), `zh ${key}`).not.toBe('');
    }
  });

  it('preserves the same placeholders in both languages', () => {
    const placeholders = (value: string) => [...value.matchAll(/\{([A-Za-z0-9_.-]+)\}/gu)].map((m) => m[1]);
    for (const key of Object.keys(EN_RUNTIME_TRANSLATIONS) as (keyof typeof EN_RUNTIME_TRANSLATIONS)[]) {
      expect(placeholders(ZH_HANS_RUNTIME_TRANSLATIONS[key]), `zh ${key}`).toEqual(
        placeholders(EN_RUNTIME_TRANSLATIONS[key]),
      );
    }
  });

  it('fills placeholders through the same interpolation as every catalog', () => {
    expect(
      translateRuntimeText('en', 'channel.accessControlGuide', { url: 'https://example.test/g' }),
    ).toBe('Configuration guide: https://example.test/g');
    expect(
      translateRuntimeText('zh-CN', 'channel.accessControlGuide', { url: 'https://example.test/g' }),
    ).toBe('配置指南：https://example.test/g');
  });

  it('serves the archive title prefix both runtime packages compose', () => {
    // local-runtime and local-runtime-v2 read this one key; a package-local copy
    // is what let the two titles drift apart.
    expect(translateRuntimeText('en', 'archiveTitle.prefix')).toBe('Memory archive: ');
    expect(translateRuntimeText('zh-CN', 'archiveTitle.prefix')).toBe('记忆归档：');
    expect(translateRuntimeText(undefined, 'archiveTitle.prefix')).toBe(
      translateRuntimeText(resolveLocale(), 'archiveTitle.prefix'),
    );
  });

  it('serves the Plan review questionnaire from the same catalog as Plan entry', () => {
    // The Plan review card and the Plan entry card are the same surface for
    // the same reader. A package-local copy for one of them is what let the
    // review card stay English while the entry card was translated.
    expect(translateRuntimeText('en', 'plan.review.title')).toBe('Review implementation plan');
    expect(translateRuntimeText('zh-CN', 'plan.review.title')).toBe('审阅实施方案');
    expect(translateRuntimeText('zh-CN', 'plan.review.approve.label')).toBe('批准');
    expect(translateRuntimeText('zh-CN', 'plan.review.approve.description')).toBe(
      '退出计划模式并开始一个实施回合。',
    );
  });

  it('serves the code-review title and the browser recovery hint to both packages', () => {
    // agent-tools and browser-core cannot import the TUI catalogs, so the
    // shared catalog is the one place these sentences live.
    expect(translateRuntimeText('en', 'review.failed')).toBe('Code review failed');
    expect(translateRuntimeText('zh-CN', 'review.failed')).toBe('代码审查失败');
    expect(translateRuntimeText('en', 'browser.inspectBeforeRetry')).toBe(
      'Inspect the current page before deciding whether to retry.',
    );
    expect(translateRuntimeText('zh-CN', 'browser.inspectBeforeRetry')).toBe(
      '请先检查当前页面，再决定是否重试。',
    );
  });

  it('names the Plan mode for every package that shows it', () => {
    // The `plan` token the permission API carries is a config value; the
    // label the reader sees belongs to the shared catalog.
    expect(translateRuntimeText('en', 'plan.mode.label')).toBe('Plan mode');
    expect(translateRuntimeText('zh-CN', 'plan.mode.label')).toBe('计划模式');
  });
});

describe('locale saved in the interface', () => {
  afterEach(() => {
    setProcessLocale();
  });

  it('outranks the Desktop handshake and the environment override', () => {
    const environment = { [ELECTRON_LOCALE_ENV]: 'en-US', [LOCALE_OVERRIDE_ENV]: 'en-GB' };

    expect(setProcessLocale('zh-CN')).toBe(true);
    expect(resolveLocale(undefined, environment)).toBe('zh-CN');
    expect(resolveLocaleName(undefined, environment)).toBe('zh-Hans');
  });

  it('still loses to a locale a caller passes explicitly', () => {
    setProcessLocale('zh-CN');

    expect(resolveLocale('en-US', { [ELECTRON_LOCALE_ENV]: 'zh-CN' })).toBe('en-US');
    expect(resolveLocaleName('en-GB')).toBe('en');
  });

  it('clears the override when the saved value disappears or is malformed', () => {
    setProcessLocale('zh-CN');

    expect(setProcessLocale()).toBe(false);
    expect(processLocaleOverride()).toBeUndefined();
    expect(resolveLocale(undefined, { [LOCALE_OVERRIDE_ENV]: 'en' })).toBe('en');

    setProcessLocale('zh-CN');
    expect(setProcessLocale('fr FR')).toBe(false);
    expect(processLocaleOverride()).toBeUndefined();
    expect(resolveLocaleName(undefined, { [ELECTRON_LOCALE_ENV]: 'en-US' })).toBe('en');
  });

  it('normalizes separators and rejects tags that are not well formed', () => {
    expect(setProcessLocale('zh_CN')).toBe(true);
    expect(processLocaleOverride()).toBe('zh-CN');

    expect(isValidLocaleTag('zh-Hans-CN')).toBe(true);
    expect(isValidLocaleTag('zh_CN')).toBe(true);
    expect(isValidLocaleTag('zh--CN')).toBe(false);
    expect(isValidLocaleTag('zh-')).toBe(false);
    expect(isValidLocaleTag('123')).toBe(false);
    expect(isValidLocaleTag('')).toBe(false);
  });
});
