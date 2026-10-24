/**
 * Goal banner copy.
 *
 * The English catalog is the only source of truth for the key shape; the
 * zh-Hans catalog is typed against it, so a missing translation is a compile
 * error rather than an `undefined` on screen.
 *
 * The `/goal` command names stay in English in both catalogs: they are
 * commands the user types, not prose. The wait labels keep the same full-key
 * coverage as the shared wait-reason enum, so a new reason breaks the build
 * instead of silently falling back to the status label.
 */
/**
 * English copy for the Goal banner.
 *
 * The English object is the only source of truth for key shape: the zh-Hans
 * catalog is typed against it, so a missing translation is a compile error
 * rather than a blank line in the interface.
 */
export const EN_GOAL_COPY = {
  'goal.header.attachment': ' · Attachment',
  'goal.header.activeElapsed': ' · {elapsed} active{attachment}',
  'goal.header.elapsed': ' · {elapsed}',
  'goal.line.objectiveActions': '{objective} · {actions}',
  'goal.receipt.complete': '✓ Goal complete',
  'goal.count.tokens': '{n} tokens',
  'goal.count.turns': '{n} turns',
  'goal.summary.title': 'Goal · {label}',
  'goal.summary.objective': 'Objective: {objective}',
  'goal.objective.untitled': 'Untitled Goal',
  'goal.summary.timeUsed': 'Time used: {elapsed}',
  'goal.summary.usage': '{tokens} tokens · {turns} turns',
  'goal.action.active': '/goal pause · /goal edit · /goal clear',
  'goal.action.complete': '/goal <objective> starts a new Goal · /goal clear removes this Goal',
  'goal.action.budgetLimited': '/goal clear, then /goal <objective> starts a new Goal',
  'goal.action.resume': '/goal resume · /goal edit · /goal clear',
  'goal.status.active': 'Active',
  'goal.status.paused': 'Paused',
  'goal.status.blocked': 'Blocked',
  'goal.status.complete': 'Complete',
  'goal.status.budgetLimited': 'Budget limited',
  'goal.status.usageLimited': 'Usage limited',
  'goal.wait.questionnaire': 'Waiting for your answer',
  'goal.wait.permission': 'Waiting for permission',
  'goal.wait.plan': 'Waiting for Plan to finish',
  'goal.wait.requiredBackground': 'Waiting for background tasks',
  'goal.wait.automationOwnerConflict': 'Waiting for automation',
  'goal.wait.dependencyUnavailable': 'Waiting for a dependency',
  'goal.wait.verification': 'Verifying the result',
  'goal.wait.unknown': 'Waiting for requirements',
  'goal.policy.resumeAfterProvider': 'Resume after provider access recovers',
  'goal.verification.latest': 'Latest verifier: {verdict}',
  'goal.verification.notMetStreak': 'not-met streak {n}',
  'goal.verification.missing': 'missing: {list}{omitted}',
  'goal.verification.omitted': ' +{n}',
  'goal.verdict.met': 'Met',
  'goal.verdict.notMet': 'Not met',
  'goal.verdict.impossible': 'Impossible',
  'goal.verdict.inconclusive': 'Inconclusive',
} as const;

/** Every key the Goal banner catalog defines. */
export type GoalCopyKey = keyof typeof EN_GOAL_COPY;
