import { createCatalogSet, resolveLocaleName, translate } from '@mavis/shared/i18n';

/**
 * User-visible code-review conclusions.
 *
 * The reviewer replies in the language of the change under review, so these
 * strings follow `prepared.responseLanguage` rather than the host locale. The
 * XML escaping, correction instructions and projection context in
 * `after-llm-hook.ts` are model-facing prompts and stay out of this catalog.
 */
const EN_REVIEW_COPY = {
  'conclusion.none': 'No reportable issues were found.',
  'fallback.invalidFormat':
    'The model returned the code review result in an invalid format. Please retry.',
  'summary.findOne': 'Found 1 issue that requires attention.',
  'summary.findMany': 'Found {count} issues that require attention.',
  'session.title': 'Code review',
} as const;

const ZH_HANS_REVIEW_COPY = {
  'conclusion.none': '未发现需要报告的问题。',
  'fallback.invalidFormat': '模型返回审查结果格式无效，请重试。',
  'summary.findOne': '发现 1 个需要处理的问题。',
  'summary.findMany': '发现 {count} 个需要处理的问题。',
  'session.title': '代码审查',
} as const satisfies Readonly<Record<keyof typeof EN_REVIEW_COPY, string>>;

const REVIEW_CATALOG = createCatalogSet(EN_REVIEW_COPY, { 'zh-Hans': ZH_HANS_REVIEW_COPY });

export type ReviewCopyKey = keyof typeof EN_REVIEW_COPY;

export function reviewText(
  language: string,
  key: ReviewCopyKey,
  values?: Readonly<Record<string, string | number>>,
): string {
  return translate(REVIEW_CATALOG, resolveLocaleName(language), key, values);
}

/** English and Chinese need different grammar for a single finding. */
export function acceptedFindingSummaryText(language: string, count: number): string {
  return count === 1
    ? reviewText(language, 'summary.findOne')
    : reviewText(language, 'summary.findMany', { count });
}
