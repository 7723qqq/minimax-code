import type { HelpCopyKey } from './copy.en.js';

/**
 * Simplified Chinese copy for the help panel.
 *
 * The `satisfies` clause is the completeness check: a key present in the
 * English catalog but absent here fails `pnpm typecheck`.
 */
export const ZH_HANS_HELP_COPY = {
  title: '帮助',
  keyboardShortcuts: '键盘快捷键',
  slashCommands: '斜杠命令',
  sendWhileWorking: '发送；MCode 工作中时排队，随后发送',
  sendWhileIdle: '空闲时发送',
  escClose: 'Esc 关闭',
  escCloseWithKey: 'Esc 关闭 · {key} 关闭',
  showingRange: '显示第 {a}-{b} 项，共 {n} 项',
  scrollHint: '↑↓ / {up} / {down} 滚动',
} as const satisfies Readonly<Record<HelpCopyKey, string>>;
