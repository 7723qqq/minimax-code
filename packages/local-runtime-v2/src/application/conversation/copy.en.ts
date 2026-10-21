/**
 * English copy for the v2 conversation application.
 *
 * The English object is the only source of truth for key shape: the zh-Hans
 * catalog is typed against it, so a missing translation is a compile error
 * rather than a blank line in the interface.
 *
 * These are the admission failures the conversation, stream and queue
 * boundaries report to the user. The machine-readable error key stays in the
 * code next to the message and is never translated.
 */
export const EN_V2_CONVERSATION_COPY = {
  'handoff.previousTurnRunning':
    'The previous turn has not stopped yet. Cloud handoff was not started.',
  'turnStoppedBeforeExecution': 'Turn was stopped before execution.',
  'handoff.proposalPending': 'This session already has a handoff proposal awaiting approval.',
  'handoff.inProgress': 'This session is already being handed off to Cloud.',
  'handoff.alreadyHandedOff':
    'This session has already been handed off. Continue in the existing Cloud session.',
  'handoff.cleanupPending': 'The previous Cloud handoff is awaiting cleanup.',
  'handoff.notAllowed': 'Cloud handoff is not allowed.',
  'handoff.preparationFailed': 'Unable to prepare Cloud handoff. Please try again later.',
} as const;

/** Every key the v2 conversation catalog defines. */
export type V2ConversationCopyKey = keyof typeof EN_V2_CONVERSATION_COPY;
