import type { ChangelogCopyKey } from './copy.en.js';

/**
 * Simplified Chinese copy for the changelog panel.
 *
 * The `satisfies` clause is the completeness check: a key present in the
 * English catalog but absent here fails `pnpm typecheck`.
 */
export const ZH_HANS_CHANGELOG_COPY = {
  escClose: 'Esc 关闭',
  linesOf: '第 {a}-{b} 行，共 {n} 行 · PgUp/PgDn 滚动 · Esc 关闭',
  mcodeVersion: 'MCode {version}',
} as const satisfies Readonly<Record<ChangelogCopyKey, string>>;
