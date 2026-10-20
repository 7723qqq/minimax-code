import { reviewLifecycleState } from '@mavis/shared/turn-message-class';

import type { TuiMessage } from '../runtime/stream-events.js';
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
  const state = reviewLifecycleState(message.kind);
  if (state === 'running') {
    return { status: 'running', title: 'Reviewing local changes…', content: '' };
  }
  if (state === 'cancelled') {
    return {
      status: 'cancelled',
      title: 'Code review interrupted',
      content: message.content?.trim() || 'The code review was interrupted.',
    };
  }
  const outcome = reviewOutcomeFromOrigin(message.origin);
  if (state === 'failed' && !outcome) {
    return {
      status: 'failed',
      title: 'Code review failed',
      content: message.content?.trim() || 'The code review could not be completed.',
    };
  }
  if (outcome === 'failed') {
    return {
      status: 'failed',
      title: 'Code review failed',
      content: message.content?.trim() || 'The Runtime rejected an invalid review result.',
    };
  }
  const parsed = parseTuiReviewResult(message.content ?? '');
  if (outcome === 'needs_changes' || state === 'completed') {
    if (!parsed) {
      return {
        status: 'failed',
        title: 'Code review failed',
        content: 'The Runtime returned an invalid structured review result.',
      };
    }
    return {
      status: 'succeeded',
      title: `Code review · ${String(parsed.findings.length)} finding${parsed.findings.length === 1 ? '' : 's'}`,
      content: renderReviewResultText(parsed),
      result: parsed,
    };
  }
  if (outcome === 'pass') {
    const result = createPassingReviewResult(message.content ?? '');
    if (!result) {
      return {
        status: 'failed',
        title: 'Code review failed',
        content: 'The Runtime returned an empty review result.',
      };
    }
    return {
      status: 'succeeded',
      title: 'Code review passed',
      content: renderReviewResultText(result),
      result,
    };
  }
  return undefined;
}
