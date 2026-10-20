/**
 * Single classification of a turn message.
 *
 * A turn message carries two orthogonal facts: `role` (who produced it) and
 * `kind` (which runtime lifecycle frame it represents). Every consumer used to
 * re-derive "is this a model response" from `role === 'assistant'` alone, in
 * eight different forms across the TUI, ACP, headless and runtime packages.
 * That split responsibility produced defects that all share one shape: a
 * lifecycle frame was treated as a model response — advancing a response step,
 * wiping the selected answer, entering `agent_message` output, or ending a turn.
 *
 * These helpers are the only place the two facts are combined. Consumers must
 * ask them instead of comparing `role` or `kind` themselves.
 */

/**
 * Kinds that describe runtime lifecycle activity rather than model output.
 * They are persisted with `role: 'assistant'` because they share the message
 * store with responses, so `role` alone cannot separate them.
 */
export const TURN_LIFECYCLE_KINDS = [
  'compaction_start',
  'compaction',
  'compaction_failed',
  'review_start',
  'review_result',
  'review_failed',
  'review_aborted',
  'review_interrupted',
] as const;

export type TurnLifecycleKind = (typeof TURN_LIFECYCLE_KINDS)[number];

/** The compaction subset of the lifecycle kinds, in persistence order. */
export const COMPACTION_LIFECYCLE_KINDS = [
  'compaction_start',
  'compaction',
  'compaction_failed',
] as const;

export type CompactionLifecycleKind = (typeof COMPACTION_LIFECYCLE_KINDS)[number];

/** The review subset of the lifecycle kinds. */
export const REVIEW_LIFECYCLE_KINDS = [
  'review_start',
  'review_result',
  'review_failed',
  'review_aborted',
  'review_interrupted',
] as const;

export type ReviewLifecycleKind = (typeof REVIEW_LIFECYCLE_KINDS)[number];

/** Presentation kinds a model response may carry in addition to lifecycle kinds. */
export type TurnResponsePresentationKind = 'preamble' | 'final';

/** Every kind the wire protocol may attach to a turn message. */
export type TurnMessageKind = TurnLifecycleKind | TurnResponsePresentationKind;

export type TurnLifecycleFamily = 'compaction' | 'review';

/** Lifecycle state a compaction frame represents; it fully replaces `finish_reason`. */
export type CompactionLifecycleState = 'running' | 'completed' | 'failed';

/** Lifecycle state a review frame represents. */
export type ReviewLifecycleState = 'running' | 'completed' | 'failed' | 'cancelled';

/** Minimal shape accepted by the classifiers; any message-like value works. */
export interface TurnMessageLike {
  readonly role?: string | null;
  readonly kind?: string | null;
}

const LIFECYCLE_KIND_SET: ReadonlySet<string> = new Set(TURN_LIFECYCLE_KINDS);

const COMPACTION_KIND_STATES: Readonly<Record<string, CompactionLifecycleState>> = {
  compaction_start: 'running',
  compaction: 'completed',
  compaction_failed: 'failed',
};

const REVIEW_KIND_STATES: Readonly<Record<string, ReviewLifecycleState>> = {
  review_start: 'running',
  review_result: 'completed',
  review_failed: 'failed',
  review_aborted: 'cancelled',
  review_interrupted: 'cancelled',
};

function readKind(value: string | null | undefined): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

export function isTurnLifecycleKind(kind: string | null | undefined): kind is TurnLifecycleKind {
  const value = readKind(kind);
  return value !== undefined && LIFECYCLE_KIND_SET.has(value);
}

export function isCompactionKind(kind: string | null | undefined): boolean {
  return compactionLifecycleState(kind) !== undefined;
}

export function isReviewLifecycleKind(kind: string | null | undefined): boolean {
  return reviewLifecycleState(kind) !== undefined;
}

export function turnLifecycleFamily(
  kind: string | null | undefined,
): TurnLifecycleFamily | undefined {
  if (isCompactionKind(kind)) return 'compaction';
  if (isReviewLifecycleKind(kind)) return 'review';
  return undefined;
}

export function compactionLifecycleState(
  kind: string | null | undefined,
): CompactionLifecycleState | undefined {
  const value = readKind(kind);
  return value === undefined ? undefined : COMPACTION_KIND_STATES[value];
}

export function reviewLifecycleState(
  kind: string | null | undefined,
): ReviewLifecycleState | undefined {
  const value = readKind(kind);
  return value === undefined ? undefined : REVIEW_KIND_STATES[value];
}

/** True for every runtime lifecycle frame, including compaction and review. */
export function isTurnLifecycleMessage(message: TurnMessageLike): boolean {
  return isTurnLifecycleKind(message.kind);
}

/**
 * True only for output the model produced. This is the predicate that decides
 * response steps, response usage, answer selection and user-facing agent output.
 */
export function isTurnResponseMessage(message: TurnMessageLike): boolean {
  return message.role === 'assistant' && !isTurnLifecycleMessage(message);
}

/**
 * Response frames that belong in a transcript surface. Review lifecycle frames
 * are rendered by the review projection instead, and they are already excluded
 * by {@link isTurnResponseMessage}, so this is currently the same predicate.
 * It stays separate to give transcript surfaces one named seam if that ever
 * diverges.
 */
export function isTurnTranscriptResponseMessage(message: TurnMessageLike): boolean {
  return isTurnResponseMessage(message);
}
