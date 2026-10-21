import { createCatalogSet, createCatalogText, resolveLocaleName } from '@mavis/shared/i18n';

import type { TuiStatusLineItem } from '../../shell/status-line-items.js';

const EN_STATUS_LINE_COPY = {
  title: 'Status Line',
  search: 'Search',
  preview: 'Preview',
  defaults: 'Defaults',
  unavailable: 'No current data; hidden until available.',
  empty: 'Status line hidden',
  noMatches: 'No matching items',
  saving: 'Saving…',
  failed: 'Could not save. Check config.yaml syntax and permissions; previous settings kept.',
  locked: 'build-mode is startup-only. Edit config.yaml and restart to change it.',
  help: 'Space toggle · ←/→ reorder · Enter save · Esc cancel',
  compactHelp: 'Space · ←→ · Enter · Esc',
  reset: 'Ctrl+R restores defaults; type to search',
  filtered: 'Clear search before reordering',
  custom: 'Uses the saved command. Starts only after saving; preview never runs it.',
  close: 'Enter / Esc close',
} as const;

const ZH_HANS_STATUS_LINE_COPY = {
  title: '状态栏',
  search: '搜索',
  preview: '预览',
  defaults: '默认配置',
  unavailable: '当前无数据，有数据时才显示。',
  empty: '状态栏已隐藏',
  noMatches: '没有匹配项',
  saving: '正在保存…',
  failed: '保存失败，请检查 config.yaml 语法和权限；原设置已保留。',
  locked: 'build-mode 仅在启动时生效，请修改 config.yaml 后重启。',
  help: 'Space 勾选 · ←/→ 排序 · Enter 保存 · Esc 取消',
  compactHelp: 'Space · ←→ · Enter · Esc',
  reset: 'Ctrl+R 恢复默认；输入文字搜索',
  filtered: '清空搜索后才能排序',
  custom: '使用已配置的命令，保存后才启动；预览不会执行命令。',
  close: 'Enter / Esc 关闭',
} as const satisfies Readonly<Record<keyof typeof EN_STATUS_LINE_COPY, string>>;

const EN_ITEM_DESCRIPTIONS = {
  'current-dir': 'Current working directory',
  'session-title': 'Current session title',
  'git-branch': 'Current Git branch',
  'review-link': 'Current branch PR / MR link',
  'plan-mode': 'Plan mode',
  'approval-mode': 'Current permission mode',
  'model-with-reasoning': 'Model and reasoning',
  model: 'Model name',
  'context-window': 'Context window capacity',
  subagent: 'Subagent identity',
  'token-quota': 'Account token quota',
  'cache-read-ratio': 'Session cache read ratio',
  'context-remaining': 'Remaining context window',
  'context-meter': 'Remaining context gauge',
  'custom-command': 'Configured custom command output',
} as const;

const ZH_HANS_ITEM_DESCRIPTIONS = {
  'current-dir': '当前工作目录',
  'session-title': '当前会话标题',
  'git-branch': '当前 Git 分支',
  'review-link': '当前分支的 PR / MR 链接',
  'plan-mode': '计划模式',
  'approval-mode': '当前权限模式',
  'model-with-reasoning': '模型和推理配置',
  model: '模型名称',
  'context-window': '上下文总容量',
  subagent: '子 Agent 身份',
  'token-quota': '账户额度',
  'cache-read-ratio': '会话缓存读取比例',
  'context-remaining': '剩余上下文窗口',
  'context-meter': '剩余上下文刻度条',
  'custom-command': '已配置的自定义命令输出',
} as const satisfies Readonly<Record<keyof typeof EN_ITEM_DESCRIPTIONS, string>>;

const STATUS_LINE_CATALOG = createCatalogSet(EN_STATUS_LINE_COPY, {
  'zh-Hans': ZH_HANS_STATUS_LINE_COPY,
});

const ITEM_DESCRIPTION_CATALOG = createCatalogSet(EN_ITEM_DESCRIPTIONS, {
  'zh-Hans': ZH_HANS_ITEM_DESCRIPTIONS,
});

const statusLineTextFor = createCatalogText(STATUS_LINE_CATALOG, resolveLocaleName);
const itemDescriptionFor = createCatalogText(ITEM_DESCRIPTION_CATALOG, resolveLocaleName);

/**
 * Status-line copy lookup.
 *
 * The catalog pair and the parallel `descriptions` tuple table used to live in
 * one file with a local `isChinese` helper; both are now ordinary catalog sets,
 * so a missing translation is a type error rather than an out-of-range tuple
 * index.
 */
export function statusLineText(key: keyof typeof EN_STATUS_LINE_COPY, locale?: string): string {
  return statusLineTextFor(key, locale);
}

/**
 * Describe one status-line item in the user's language.
 *
 * `item` is the configured item id; the description catalog is typed against
 * the item union, so a newly added item without a description is a compile
 * error rather than a missing sentence in the picker.
 */
export function statusLineItemDescription(
  item: Exclude<TuiStatusLineItem, 'build-mode'>,
  locale?: string,
): string {
  return itemDescriptionFor(item, locale);
}
