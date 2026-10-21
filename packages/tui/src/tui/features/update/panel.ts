import { Key, matchesKey } from '../../engine/public.js';
import { sanitizeTerminalText } from '../../rendering/terminal-text.js';
import type { Component, Focusable } from '../../rendering/component.js';
import { stripAnsi, truncateToWidth, wrapTextWithAnsi } from '../../rendering/text.js';
import {
  renderTuiActionHint,
  tuiChalk as chalk,
  tuiColors as colors,
} from '../../theme/runtime.js';
import {
  decisionContentWidth,
  renderDecisionFrame,
  renderDecisionHeading,
} from '../interaction/decision-frame.js';
import type {
  McodeUpdateApplyOptions,
  McodeUpdateOutcome,
  McodeUpdatePlan,
} from '../../../update/application.js';
import {
  isMcodeUpdateAdmissionError,
  isMcodeUpdateCancelledError,
  type McodeUpdatePhase,
} from '../../../update/progress.js';
import { redactTuiCredentials } from '../../transcript/export.js';
import { presentTuiFailure } from '../../../user-facing-failure.js';
import { updateText } from './copy.js';

const UPDATE_ANIMATION_INTERVAL_MS = 80;
const UPDATE_SPINNER_FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'] as const;
const UPDATE_RECENT_OUTPUT_LINES = 4;

type ActionableMcodeUpdatePlan = Extract<
  McodeUpdatePlan,
  { kind: 'available' | 'package-manager' }
>;

type McodeUpdatePanelState =
  | { status: 'review' }
  | {
      status: 'applying';
      startedAtMs: number;
      phase: McodeUpdatePhase;
      cancellable: boolean;
      cancelRequested: boolean;
    }
  | { status: 'paused'; reason: string }
  | { status: 'cancelled' }
  | { status: 'failed'; message: string; diagnostic?: string }
  | { status: 'succeeded'; outcome: McodeUpdateOutcome };

export interface TuiUpdatePanelOptions {
  readonly plan: ActionableMcodeUpdatePlan;
  readonly maxRows: number | (() => number);
  readonly apply: (
    plan: ActionableMcodeUpdatePlan,
    options?: McodeUpdateApplyOptions,
  ) => Promise<McodeUpdateOutcome>;
  readonly requestRender: () => void;
  readonly onClose: () => void;
  readonly onRestart: () => Promise<void>;
  readonly onApplyConfirmed?: () => void;
  readonly now?: () => number;
}

export class TuiUpdatePanel implements Component, Focusable {
  private state: McodeUpdatePanelState = { status: 'review' };
  private selectedAction = 0;
  private detailsExpanded = false;
  private frameIndex = 0;
  private recentOutput: string[] = [];
  private animationTimer: ReturnType<typeof setInterval> | undefined;
  private restarting = false;
  private disposed = false;
  private applyController: AbortController | undefined;
  focused = false;

  constructor(private readonly options: TuiUpdatePanelOptions) {}

  handleInput(data: string): void {
    if (this.state.status === 'applying' || this.restarting) {
      if (matchesKey(data, 'd')) this.toggleDetails();
      if (
        this.state.status === 'applying' &&
        this.state.cancellable &&
        !this.state.cancelRequested &&
        (matchesKey(data, Key.escape) || matchesKey(data, Key.ctrl('c')))
      ) {
        this.applyController?.abort();
        this.setState({ ...this.state, cancelRequested: true });
      }
      return;
    }
    if (matchesKey(data, Key.escape) || matchesKey(data, Key.ctrl('c'))) {
      this.options.onClose();
      return;
    }
    if (matchesKey(data, 'd')) {
      this.toggleDetails();
      return;
    }
    if (this.state.status === 'review') {
      if (matchesKey(data, Key.up) || matchesKey(data, Key.down)) {
        this.selectedAction = this.selectedAction === 0 ? 1 : 0;
        this.options.requestRender();
        return;
      }
      if (matchesKey(data, Key.enter)) {
        if (this.selectedAction === 0) {
          if (this.options.onApplyConfirmed) this.options.onApplyConfirmed();
          else void this.apply();
        } else this.options.onClose();
      }
      return;
    }
    if (
      (this.state.status === 'failed' ||
        this.state.status === 'paused' ||
        this.state.status === 'cancelled') &&
      matchesKey(data, Key.enter)
    ) {
      void this.apply();
      return;
    }
    if (this.state.status === 'succeeded' && matchesKey(data, Key.enter)) {
      void this.restart();
    }
  }

  invalidate(): void {}

  render(width: number): string[] {
    const contentWidth = decisionContentWidth(width);
    if (contentWidth === 0) return renderDecisionFrame([''], width, this.tone());
    const lines =
      this.state.status === 'review'
        ? this.renderReview(contentWidth)
        : this.state.status === 'applying'
          ? this.renderApplying(contentWidth)
          : this.state.status === 'paused'
            ? this.renderPaused(contentWidth)
            : this.state.status === 'cancelled'
              ? this.renderCancelled(contentWidth)
              : this.state.status === 'failed'
                ? this.renderFailure(contentWidth)
                : this.renderSuccess(contentWidth);
    return renderDecisionFrame(limitRows(lines, this.options.maxRows), width, this.tone());
  }

  dispose(): void {
    this.disposed = true;
    if (this.state.status === 'applying' && this.state.cancellable) {
      this.applyController?.abort();
    }
    this.stopAnimation();
  }

  private async apply(): Promise<void> {
    this.recentOutput = [];
    this.frameIndex = 0;
    const controller = new AbortController();
    this.applyController = controller;
    this.setState({
      status: 'applying',
      startedAtMs: this.now(),
      phase: this.options.plan.kind === 'package-manager' ? 'installing' : 'checking',
      cancellable: this.options.plan.kind !== 'package-manager',
      cancelRequested: false,
    });
    try {
      const outcome = await this.options.apply(this.options.plan, {
        onOutput: (chunk) => this.acceptOutput(chunk),
        signal: controller.signal,
        onPhase: (event) => this.acceptPhase(event.phase, event.cancellable),
      });
      if (this.disposed) return;
      this.setState({ status: 'succeeded', outcome });
    } catch (error) {
      if (this.disposed) return;
      if (isMcodeUpdateCancelledError(error)) this.setState({ status: 'cancelled' });
      else if (isMcodeUpdateAdmissionError(error)) {
        this.setState({ status: 'paused', reason: sanitizeTerminalText(error.message) });
      } else {
        const presentation = presentTuiFailure(error, {
          summary: updateText('update.error.installFailed'),
          nextStep: updateText('update.error.installNextStep'),
          preservation: updateText('update.error.installPreserved'),
        });
        this.detailsExpanded = false;
        this.setState({
          status: 'failed',
          message: presentation.message,
          ...(presentation.diagnostic ? { diagnostic: presentation.diagnostic } : {}),
        });
      }
    } finally {
      if (this.applyController === controller) this.applyController = undefined;
    }
  }

  private async restart(): Promise<void> {
    if (this.restarting) return;
    this.restarting = true;
    this.options.requestRender();
    try {
      await this.options.onRestart();
    } catch (error) {
      if (this.disposed) return;
      this.restarting = false;
      const presentation = presentTuiFailure(error, {
        summary: updateText('update.error.restartFailed'),
        nextStep: updateText('update.error.restartNextStep'),
        preservation: updateText('update.error.restartPreserved'),
      });
      this.detailsExpanded = false;
      this.setState({
        status: 'failed',
        message: presentation.message,
        ...(presentation.diagnostic ? { diagnostic: presentation.diagnostic } : {}),
      });
    }
  }

  private renderReview(width: number): string[] {
    const { currentVersion, latestVersion } = this.options.plan;
    return [
      renderDecisionHeading(
        updateText('update.review.title'),
        sourceLabel(this.options.plan),
        width,
        'signal',
      ),
      chalk.bold.hex(colors.text)(fit(`${currentVersion} → ${latestVersion}`, width)),
      '',
      renderAction(updateText('update.review.updateNow'), this.selectedAction === 0, width),
      renderAction(updateText('update.review.notNow'), this.selectedAction === 1, width),
      ...this.renderDetails(width),
      '',
      renderTuiActionHint(fit(updateText('update.review.hint'), width)),
    ];
  }

  private renderApplying(width: number): string[] {
    const frame = UPDATE_SPINNER_FRAMES[this.frameIndex] ?? UPDATE_SPINNER_FRAMES[0];
    const elapsedSeconds = Math.max(0, Math.floor((this.now() - this.stateStartedAtMs()) / 1000));
    const output = this.detailsExpanded
      ? this.recentOutput
      : this.recentOutput.slice(-Math.min(2, this.recentOutput.length));
    return [
      renderDecisionHeading(
        updateText('update.applying.title', { frame }),
        elapsedSeconds > 0 ? `${elapsedSeconds}s` : undefined,
        width,
        'signal',
      ),
      chalk.hex(colors.muted)(
        fit(
          updateText('update.applying.progress', {
            phase: phaseLabel(this.state.status === 'applying' ? this.state.phase : 'installing'),
            version: this.options.plan.latestVersion,
            source: sourceLabel(this.options.plan),
          }),
          width,
        ),
      ),
      ...(output.length > 0
        ? [
            '',
            chalk.hex(colors.dim)(updateText('update.applying.latestOutput')),
            ...output.flatMap((line) => renderWrapped(line, width, colors.muted)),
          ]
        : []),
      ...this.renderDetails(width),
      '',
      renderTuiActionHint(
        fit(
          this.state.status === 'applying' && this.state.cancellable
            ? this.state.cancelRequested
              ? updateText('update.applying.cancelling')
              : updateText('update.applying.cancelHint')
            : updateText('update.applying.finishing'),
          width,
        ),
      ),
    ];
  }

  private renderPaused(width: number): string[] {
    const reason = this.state.status === 'paused' ? this.state.reason : 'MCode is busy.';
    return [
      renderDecisionHeading(
        updateText('update.paused.title'),
        sourceLabel(this.options.plan),
        width,
        'signal',
      ),
      ...renderWrapped(reason, width, colors.warning),
      '',
      chalk.bold.hex(colors.signal)(updateText('update.paused.checkAgain')),
      renderTuiActionHint(fit(updateText('update.hint.retryClose'), width)),
    ];
  }

  private renderCancelled(width: number): string[] {
    return [
      renderDecisionHeading(
        updateText('update.cancelled.title'),
        sourceLabel(this.options.plan),
        width,
        'success',
      ),
      ...renderWrapped(updateText('update.cancelled.previousActive'), width, colors.muted),
      '',
      chalk.bold.hex(colors.signal)(updateText('update.cancelled.tryAgain')),
      renderTuiActionHint(fit(updateText('update.hint.retryClose'), width)),
    ];
  }

  private renderFailure(width: number): string[] {
    const message =
      this.state.status === 'failed'
        ? this.state.message
        : updateText('update.error.installFailed');
    const diagnostic =
      this.state.status === 'failed' && this.state.diagnostic
        ? redactTuiCredentials(sanitizeTerminalText(this.state.diagnostic))
        : undefined;
    return [
      renderDecisionHeading(
        updateText('update.failed.title'),
        sourceLabel(this.options.plan),
        width,
        'error',
      ),
      ...renderWrapped(message, width, colors.error),
      ...(diagnostic ? renderWrapped(diagnostic, width, colors.muted) : []),
      ...this.renderDetails(width),
      '',
      chalk.bold.hex(colors.signal)(updateText('update.failed.retry')),
      renderTuiActionHint(fit(updateText('update.failed.hint'), width)),
    ];
  }

  private renderSuccess(width: number): string[] {
    const outcome = this.state.status === 'succeeded' ? this.state.outcome : undefined;
    return [
      renderDecisionHeading(
        updateText('update.success.title', { version: this.options.plan.latestVersion }),
        undefined,
        width,
        'success',
      ),
      ...(outcome ? renderWrapped(outcome.message, width, colors.muted) : []),
      '',
      chalk.bold.hex(colors.signal)(
        this.restarting
          ? updateText('update.success.restarting')
          : updateText('update.success.restartNow'),
      ),
      renderTuiActionHint(fit(updateText('update.success.hint'), width)),
    ];
  }

  private renderDetails(width: number): string[] {
    if (!this.detailsExpanded) return [];
    const command =
      this.options.plan.kind === 'package-manager'
        ? this.options.plan.command.display
        : updateText('update.details.pipeline');
    return [
      '',
      chalk.hex(colors.dim)(updateText('update.details.title')),
      ...renderWrapped(command, width, colors.muted),
    ];
  }

  private acceptOutput(chunk: string): void {
    if (this.disposed) return;
    const lines = stripAnsi(chunk)
      .split(/[\r\n]+/u)
      .map((line) => redactTuiCredentials(sanitizeTerminalText(line.trim())))
      .filter(Boolean);
    if (lines.length === 0) return;
    this.recentOutput = [...this.recentOutput, ...lines].slice(-UPDATE_RECENT_OUTPUT_LINES);
    this.options.requestRender();
  }

  private acceptPhase(phase: McodeUpdatePhase, cancellable: boolean): void {
    if (this.disposed || this.state.status !== 'applying') return;
    this.setState({ ...this.state, phase, cancellable });
  }

  private setState(state: McodeUpdatePanelState): void {
    this.state = state;
    if (state.status === 'applying') this.startAnimation();
    else this.stopAnimation();
    this.options.requestRender();
  }

  private startAnimation(): void {
    if (this.animationTimer) return;
    this.animationTimer = setInterval(() => {
      this.frameIndex = (this.frameIndex + 1) % UPDATE_SPINNER_FRAMES.length;
      this.options.requestRender();
    }, UPDATE_ANIMATION_INTERVAL_MS);
    this.animationTimer.unref?.();
  }

  private stopAnimation(): void {
    if (!this.animationTimer) return;
    clearInterval(this.animationTimer);
    this.animationTimer = undefined;
  }

  private toggleDetails(): void {
    this.detailsExpanded = !this.detailsExpanded;
    this.options.requestRender();
  }

  private tone(): 'signal' | 'error' | 'success' {
    if (this.state.status === 'failed') return 'error';
    if (this.state.status === 'succeeded' || this.state.status === 'cancelled') return 'success';
    return 'signal';
  }

  private stateStartedAtMs(): number {
    return this.state.status === 'applying' ? this.state.startedAtMs : this.now();
  }

  private now(): number {
    return this.options.now?.() ?? Date.now();
  }
}

function phaseLabel(phase: McodeUpdatePhase): string {
  if (phase === 'checking') return updateText('update.phase.checking');
  if (phase === 'downloading') return updateText('update.phase.downloading');
  if (phase === 'staging') return updateText('update.phase.staging');
  if (phase === 'validating') return updateText('update.phase.validating');
  if (phase === 'activating') return updateText('update.phase.activating');
  if (phase === 'completed') return updateText('update.phase.completed');
  return updateText('update.phase.installing');
}

function sourceLabel(plan: ActionableMcodeUpdatePlan): string {
  return plan.source === 'managed-installer'
    ? updateText('update.source.officialInstaller')
    : plan.source.replace('-global', '');
}

function renderAction(label: string, selected: boolean, width: number): string {
  const value = `${selected ? '›' : ' '} ${label}`;
  return selected
    ? chalk.bold.hex(colors.signal)(fit(value, width))
    : chalk.hex(colors.muted)(fit(value, width));
}

function renderWrapped(value: string, width: number, color: string): string[] {
  return wrapTextWithAnsi(chalk.hex(color)(value), Math.max(1, width)).map((line) =>
    fit(line, width),
  );
}

function fit(value: string, width: number): string {
  return truncateToWidth(value, Math.max(0, width), '…');
}

function limitRows(
  lines: readonly string[],
  maxRowsOption: number | (() => number),
): readonly string[] {
  const maxRows = Math.max(
    4,
    Math.floor(typeof maxRowsOption === 'function' ? maxRowsOption() : maxRowsOption),
  );
  if (lines.length <= maxRows) return lines;
  return [...lines.slice(0, maxRows - 2), chalk.hex(colors.dim)('…'), lines.at(-1) ?? ''];
}
