import type { HistoryCopyKey } from './copy.en.js';

/**
 * Simplified Chinese copy for the prompt-history search panel.
 *
 * The `satisfies` clause is the completeness check: a key present in the
 * English catalog but absent here fails `pnpm typecheck`.
 */
export const ZH_HANS_HISTORY_COPY = {
  searchTitle: '搜索提示词历史',
  noMatches: '没有匹配的提示词',
} as const satisfies Readonly<Record<HistoryCopyKey, string>>;
