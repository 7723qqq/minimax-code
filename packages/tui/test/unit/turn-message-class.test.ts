import { describe, expect, it } from 'vitest';

import {
  compactionLifecycleState,
  isCompactionKind,
  isReviewLifecycleKind,
  isTurnLifecycleKind,
  isTurnLifecycleMessage,
  isTurnResponseMessage,
  isTurnTranscriptResponseMessage,
  reviewLifecycleState,
  TURN_LIFECYCLE_KINDS,
  turnLifecycleFamily,
} from '../../../shared/src/turn-message-class.js';

describe('turn message classification', () => {
  it('classifies every lifecycle kind and no response kind', () => {
    for (const kind of TURN_LIFECYCLE_KINDS) {
      expect(isTurnLifecycleKind(kind)).toBe(true);
    }
    for (const kind of ['preamble', 'final', '', undefined, null, 'assistant']) {
      expect(isTurnLifecycleKind(kind)).toBe(false);
    }
  });

  it('separates compaction from review lifecycle families', () => {
    expect(turnLifecycleFamily('compaction_start')).toBe('compaction');
    expect(turnLifecycleFamily('compaction_failed')).toBe('compaction');
    expect(turnLifecycleFamily('review_result')).toBe('review');
    expect(turnLifecycleFamily('review_interrupted')).toBe('review');
    expect(turnLifecycleFamily('final')).toBeUndefined();
    expect(isCompactionKind('review_start')).toBe(false);
    expect(isReviewLifecycleKind('compaction')).toBe(false);
  });

  it('maps compaction kinds to one lifecycle state each', () => {
    expect(compactionLifecycleState('compaction_start')).toBe('running');
    expect(compactionLifecycleState('compaction')).toBe('completed');
    expect(compactionLifecycleState('compaction_failed')).toBe('failed');
    expect(compactionLifecycleState('review_start')).toBeUndefined();
    expect(compactionLifecycleState(undefined)).toBeUndefined();
  });

  it('maps review kinds to one lifecycle state each', () => {
    expect(reviewLifecycleState('review_start')).toBe('running');
    expect(reviewLifecycleState('review_result')).toBe('completed');
    expect(reviewLifecycleState('review_failed')).toBe('failed');
    expect(reviewLifecycleState('review_aborted')).toBe('cancelled');
    expect(reviewLifecycleState('review_interrupted')).toBe('cancelled');
    expect(reviewLifecycleState('compaction')).toBeUndefined();
  });

  it('counts only real model output as a response', () => {
    // The defect this module exists to prevent: lifecycle frames are persisted
    // with `role: 'assistant'`, so `role` alone is not enough.
    expect(isTurnResponseMessage({ role: 'assistant', kind: 'compaction' })).toBe(false);
    expect(isTurnResponseMessage({ role: 'assistant', kind: 'compaction_start' })).toBe(false);
    expect(isTurnResponseMessage({ role: 'assistant', kind: 'review_result' })).toBe(false);
    expect(isTurnLifecycleMessage({ role: 'assistant', kind: 'review_start' })).toBe(true);

    expect(isTurnResponseMessage({ role: 'assistant' })).toBe(true);
    expect(isTurnResponseMessage({ role: 'assistant', kind: 'final' })).toBe(true);
    expect(isTurnResponseMessage({ role: 'assistant', kind: 'preamble' })).toBe(true);
    expect(isTurnResponseMessage({ role: 'user' })).toBe(false);
    expect(isTurnResponseMessage({ role: 'system' })).toBe(false);
    expect(isTurnResponseMessage({ role: undefined })).toBe(false);
  });

  it('keeps review frames out of the transcript while keeping responses in', () => {
    expect(isTurnTranscriptResponseMessage({ role: 'assistant', kind: 'review_result' })).toBe(
      false,
    );
    expect(isTurnTranscriptResponseMessage({ role: 'assistant', kind: 'review_start' })).toBe(false);
    expect(isTurnTranscriptResponseMessage({ role: 'assistant', kind: 'compaction' })).toBe(false);
    expect(isTurnTranscriptResponseMessage({ role: 'assistant', kind: 'final' })).toBe(true);
    expect(isTurnTranscriptResponseMessage({ role: 'assistant' })).toBe(true);
    expect(isTurnTranscriptResponseMessage({ role: 'user', kind: 'final' })).toBe(false);
  });
});
