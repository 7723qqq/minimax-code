import type { TuiMessage } from '../runtime/stream-events.js';
import { tuiReviewText } from './copy.js';
import {
  createPassingReviewResult,
  parseTuiReviewResult,
  renderReviewResultText,
  reviewOutcomeFromOrigin,
  type ReviewResultV1,
} from './result.js';

export interface TuiReviewMessageProjection {
  readonly status: 'running' | 'succeeded' | 'failed' | 'cancelled';
  readonly title: string;
  readonly content: string;
  readonly result?: ReviewResultV1;
}

export function projectTuiReviewMessage(
  message: TuiMessage,
): TuiReviewMessageProjection | undefined {
  if (message.kind === 'review_start') {
    return { status: 'running', title: tuiReviewText('review.running'), content: '' };
  }
  if (message.kind === 'review_aborted' || message.kind === 'review_interrupted') {
    return {
      status: 'cancelled',
      title: tuiReviewText('review.interruptedTitle'),
      content: message.content?.trim() || tuiReviewText('review.interruptedContent'),
    };
  }
  const outcome = reviewOutcomeFromOrigin(message.origin);
  if (message.kind === 'review_failed' && !outcome) {
    return {
      status: 'failed',
      title: tuiReviewText('review.failedTitle'),
      content: message.content?.trim() || tuiReviewText('review.failedContent'),
    };
  }
  if (outcome === 'failed') {
    return {
      status: 'failed',
      title: tuiReviewText('review.failedTitle'),
      content: message.content?.trim() || tuiReviewText('review.invalidResult'),
    };
  }
  const parsed = parseTuiReviewResult(message.content ?? '');
  if (outcome === 'needs_changes' || message.kind === 'review_result') {
    if (!parsed) {
      return {
        status: 'failed',
        title: tuiReviewText('review.failedTitle'),
        content: tuiReviewText('review.invalidStructuredResult'),
      };
    }
    const count = parsed.findings.length;
    return {
      status: 'succeeded',
      title: tuiReviewText(
        count === 1 ? 'review.findings.one' : 'review.findings.many',
        { count },
      ),
      content: renderReviewResultText(parsed),
      result: parsed,
    };
  }
  if (outcome === 'pass') {
    const result = createPassingReviewResult(message.content ?? '');
    if (!result) {
      return {
        status: 'failed',
        title: tuiReviewText('review.failedTitle'),
        content: tuiReviewText('review.emptyResult'),
      };
    }
    return {
      status: 'succeeded',
      title: tuiReviewText('review.passed'),
      content: renderReviewResultText(result),
      result,
    };
  }
  return undefined;
}
