import type { TuiSession, TuiSessionForkOptions } from '../../runtime/port.js';
import type { TuiSessionViewState } from '../state/model.js';
import { tuiText } from '../copy.js';

/**
 * BTW side Sessions reuse the Runtime `peek` model that the desktop app
 * already ships.
 *
 * Runtime derives `sessionKind: 'peek'` from a `peek_` / `peek:` purpose
 * prefix on a branch child (see the Runtime Session repo normalization), and
 * every Session-list index predicate excludes `peek`. Keeping this prefix is
 * therefore what satisfies "a side Session never appears in /sessions or
 * /resume" without a schema change.
 *
 * The desktop one-shot Peek Panel keeps its own `peek_one_shot` purpose, so
 * the two flows stay independently addressable in Runtime.
 */
export const BTW_SIDE_SESSION_PURPOSE = 'peek_btw_session';

export const BTW_SIDE_SESSION_TITLE = 'BTW';

/** TUI interaction semantics apply only to its explicit BTW purpose. */
export function isSideSession(
  session: Pick<TuiSession, 'sessionKind' | 'purpose'> | undefined,
): boolean {
  // Desktop `peek_one_shot` and TUI `/btw` share Runtime's Peek substrate but
  // are different products. TUI navigation/status/exit semantics apply only
  // to the explicit BTW purpose, never to every SessionKind.peek record.
  return session?.purpose === BTW_SIDE_SESSION_PURPOSE;
}

export type BtwStartDecision =
  | { readonly kind: 'start'; readonly parentSessionId: string }
  | { readonly kind: 'reject'; readonly reason: string };

/**
 * No Session is open, so there is nothing to branch a side Session from.
 *
 * These constants resolve when the module loads. Call sites below use the
 * catalog directly so a live language switch is reflected immediately; the
 * constants stay exported for consumers that only need the default text.
 */
export const BTW_REJECT_NO_SESSION = tuiText('sideSession.reject.noSession');

/** Nesting is not supported: one active side Session per parent Session. */
export const BTW_REJECT_NESTED = tuiText('sideSession.reject.nested');

/**
 * Runtime has no committed boundary to snapshot yet. The requirement is
 * explicit that this must fail instead of creating a blank pseudo branch.
 */
export const BTW_REJECT_NO_BOUNDARY = tuiText('sideSession.reject.noBoundary');

/**
 * Decides whether `/btw` may open a side Session.
 *
 * The committed-boundary check reuses the fork option probe on purpose: fork
 * and BTW share one display-boundary definition in Runtime, so they cannot
 * drift apart.
 */
export function resolveBtwStartDecision(input: {
  readonly current: Pick<TuiSession, 'sessionId' | 'sessionKind' | 'purpose'> | undefined;
  readonly forkOptions: Pick<TuiSessionForkOptions, 'canFork'> | undefined;
}): BtwStartDecision {
  const { current, forkOptions } = input;
  if (!current?.sessionId) {
    return { kind: 'reject', reason: tuiText('sideSession.reject.noSession') };
  }
  if (isSideSession(current)) {
    return { kind: 'reject', reason: tuiText('sideSession.reject.nested') };
  }
  if (!forkOptions?.canFork) {
    return { kind: 'reject', reason: tuiText('sideSession.reject.noBoundary') };
  }
  return { kind: 'start', parentSessionId: current.sessionId };
}

/**
 * Parent-conversation condition mirrored into the side view, following
 * Codex's SideParentStatus: actionable states call the user back to the main
 * conversation, terminal states report how the main Turn ended, and a
 * still-running main Turn shows no extra status.
 */
export type TuiSideParentStatus =
  | 'needs-input'
  | 'needs-approval'
  | 'failed'
  | 'interrupted'
  | 'finished';

/** True while the mirrored parent Session has a live (starting/running) Turn. */
export function isSideParentRunning(parentView: TuiSessionViewState | undefined): boolean {
  const runs = [...(parentView?.execution.runs.values() ?? [])];
  return runs.some((run) => run.status === 'starting' || run.status === 'running');
}

/**
 * Resolves the mirrored parent status for the side view.
 *
 * Codex derives this from parent-thread notifications; the TUI polls the
 * multi-Session state kernel instead, so `seenParentRunning` (a caller-owned
 * latch set once a live parent Turn was observed) stands in for the
 * TurnStarted/TurnCompleted transition: a parent that was never seen running
 * reports no terminal status rather than a misleading "finished".
 */
export function resolveSideParentStatus(input: {
  readonly parentSession: Pick<TuiSession, 'status'> | undefined;
  readonly parentView: TuiSessionViewState | undefined;
  readonly seenParentRunning: boolean;
}): TuiSideParentStatus | undefined {
  const { parentSession, parentView, seenParentRunning } = input;
  if (parentView?.interactions.permission) return 'needs-approval';
  if (parentView?.interactions.questionnaire) return 'needs-input';
  const runs = [...(parentView?.execution.runs.values() ?? [])];
  if (runs.some((run) => run.status === 'blocked')) return 'needs-input';
  if (isSideParentRunning(parentView)) return undefined;
  if (!seenParentRunning) return undefined;
  if (parentSession?.status === 'error') return 'failed';
  if (parentSession?.status === 'aborted' || parentSession?.status === 'interrupted') {
    return 'interrupted';
  }
  return 'finished';
}

export interface TuiSideConversationPresentation {
  readonly view: 'side' | 'parent';
  readonly parentStatus?: TuiSideParentStatus;
}

/**
 * Formats the Composer context label for a paired side conversation,
 * mirroring Codex's footer copy on both halves of the pair.
 *
 * `switchShortcutLabel` names the toggle chord as the user's terminal can
 * actually produce it (see `formatTuiShortcut`); Terminal.app users press
 * Ctrl+- for the same 0x1F byte that Ctrl+/ sends elsewhere.
 */
export function formatSideConversationLabel(
  input: TuiSideConversationPresentation,
  switchShortcutLabel = 'Ctrl+/',
  closeShortcutLabel = 'Ctrl+C',
): string {
  if (input.view === 'parent') {
    return tuiText('sideSession.label.forSide', { shortcut: switchShortcutLabel });
  }
  const parts = [tuiText('sideSession.label.fromMain')];
  if (input.parentStatus) parts.push(sideParentStatusLabel(input.parentStatus));
  parts.push(
    tuiText('sideSession.label.toMain', { shortcut: switchShortcutLabel }),
    tuiText('sideSession.label.toClose', { shortcut: closeShortcutLabel }),
  );
  return parts.join(' · ');
}

function sideParentStatusLabel(status: TuiSideParentStatus): string {
  switch (status) {
    case 'needs-input':
      return tuiText('sideSession.parent.needsInput');
    case 'needs-approval':
      return tuiText('sideSession.parent.needsApproval');
    case 'failed':
      return tuiText('sideSession.parent.failed');
    case 'interrupted':
      return tuiText('sideSession.parent.interrupted');
    case 'finished':
      return tuiText('sideSession.parent.finished');
  }
}
