import { describe, expect, it } from 'bun:test';

import { resolveLocaleName } from '@mavis/shared/i18n';

import { EN_SOURCE_REFERENCE_COPY } from '../../src/i18n/copy.en.js';
import { sourceReferenceText } from '../../src/i18n/copy.js';
import { ZH_HANS_SOURCE_REFERENCE_COPY } from '../../src/i18n/copy.zh-Hans.js';

describe('source-reference copy', () => {
  it('translates every English key into Chinese', () => {
    // `satisfies SourceReferenceTranslations` already enforces this at compile
    // time; asserting it at runtime keeps the guarantee if the assertion is
    // ever lost.
    expect(Object.keys(ZH_HANS_SOURCE_REFERENCE_COPY).sort()).toEqual(
      Object.keys(EN_SOURCE_REFERENCE_COPY).sort(),
    );
  });

  it('keeps every template non-empty in both languages', () => {
    for (const [key, value] of Object.entries(EN_SOURCE_REFERENCE_COPY)) {
      expect(value.trim(), `en ${key}`).not.toBe('');
    }
    for (const [key, value] of Object.entries(ZH_HANS_SOURCE_REFERENCE_COPY)) {
      expect(value.trim(), `zh ${key}`).not.toBe('');
    }
  });

  it('preserves the same placeholders in both languages', () => {
    const placeholders = (value: string) =>
      [...value.matchAll(/\{([A-Za-z0-9_.-]+)\}/gu)].map((match) => match[1]);
    for (const key of Object.keys(EN_SOURCE_REFERENCE_COPY) as (keyof typeof EN_SOURCE_REFERENCE_COPY)[]) {
      expect(placeholders(ZH_HANS_SOURCE_REFERENCE_COPY[key]), `zh ${key}`).toEqual(
        placeholders(EN_SOURCE_REFERENCE_COPY[key]),
      );
    }
  });

  it('reads the source labels in the requested locale', () => {
    expect(sourceReferenceText('sourceList.label', 'en')).toBe('Sources: ');
    expect(sourceReferenceText('sourceList.label', 'zh-CN')).toBe('来源：');
    expect(sourceReferenceText('sourceList.separator', 'en')).toBe(', ');
    expect(sourceReferenceText('sourceList.separator', 'zh-CN')).toBe('、');
    expect(sourceReferenceText('citation.labelSeparator', 'en')).toBe(': ');
    expect(sourceReferenceText('citation.labelSeparator', 'zh-CN')).toBe('：');
  });

  it('follows the host locale when no locale is supplied', () => {
    expect(sourceReferenceText('sourceList.label')).toBe(
      sourceReferenceText('sourceList.label', resolveLocaleName()),
    );
  });
});
