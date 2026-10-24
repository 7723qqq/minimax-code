/**
 * Queue panel copy.
 *
 * The English catalog is the only source of truth for the key shape; the
 * zh-Hans catalog is typed against it, so a missing translation is a compile
 * error rather than an `undefined` on screen.
 *
 * The list hint is assembled from catalog fragments instead of being written
 * at the call site: the footer changes with the queue state (paused or not,
 * restorable or not, failed or not), so each conditional piece is its own key
 * and the template only decides the order.
 */
/**
 * English copy for the message queue panels.
 *
 * The English object is the only source of truth for key shape: the zh-Hans
 * catalog is typed against it, so a missing translation is a compile error
 * rather than a blank line in the interface.
 */
export const EN_QUEUE_COPY = {
  'queue.summary.paused': 'Paused · {n} pending. Continue when ready.',
  'queue.summary.running': 'Runs in this order after the current response.',
  'queue.empty.waitingToContinue': 'Background work is waiting to continue.',
  'queue.empty.noMessages': 'No next messages.',
  'queue.edit.title': 'Edit next message',
  'queue.edit.attachmentsUnchanged': 'Attachments stay unchanged · {names}',
  'queue.confirm.removeTitle': 'Remove this next message?',
  'queue.hint.save': 'Enter save · Esc cancel',
  'queue.hint.remove': 'Enter remove · Esc keep',
  'queue.hint.list': '{continue}↑↓ select · Enter {action}{restore}{removal} · Esc close',
  'queue.hint.continue': 'c continue queue · ',
  'queue.hint.action.retry': 'retry',
  'queue.hint.action.edit': 'edit',
  'queue.hint.restore': ' · r restore',
  'queue.hint.removal.discard': ' · e edit · d discard',
  'queue.hint.removal.remove': ' · d remove',
  'queue.status.continued': 'Queue continued.',
  'queue.status.continueFailed':
    'The Queue could not continue. Check the current response or provider settings.',
  'queue.action.continueRetry': 'Check the provider settings and retry.',
  'queue.error.continueFailed': "Couldn't continue the Queue.",
  'queue.error.alreadyStarted': 'That message has already started.',
  'queue.error.emptyMessage': 'A next message cannot be empty.',
  'queue.error.updatePreserved': 'Your original message is unchanged.',
  'queue.error.updateFailed': "Couldn't update this next message.",
  'queue.action.updateRetry': 'Retry.',
  'queue.action.removeRetry': 'Retry from the Queue.',
  'queue.error.removeFailed': "Couldn't remove this next message.",
  'queue.status.updated': 'Next message updated.',
  'queue.status.removed': 'Next message removed.',
  'queue.status.retrying': 'Retrying message…',
  'queue.status.accepted': 'Message accepted.',
  'queue.status.pendingRetry': 'Message is still pending retry.',
  'queue.error.retryFailed': "Couldn't retry this message.",
  'queue.action.retryLater': 'Retry later.',
  'queue.error.retryPreserved': 'It remains in the Queue.',
  'queue.status.restoring': 'Restoring message…',
  'queue.status.restored': 'Message restored to Composer.',
  'queue.action.restoreRetry': 'Reopen the Queue to check its state.',
  'queue.error.restoreFailed': "Couldn't restore this message.",
  'queue.pausedSend.paused': 'Queue paused · {n} pending',
  'queue.pausedSend.question': 'How should this message continue the Session?',
  'queue.pausedSend.keepQueue': 'Send this message first, then continue the queue',
  'queue.pausedSend.clearQueue': 'Clear my queued messages and send this message',
  'queue.pausedSend.keepDraft': 'Keep my draft',
  'queue.pausedSend.hint': '↑↓ select · Enter confirm · Esc keep draft',
} as const;

/** Every key the message queue panels catalog defines. */
export type QueueCopyKey = keyof typeof EN_QUEUE_COPY;
