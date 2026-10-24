import type { TuiRuntimeCopyKey } from './copy.en.js';

/**
 * Simplified Chinese copy for the TUI runtime layer.
 *
 * The `satisfies` clause is the completeness check: a key present in the
 * English catalog but absent here fails `pnpm typecheck`.
 */
export const ZH_HANS_TUI_RUNTIME_COPY = {
  'runtime.preview.binaryOmitted': '二进制内容无法安全预览。',
  'runtime.preview.tooLarge': '文件大小为 {size}，已省略预览。',
  'runtime.browser.restoredTabRecovery':
    '请先确认已恢复的标签页，再继续操作，以确保当前页面状态明确。',
  'runtime.browser.relatedPageMissing': '点击后没有打开预期的关联 Browser 页面。',
  'runtime.browser.relatedPageRecovery': '请先确认当前页面，再决定是否重试。',
  'runtime.browser.tabLimit':
    'Headless Browser 每个 Session 最多保留 {n} 个历史标签页，关联弹窗已被关闭',
} as const satisfies Readonly<Record<TuiRuntimeCopyKey, string>>;
