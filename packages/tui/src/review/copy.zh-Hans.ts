import type { TuiReviewCopyKey } from './copy.en.js';

/**
 * Simplified Chinese copy for the code review projection.
 *
 * The `satisfies` clause is the completeness check: a key present in the
 * English catalog but absent here fails `pnpm typecheck`.
 */
export const ZH_HANS_TUI_REVIEW_COPY = {
  'review.running': '正在评审本地改动…',
  'review.interruptedTitle': '代码评审已中断',
  'review.interruptedContent': '代码评审已被中断。',
  'review.failedTitle': '代码评审失败',
  'review.failedContent': '代码评审未能完成。',
  'review.invalidResult': 'Runtime 拒绝了无效的评审结果。',
  'review.invalidStructuredResult': 'Runtime 返回了无效的结构化评审结果。',
  'review.findings.one': '代码评审 · {count} 个问题',
  'review.findings.many': '代码评审 · {count} 个问题',
  'review.emptyResult': 'Runtime 返回了空的评审结果。',
  'review.passed': '代码评审通过',
} as const satisfies Readonly<Record<TuiReviewCopyKey, string>>;
