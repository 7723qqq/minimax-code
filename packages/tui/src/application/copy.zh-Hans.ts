import type { ApplicationCopyKey } from './copy.en.js';

/**
 * Simplified Chinese copy for the TUI application layer.
 *
 * The `satisfies` clause is the completeness check: a key present in the
 * English catalog but absent here fails `pnpm typecheck`.
 */
export const ZH_HANS_APPLICATION_COPY = {
  'application.run.noFinalResponse': 'Runtime 完成后没有最终的助手回复。',
  'application.login.required': '登录 MiniMax 后才能使用 Agent 功能。请运行 /login 后重试。',
  'application.login.requiredHeadless': '登录 MiniMax 后才能使用 Agent 功能。请运行 `mcode login` 后重试。',
  'application.run.automationPublishFailed': '无法发布 TUI 自动化结果。',
  'application.run.questionnaireRequiresInput': '问卷需要用户输入。',
  'application.run.contentReviewBlocked': '内容审查拦截了本次请求。',
  'app.turnFailed': 'Runtime turn 执行失败。',
  'application.content.interactiveLoading': '交互式内容正在加载…',
  'application.content.interactiveKindTitle': '交互式 {kind}：{title}（请在 Desktop 中打开）。',
  'application.content.interactiveTitle': '交互式内容：{title}（请在 Desktop 中打开）。',
  'application.content.interactiveAvailable': '交互式内容请在 Desktop 中查看。',
  'application.content.mcpAuthorizationRequired':
    '需要 MCP 授权：{reason}（请在 Desktop 中打开）。',
  'application.content.mcpAuthorizationRequiredWithoutReason':
    '需要 MCP 授权（请在 Desktop 中打开）。',
  'application.content.teamRecommendationAccepted': '已接受团队建议。',
  'application.content.teamRecommendationSkipped': '已跳过团队建议。',
  'application.content.teamRecommendationAvailable': '团队建议请在 Desktop 中查看。',
  'application.goal.badBudgetValue':
    'budget 取值无效：请使用正整数、K/M 后缀或 \'clear\'（收到 "{rawBudget}"）。',
  'application.goal.duplicateBudget': 'budget= 被指定了多次：请只保留一个 budget={value}。',
} as const satisfies Readonly<Record<ApplicationCopyKey, string>>;
