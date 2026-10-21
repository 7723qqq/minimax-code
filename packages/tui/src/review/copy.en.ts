/**
 * English copy for the code review projection.
 *
 * The English object is the only source of truth for key shape: the zh-Hans
 * catalog is typed against it, so a missing translation is a compile error
 * rather than an empty line in the interface.
 */
export const EN_TUI_REVIEW_COPY = {
  'review.running': 'Reviewing local changes…',
  'review.interruptedTitle': 'Code review interrupted',
  'review.interruptedContent': 'The code review was interrupted.',
  'review.failedTitle': 'Code review failed',
  'review.failedContent': 'The code review could not be completed.',
  'review.invalidResult': 'The Runtime rejected an invalid review result.',
  'review.invalidStructuredResult': 'The Runtime returned an invalid structured review result.',
  'review.findings.one': 'Code review · {count} finding',
  'review.findings.many': 'Code review · {count} findings',
  'review.emptyResult': 'The Runtime returned an empty review result.',
  'review.passed': 'Code review passed',
} as const;

/** Every key the code review catalog defines. */
export type TuiReviewCopyKey = keyof typeof EN_TUI_REVIEW_COPY;
