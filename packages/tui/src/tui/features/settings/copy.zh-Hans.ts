import type { SettingsItemCopyKey } from './copy.en.js';

/**
 * Simplified Chinese copy for the settings pickers.
 *
 * `satisfies Readonly<Record<SettingsItemCopyKey, string>>` is the completeness
 * check: a key added to the English catalog and missing here fails
 * `pnpm typecheck`. Keyboard names (Enter, Esc, Backspace) stay in English,
 * because they name keys rather than prose.
 */
/**
 * Simplified Chinese copy for the hotkey and theme pickers.
 *
 * The `satisfies` clause is the completeness check: a key present in the
 * English catalog but absent here fails `pnpm typecheck`.
 */
export const ZH_HANS_SETTINGS_ITEM_COPY = {
  'hotkeys.title': '快捷键',
  'hotkeys.unbound': '未绑定',
  'hotkeys.footer.list': '↑↓ 选择 · Enter 修改 · r 重置 · Esc 关闭',
  'hotkeys.footer.editing': '按下按键 · Enter 保存 · Backspace 清除 · Esc 取消',
  'hotkeys.capture.pressCombination': '请按下组合键…',
  'hotkeys.capture.unbound': '未绑定 · 按 Enter 保存',
  'hotkeys.capture.captured': '已捕获：{key}',
  'hotkeys.status.saving': '正在保存…',
  'hotkeys.status.saved': '已保存 {id}。',
  'hotkeys.status.reset': '已将 {id} 重置为默认值。',
  'hotkeys.error.pressKeyFirst': '请先按下按键，或用 Backspace 清除。',
  'hotkeys.error.conflict': '冲突：{key} 已被 {ids} 使用。',
  'hotkeys.conflictSeparator': ' 和 ',

  'theme.title': '主题',
  'theme.empty': '没有可用的主题。',
  'theme.error.save': '无法保存主题选择。',
  'theme.meta.available': '共 {count} 个',
  'theme.appearance.label': '外观',
  'theme.appearance.auto': '自动（{appearance}）',
  'theme.appearance.lightPinned': '浅色（固定）',
  'theme.appearance.darkPinned': '深色（固定）',
  'theme.appearanceValue.light': '浅色',
  'theme.appearanceValue.dark': '深色',
  'theme.source.label': '来源',
  'theme.source.custom': '自定义文件',
  'theme.source.builtIn': '内置',
  'theme.about.label': '说明',
  'theme.palette.label': '配色',
  'theme.currentBadge': ' 当前 ',
  'theme.footer.saving': '正在保存…',
  'theme.footer.full': '↑↓ 主题 · ←→ 外观 · Enter 保存 · Esc 取消',
  'theme.footer.compact': '↑↓ ←→ · Enter · Esc',
} as const satisfies Readonly<Record<SettingsItemCopyKey, string>>;
