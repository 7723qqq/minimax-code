/**
 * English copy for the TUI update and prefix-activation surface.
 *
 * The English object is the only source of truth for key shape: the zh-Hans
 * catalog is typed against it, so a missing translation is a compile error
 * rather than an empty line in the terminal.
 *
 * The "already installed" wording is not defined here: `update.versionedInstalled`
 * lives in the shared runtime catalog, because the managed update path and the
 * prefix-update path must render the same sentence.
 */
export const EN_TUI_UPDATE_COPY = {
  'update.prefix.activationScheduled':
    'A staged MCode update will activate after this process exits.',
  'update.prefix.journalScheduleFailed':
    'MCode update was staged, but its activation journal could not be scheduled.',
  'update.prefix.nonPrefixPlan': 'MCode npm prefix updater received a non-prefix plan.',
  'update.prefix.ownershipMissing': 'MCode npm prefix ownership metadata is missing.',
  'update.prefix.pendingActivation.default':
    'MCode {version} is already staged. Restarting will resume activation after running MCode sessions exit.',
  'update.prefix.pendingActivation.blocking.one':
    'MCode {version} is already staged. Activation will wait for {count} other MCode session to exit.',
  'update.prefix.pendingActivation.blocking.many':
    'MCode {version} is already staged. Activation will wait for {count} other MCode sessions to exit.',
  'update.prefix.pendingActivation.immediate':
    'MCode {version} is already staged. It will activate after this process exits.',
  'update.prefix.pendingCleanup.default':
    'MCode {version} is already active. Restarting will finish update cleanup after running MCode sessions exit.',
  'update.prefix.pendingCleanup.blocking.one':
    'MCode {version} is already active. Update cleanup will wait for {count} other MCode session to exit.',
  'update.prefix.pendingCleanup.blocking.many':
    'MCode {version} is already active. Update cleanup will wait for {count} other MCode sessions to exit.',
  'update.prefix.pendingCleanup.immediate':
    'MCode {version} is already active. Restarting will finish update cleanup.',
  'update.prefix.stagedVersionMismatch':
    'MCode update staged {actualVersion}; expected {expectedVersion}.',
  'update.prefix.staged.default':
    'MCode {version} is downloaded and staged safely. Waiting for running MCode sessions to exit before activation.',
  'update.prefix.staged.blocking.one':
    'MCode {version} is downloaded and staged safely. Waiting for {count} other MCode session to exit before activation.',
  'update.prefix.staged.blocking.many':
    'MCode {version} is downloaded and staged safely. Waiting for {count} other MCode sessions to exit before activation.',
  'update.prefix.staged.immediate':
    'MCode {version} is downloaded and staged safely. It will activate after this process exits.',
  'update.prefix.notStaged':
    'MCode {version} was not staged; the active installation is unchanged: {reason}',
  'update.versionedAlreadyActive': 'MCode {version} is already active.',
  'update.installedVersionMismatch':
    'MCode update installed {installedVersion}; expected {latestVersion}.',
} as const;

/** Every key the TUI update catalog defines. */
export type TuiUpdateCopyKey = keyof typeof EN_TUI_UPDATE_COPY;
