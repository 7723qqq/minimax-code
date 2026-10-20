import type { RuntimeTranslations } from './runtime-catalog.en.js';

/**
 * Simplified Chinese runtime catalog.
 *
 * `satisfies RuntimeTranslations` is the completeness check: a key present in
 * the English catalog but absent here fails `pnpm typecheck`. Only some of the
 * catalogs this module replaced carried that assertion, which is how gaps
 * reached production.
 */
export const ZH_HANS_RUNTIME_TRANSLATIONS = {
  'plan.entry.title': '进入计划模式',
  'plan.entry.question': '要为此任务进入计划模式吗？',
  'plan.entry.confirm.label': '确认',
  'plan.entry.confirm.description': '在实施前先进行调研并制定计划。',
  'plan.entry.decline.label': '拒绝',
  'plan.entry.decline.description': '继续执行，不进入计划模式。',
  'plan.implementation.display': '实施此计划',
  'questionnaire.noAnswer': '未回答',
  'questionnaire.others': '其他',
  'archiveTitle.prefix': '记忆归档：',
  'channel.accessControlDenied': '无权限，无法与该 Agent 对话。请联系 owner 开通权限。',
  'channel.accessControlGuide': '配置指南：{url}',
  'update.versionedInstalled':
    'MCode {version} 已安装。新启动的 MCode 会话将使用新版本，当前运行中的会话可以继续使用。',
} as const satisfies RuntimeTranslations;
