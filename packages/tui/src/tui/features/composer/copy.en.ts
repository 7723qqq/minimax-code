/**
 * English copy for the composer.
 *
 * The English object is the only source of truth for key shape: the zh-Hans
 * catalog is typed against it, so a missing translation is a compile error
 * rather than a blank line in the interface.
 */
export const COMPOSER_COPY = {
  imagePreviewLoading: 'Loading preview…',
  imagePreviewUnavailable: 'Preview unavailable · attachment is still ready to send',
  imagePreviewTextOnly: 'Image preview is not supported by this terminal',
  imagePreviewHint: 'Esc dismiss · Enter send',
  placeholder: 'Ask Mcode to do anything',
  draftSaveFailed: "Couldn't save draft recovery.",
  draftCleanupFailed: "Couldn't clean up draft recovery.",
  draftMigrationFailed: "Couldn't move draft recovery to this session.",
  draftRestoreFailed: "Couldn't read draft recovery.",
  draftRecoveryUnavailable:
    'You can continue using MCode. Unsent input may not be recoverable after restarting.',
  draftCleanupNextStep: 'An older draft or attachment backup may remain on disk.',
  attachmentPathRequired: 'Attachment path is required.',
  attachmentFailed: 'Cannot attach {reference}: {reason}',
  attachmentNotAFile: 'Cannot attach {reference}: path is not a file.',
  attachmentEmptyPath: 'Cannot add an empty attachment path.',
  attachmentAlreadyAttached: 'Already attached for the next message: {fileName}',
  attachmentLimitFiles: 'You can attach up to {count} files. Remove one before adding another.',
  attachmentLimitSize:
    'Attachments can total up to {limit}. Remove an attachment or choose a smaller file.',
  clipboardUnavailable:
    'Clipboard paste is unavailable in this host. Save media and reference it in the prompt with @.',
  clipboardReading: 'Reading clipboard…',
  clipboardFailed: 'Copy the image or video file again, or attach the saved file with @.',
  clipboardPasteFailed: "Couldn't paste media from the clipboard.",
  draftRestored: 'Draft restored · {parts}',
  draftPartText: 'text',
  draftPartAttachmentOne: '{count} attachment',
  draftPartAttachmentMany: '{count} attachments',
  draftAdmissionStopped: 'MCode stopped before Runtime admission completed.',
  draftAbortedReturned: 'Aborted submission returned to the composer.',
} as const;

/** Every key the composer catalog defines. */
export type ComposerCopyKey = keyof typeof COMPOSER_COPY;
