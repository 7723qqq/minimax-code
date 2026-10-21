import type { GoalCopyKey } from './copy.en.js';

/**
 * Simplified Chinese copy for the Goal banner.
 *
 * The `satisfies` clause is the completeness check: a key present in the
 * English catalog but absent here fails `pnpm typecheck`.
 */
export const ZH_HANS_GOAL_COPY = {
  'goal.header.attachment': ' · 附件',
  'goal.header.activeElapsed': ' · {elapsed} 活跃{attachment}',
  'goal.header.elapsed': ' · {elapsed}',
  'goal.line.objectiveActions': '{objective} · {actions}',
  'goal.receipt.complete': '✓ Goal 已完成',
  'goal.count.tokens': '{n} tokens',
  'goal.count.turns': '{n} 个 turn',
  'goal.summary.title': 'Goal · {label}',
  'goal.summary.objective': '目标：{objective}',
  'goal.objective.untitled': '未命名目标',
  'goal.summary.timeUsed': '已用时间：{elapsed}',
  'goal.summary.usage': '{tokens} tokens · {turns} 个 turn',
  'goal.action.active': '/goal pause · /goal edit · /goal clear',
  'goal.action.complete': '/goal <objective> 开启新 Goal · /goal clear 移除当前 Goal',
  'goal.action.budgetLimited': '/goal clear，然后 /goal <objective> 开启新 Goal',
  'goal.action.resume': '/goal resume · /goal edit · /goal clear',
  'goal.status.active': '进行中',
  'goal.status.paused': '已暂停',
  'goal.status.blocked': '已阻塞',
  'goal.status.complete': '已完成',
  'goal.status.budgetLimited': '预算受限',
  'goal.status.usageLimited': '用量受限',
  'goal.wait.questionnaire': '等待你的回答',
  'goal.wait.permission': '等待授权',
  'goal.wait.plan': '等待 Plan 完成',
  'goal.wait.requiredBackground': '等待后台任务',
  'goal.wait.automationOwnerConflict': '等待自动化流程',
  'goal.wait.dependencyUnavailable': '等待依赖就绪',
  'goal.wait.verification': '正在验证结果',
  'goal.wait.unknown': '等待需求确认',
  'goal.policy.resumeAfterProvider': '服务商访问恢复后继续',
  'goal.verification.latest': '最近一次校验：{verdict}',
  'goal.verification.notMetStreak': '连续未达成 {n} 次',
  'goal.verification.missing': '缺失：{list}{omitted}',
  'goal.verification.omitted': ' +{n}',
  'goal.verdict.met': '已达成',
  'goal.verdict.notMet': '未达成',
  'goal.verdict.impossible': '无法达成',
  'goal.verdict.inconclusive': '无法判定',
} as const satisfies Readonly<Record<GoalCopyKey, string>>;
