import type { PluginCopyKey } from './copy.en.js';

/**
 * Simplified Chinese copy for the plugin manager.
 *
 * The `satisfies` clause is the completeness check: a key present in the
 * English catalog but absent here fails `pnpm typecheck`.
 */
export const ZH_HANS_PLUGIN_COPY = {
  browsePlugins: '浏览 MiniMax 官方与本地插件 · 已安装 {installed} 个，共 {total} 个',
  noMatchingPlugins: '没有匹配的插件',
  footerActions: 'Enter 安装 · Space 启用/禁用 · Delete 移除 · Ctrl+R 刷新',
  authRequiredNextStep: '请先运行 /login，然后重试。',
  detailsNextStep: '重试，或运行 mcode plugin 查看详情。',
  refreshingCatalogs: '正在刷新插件目录…',
  catalogsRefreshed: '插件目录已刷新。',
  upgradeNextStep: '重试，或运行 mcode plugin marketplace upgrade。',
} as const satisfies Readonly<Record<PluginCopyKey, string>>;
