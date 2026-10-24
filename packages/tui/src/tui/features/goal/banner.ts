import type { ChalkInstance } from 'chalk';
import type { GlobalThreadGoal } from '@mavis/shared/global-events';
import { formatTuiDuration } from '../../rendering/duration.js';
import type { Component } from '../../rendering/component.js';
import { sanitizeTerminalText } from '../../rendering/terminal-text.js';
import { truncateToWidth, visibleWidth } from '../../rendering/text.js';
import { tuiChalk, tuiColors as colors } from '../../theme/runtime.js';
import { goalText, type GoalCopyKey } from './copy.js';

export interface TuiGoalBannerOptions {
  readonly animate?: boolean;
  readonly now?: () => number;
  readonly requestRender?: () => void;
  readonly chalk?: ChalkInstance;
}

const TICK_INTERVAL_MS = 1_000;

export class TuiGoalBanner implements Component {
  private goal: GlobalThreadGoal | undefined;
  private baselineSeconds = 0;
  private baselineAtMs = 0;
  private timer: ReturnType<typeof setInterval> | undefined;
  private animationPaused = false;
  private readonly animate: boolean;
  private readonly now: () => number;
  private readonly requestRender: () => void;
  private readonly chalk: ChalkInstance;

  constructor(options: TuiGoalBannerOptions = {}) {
    this.animate = options.animate ?? true;
    this.now = options.now ?? Date.now;
    this.requestRender = options.requestRender ?? (() => undefined);
    this.chalk = options.chalk ?? tuiChalk;
  }

  setGoal(goal: GlobalThreadGoal | undefined): void {
    const now = this.now();
    const continuesActiveGoal =
      goal !== undefined &&
      this.goal !== undefined &&
      goal.goalId === this.goal.goalId &&
      goal.status === 'active' &&
      this.goal.status === 'active';
    const currentSeconds = continuesActiveGoal ? this.elapsedSeconds(now) : 0;

    this.goal = goal;
    this.baselineSeconds = goal
      ? Math.max(goal.timeUsedSeconds, continuesActiveGoal ? currentSeconds : 0)
      : 0;
    this.baselineAtMs = now;
    if (goal?.status === 'active' && this.animate && !this.animationPaused) this.startTimer();
    else this.stopTimer();
    this.requestRender();
  }

  setAnimationPaused(paused: boolean): void {
    if (this.animationPaused === paused) return;
    this.animationPaused = paused;
    if (paused) {
      this.stopTimer();
      return;
    }
    if (this.animate && this.goal?.status === 'active') this.startTimer();
  }

  getGoal(): GlobalThreadGoal | undefined {
    return this.goal;
  }

  invalidate(): void {}

  render(rawWidth: number): string[] {
    const width = normalizeWidth(rawWidth);
    const goal = this.goal;
    if (!goal || goal.status === 'complete' || width === 0) return [];

    const presentation = goalPresentation(goal);
    const elapsed = formatGoalElapsed(this.elapsedSeconds(this.now()));
    const attachment = goal.hasKickoffAttachments ? goalText('goal.header.attachment') : '';
    let header =
      this.chalk.hex(colors.dim)('  ') +
      this.chalk.bold.hex(presentation.color)('◎ Goal') +
      this.chalk.hex(colors.dim)(' · ') +
      this.chalk.bold.hex(presentation.color)(presentation.label) +
      this.chalk.hex(colors.muted)(
        goalText('goal.header.activeElapsed', { elapsed, attachment }),
      );
    if (visibleWidth(header) > width) {
      header =
        this.chalk.bold.hex(presentation.color)('◎ Goal') +
        this.chalk.hex(colors.dim)(' · ') +
        this.chalk.bold.hex(presentation.color)(presentation.label) +
        this.chalk.hex(colors.muted)(goalText('goal.header.elapsed', { elapsed }));
    }
    const policy = goalPolicySummary(goal);
    const verification = latestVerificationSummary(goal.lastVerification);
    const objective = oneLine(goal.objective) || goalText('goal.objective.untitled');
    const actions = actionHint(goal.status);
    const lines = [fit(header, width, this.chalk), fit(policy, width, this.chalk)];
    if (verification) lines.push(fit(verification, width, this.chalk));

    const objectiveLine = goalText('goal.line.objectiveActions', { objective, actions });
    if (visibleWidth(objectiveLine) <= width) {
      lines.push(fit(objectiveLine, width, this.chalk));
      return lines;
    }
    lines.push(fit(objective, width, this.chalk), fit(actions, width, this.chalk));
    return lines;
  }

  dispose(): void {
    this.stopTimer();
  }

  private elapsedSeconds(now: number): number {
    if (this.goal?.status !== 'active') return Math.max(0, Math.floor(this.baselineSeconds));
    const liveSeconds = Math.max(0, Math.floor((now - this.baselineAtMs) / 1_000));
    return Math.max(0, Math.floor(this.baselineSeconds + liveSeconds));
  }

  private startTimer(): void {
    if (this.timer) return;
    this.timer = setInterval(this.requestRender, TICK_INTERVAL_MS);
    this.timer.unref();
  }

  private stopTimer(): void {
    if (!this.timer) return;
    clearInterval(this.timer);
    this.timer = undefined;
  }
}

export function formatGoalElapsed(rawSeconds: number): string {
  return formatTuiDuration(rawSeconds);
}

export function formatGoalCompletionReceipt(goal: GlobalThreadGoal): string {
  return [
    goalText('goal.receipt.complete'),
    formatGoalElapsed(goal.timeUsedSeconds),
    goalText('goal.count.tokens', { n: formatGoalCount(goal.tokensUsed) }),
    goalText('goal.count.turns', { n: formatGoalCount(goal.turnsUsed) }),
  ].join(' · ');
}

export function formatGoalSummary(goal: GlobalThreadGoal): string {
  const lines = [
    goalText('goal.summary.title', { label: goalPresentation(goal).label }),
    goalText('goal.summary.objective', {
      objective: oneLine(goal.objective) || goalText('goal.objective.untitled'),
    }),
    goalText('goal.summary.timeUsed', { elapsed: formatGoalElapsed(goal.timeUsedSeconds) }),
    goalText('goal.summary.usage', {
      tokens: formatGoalCount(goal.tokensUsed),
      turns: formatGoalCount(goal.turnsUsed),
    }),
  ];
  const verification = latestVerificationSummary(goal.lastVerification);
  if (verification) lines.push(verification);
  lines.push(actionHint(goal.status));
  return lines.join('\n');
}

function actionHint(status: GlobalThreadGoal['status']): string {
  if (status === 'active') return goalText('goal.action.active');
  if (status === 'complete') {
    return goalText('goal.action.complete');
  }
  if (status === 'budget_limited') {
    return goalText('goal.action.budgetLimited');
  }
  return goalText('goal.action.resume');
}

function statusPresentation(status: GlobalThreadGoal['status']): {
  readonly label: string;
  readonly color: string;
} {
  if (status === 'active') return { label: goalText('goal.status.active'), color: colors.orbit };
  if (status === 'paused') return { label: goalText('goal.status.paused'), color: colors.warning };
  if (status === 'blocked') return { label: goalText('goal.status.blocked'), color: colors.error };
  if (status === 'complete') {
    return { label: goalText('goal.status.complete'), color: colors.success };
  }
  if (status === 'budget_limited') {
    return { label: goalText('goal.status.budgetLimited'), color: colors.warning };
  }
  return { label: goalText('goal.status.usageLimited'), color: colors.warning };
}

/**
 * An `active` Goal that is parked reads as its wait, not as "Active".
 *
 * This mirrors the Desktop banner rule exactly: the wait replaces the status
 * *label* while the status keeps its own colour, because a wait is an execution
 * detail inside `active` rather than a different lifecycle state. Waits are
 * only meaningful while `active`; the runtime already forces them to null
 * elsewhere, and the status check here keeps that true even for a client fed a
 * stale projection.
 */
function goalPresentation(goal: GlobalThreadGoal): {
  readonly label: string;
  readonly color: string;
} {
  const presentation = statusPresentation(goal.status);
  const wait = goal.status === 'active' ? goal.executionWait : undefined;
  return wait ? { ...presentation, label: goalText(WAIT_LABELS[wait.reason]) } : presentation;
}

/**
 * Full-key map, deliberately not a partial lookup with a fallback: adding a
 * wait reason to the shared enum must fail this compile rather than silently
 * degrade the TUI to showing "Active" for a Goal that is in fact parked.
 * The map holds catalog keys, so the coverage check still fails the build and
 * the wording stays localizable. Wording tracks the Desktop `goal.banner.wait.*`
 * strings.
 */
const WAIT_LABELS: Record<
  NonNullable<GlobalThreadGoal['executionWait']>['reason'],
  GoalCopyKey
> = {
  questionnaire: 'goal.wait.questionnaire',
  permission: 'goal.wait.permission',
  plan: 'goal.wait.plan',
  required_background: 'goal.wait.requiredBackground',
  automation_owner_conflict: 'goal.wait.automationOwnerConflict',
  dependency_unavailable: 'goal.wait.dependencyUnavailable',
  verification: 'goal.wait.verification',
  unknown: 'goal.wait.unknown',
};

function goalPolicySummary(goal: GlobalThreadGoal): string {
  const items = [
    goalText('goal.count.tokens', { n: formatGoalCount(goal.tokensUsed) }),
    goalText('goal.count.turns', { n: formatGoalCount(goal.turnsUsed) }),
  ];
  if (goal.status === 'usage_limited') {
    items.push(goalText('goal.policy.resumeAfterProvider'));
  }
  return items.join(' · ');
}

function latestVerificationSummary(
  verification: GlobalThreadGoal['lastVerification'],
): string | undefined {
  if (!verification) return undefined;
  const items = [
    goalText('goal.verification.latest', { verdict: verdictPresentation(verification.verdict) }),
  ];
  if (verification.verdict === 'not_met') {
    items.push(
      goalText('goal.verification.notMetStreak', {
        n: Math.max(0, Math.floor(verification.notMetStreak)),
      }),
    );
    const missing = verification.missing.map(oneLine).filter(Boolean);
    if (missing.length > 0) {
      const visible = missing.slice(0, 2).join('; ');
      const omitted = Math.max(0, missing.length - 2);
      items.push(
        goalText('goal.verification.missing', {
          list: visible,
          omitted: omitted > 0 ? goalText('goal.verification.omitted', { n: omitted }) : '',
        }),
      );
    }
  }
  return items.join(' · ');
}

function verdictPresentation(
  verdict: NonNullable<GlobalThreadGoal['lastVerification']>['verdict'],
): string {
  if (verdict === 'met') return goalText('goal.verdict.met');
  if (verdict === 'not_met') return goalText('goal.verdict.notMet');
  if (verdict === 'impossible') return goalText('goal.verdict.impossible');
  return goalText('goal.verdict.inconclusive');
}

export function formatGoalCount(rawValue: number): string {
  const value = Math.max(0, Math.floor(rawValue));
  if (value < 1_000) return String(value);
  if (value < 1_000_000) return `${formatCompactCount(value / 1_000)}K`;
  return `${formatCompactCount(value / 1_000_000)}M`;
}

function formatCompactCount(value: number): string {
  return value >= 10 || Number.isInteger(value) ? String(Math.round(value)) : value.toFixed(1);
}

/**
 * Annotation evidence a Goal objective carries for verification and
 * continuation. The TUI has no annotation UI and shows the objective the user
 * wrote, so the block is dropped here. Tag names mirror the Composer's
 * chat-context contract; the TUI does not depend on the UI package.
 */
const OBJECTIVE_EVIDENCE_RE =
  /<(user-provided-context|mavis-chat-context|html-selection-context|deployed-website-context)\b[^>]*>[\s\S]*?<\/\1>/gu;

function oneLine(value: string): string {
  return sanitizeTerminalText(value.replace(OBJECTIVE_EVIDENCE_RE, ''))
    .replace(/\s+/gu, ' ')
    .trim();
}

function fit(value: string, width: number, chalk: ChalkInstance): string {
  return truncateToWidth(value, width, chalk.hex(colors.dim)('…'));
}

function normalizeWidth(width: number): number {
  return Number.isFinite(width) ? Math.max(0, Math.floor(width)) : 0;
}
