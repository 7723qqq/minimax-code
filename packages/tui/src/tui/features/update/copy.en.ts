/**
 * Update panel copy.
 *
 * The English catalog is the only source of truth for the key shape; the
 * zh-Hans catalog is typed against it, so a missing translation is a compile
 * error rather than an `undefined` on screen.
 *
 * The leading glyphs (`›`, `×`, `✓`, `⠋`, `↑↓`) are part of the English
 * strings and stay in place in the translation; only the words around them
 * change.
 */
/**
 * English copy for the update panel.
 *
 * The English object is the only source of truth for key shape: the zh-Hans
 * catalog is typed against it, so a missing translation is a compile error
 * rather than a blank line in the interface.
 */
export const EN_UPDATE_COPY = {
  'update.error.installFailed': "The update couldn't be installed.",
  'update.error.installNextStep': 'Retry, or close this panel and try again later.',
  'update.error.installPreserved': 'The previous MCode version is still active.',
  'update.error.restartFailed': "MCode couldn't restart automatically.",
  'update.error.restartNextStep': 'Close this terminal and start MCode again.',
  'update.error.restartPreserved': 'The update is already installed.',
  'update.review.title': 'MCode update available',
  'update.review.updateNow': 'Update now',
  'update.review.notNow': 'Not now',
  'update.review.hint': '↑↓ choose · Enter confirm · d details · Esc close',
  'update.applying.title': '{frame} Updating MCode',
  'update.applying.progress': '{phase} {version} with {source}',
  'update.applying.latestOutput': 'Latest output',
  'update.applying.cancelling': 'Cancelling safely… · d details',
  'update.applying.cancelHint': 'Esc cancel safely · d details',
  'update.applying.finishing': 'Finishing safely · cancellation is locked · d details',
  'update.paused.title': 'Update paused',
  'update.paused.checkAgain': '› Check again',
  'update.hint.retryClose': 'Enter retry · Esc close',
  'update.cancelled.title': 'Update cancelled safely',
  'update.cancelled.previousActive': 'The previous MCode installation remains active.',
  'update.cancelled.tryAgain': '› Try again',
  'update.failed.title': '× Update failed',
  'update.failed.retry': '› Retry',
  'update.failed.hint': 'Enter retry · d details · Esc close',
  'update.success.title': '✓ MCode updated to {version}',
  'update.success.restarting': '⠋ Restarting MCode…',
  'update.success.restartNow': '› Restart MCode now',
  'update.success.hint': 'Enter restart · Esc restart later',
  'update.details.title': 'Details',
  'update.details.pipeline': 'Signature + checksum + staging + atomic activation',
  'update.phase.checking': 'Checking',
  'update.phase.downloading': 'Downloading',
  'update.phase.staging': 'Staging',
  'update.phase.validating': 'Validating',
  'update.phase.activating': 'Activating',
  'update.phase.completed': 'Completed',
  'update.phase.installing': 'Installing',
  'update.source.officialInstaller': 'Official installer',
} as const;

/** Every key the update panel catalog defines. */
export type UpdateCopyKey = keyof typeof EN_UPDATE_COPY;
