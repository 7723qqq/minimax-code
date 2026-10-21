import { AppError } from '../errors.js';

import { v2ConversationText, type V2ConversationCopyKey } from './copy.js';

/** Cloud handoff denial causes mapped to the catalog key that explains them. */
const HANDOFF_DENIED_MESSAGE_KEYS = new Map<string, V2ConversationCopyKey>([
  ['proposal-pending', 'handoff.proposalPending'],
  ['in-progress', 'handoff.inProgress'],
  ['already-handed-off', 'handoff.alreadyHandedOff'],
  ['cleanup-pending', 'handoff.cleanupPending'],
]);

/** Transport-neutral conversation application failure mapped by delivery boundaries. */
export class ApplicationError extends AppError {
  constructor(status: number, key: string, message: string) {
    super(status, key, message);
    this.name = 'ApplicationError';
  }
}

/** Known Turn admission errors shared by direct HTTP, SSE and queue controls. */
export function turnAdmissionError(reason: string) {
  if (reason === 'policy:cloud-handoff:interrupt-timeout') {
    return {
      status: 409,
      key: 'HANDOFF_INTERRUPT_TIMEOUT',
      message: v2ConversationText('handoff.previousTurnRunning'),
    };
  }
  if (reason === 'policy:turn-abort:pre-admission') {
    return {
      status: 409,
      key: 'local_turn_aborted',
      message: v2ConversationText('turnStoppedBeforeExecution'),
    };
  }
  if (reason.startsWith('policy:cloud-handoff:denied:')) {
    const cause = reason.slice('policy:cloud-handoff:denied:'.length);
    const messageKey = HANDOFF_DENIED_MESSAGE_KEYS.get(cause);
    return {
      status: 409,
      key: messageKey ? `HANDOFF_PREFLIGHT_DENIED:${cause}` : 'HANDOFF_PREFLIGHT_DENIED',
      message: v2ConversationText(messageKey ?? 'handoff.notAllowed'),
    };
  }
  if (
    reason === 'policy:cloud-handoff:preparation-failed' ||
    reason === 'policy:cloud-handoff:unavailable'
  ) {
    return {
      status: 503,
      key: 'HANDOFF_PREFLIGHT_UNAVAILABLE',
      message: v2ConversationText('handoff.preparationFailed'),
    };
  }
  return undefined;
}
