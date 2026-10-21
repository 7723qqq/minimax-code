import type { SourceReferenceTranslations } from './copy.en.js';

/**
 * Simplified Chinese source-reference labels.
 *
 * `satisfies SourceReferenceTranslations` is the completeness check: a key
 * present in the English catalog but absent here fails `pnpm typecheck`.
 *
 * Chinese has no plural form, so the list header and the per-item label are the
 * same string; the English catalog keeps them apart because English does.
 */
export const ZH_HANS_SOURCE_REFERENCE_COPY = {
  'sourceList.label': '来源：',
  'sourceList.itemLabel': '来源：',
  'sourceList.separator': '、',
  'citation.labelSeparator': '：',
} as const satisfies SourceReferenceTranslations;
