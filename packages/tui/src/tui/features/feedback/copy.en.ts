/**
 * English copy for the feedback panel.
 *
 * The English object is the only source of truth for key shape: the zh-Hans
 * catalog is typed against it, so a missing translation is a compile error
 * rather than a blank line in the interface.
 */
export const EN_FEEDBACK_COPY = {
  failureSummary: "Feedback couldn't be sent.",
  failureNextStep: 'Retry, or close this panel and try again later.',
  failurePreservation: 'The reviewed draft is still available.',
  reviewTitle: 'Review feedback',
  whatWillBeSent: 'What will be sent',
  reviewScope: 'Feedback text, bounded device and Runtime details.',
  reviewScopeWithDiagnostics:
    'Feedback text, bounded device and Runtime details, and diagnostic counts with original contents omitted.',
  reviewNoRawData:
    'No raw attachments, conversation text, prompts, tool output, paths, or free-text logs are uploaded. Review your feedback text before sending.',
  reviewHint: 'Enter send · d details · Esc cancel',
  cancellingSafely: '{frame} Cancelling safely',
  cancellingSafelyBody:
    'Stopping the active upload and waiting for the Runtime to confirm cancellation.',
  cancellingSafelyHint: 'Please wait · d details',
  sendingFeedback: '{frame} Sending feedback',
  sendingHint: 'Esc cancel safely · d details',
  uploadStopped:
    'The upload was stopped. If cancellation happened late, check My Feedback before retrying.',
  cancelledHint: 'Enter/Esc close',
  failedHint: 'Enter retry · d details · Esc close',
  retryAction: '› Retry',
  succeededHint: 'Enter/Esc close · d details',
  ticket: 'Ticket {id}',
  successBody: 'Your feedback was created successfully.',
  preparingDetails: 'Preparing details',
  uploadingDiagnostics: 'Uploading diagnostics',
  creatingTicket: 'Creating ticket',
  uploadId: 'Upload ID  {id}',
  phasePreparing: 'Checking the reviewed data and account before upload.',
  phaseUploadingDiagnostics: 'Uploading the reviewed, redacted diagnostic bundle.',
  phaseCreatingTicket: 'Creating the feedback ticket and waiting for its receipt.',
} as const;

/** Every key the feedback panel catalog defines. */
export type FeedbackCopyKey = keyof typeof EN_FEEDBACK_COPY;
