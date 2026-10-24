/**
 * Session manager copy.
 *
 * The English catalog is the only source of truth for the key shape; the
 * zh-Hans catalog is typed against it, so a missing translation is a compile
 * error rather than an `undefined` on screen.
 *
 * The empty-state sentence interpolates a view word (`recent`, `archived`).
 * The word comes from this catalog instead of `toLowerCase()` on a label so
 * that the Chinese sentence reads as a phrase rather than as an English word
 * dropped into a Chinese sentence.
 *
 * `session.status.loadedNoneInWorkspace` and `session.status.loadedMore` come
 * in a `.one` and a `.many` variant, because English pluralizes the session
 * count and Chinese does not. Splitting the key keeps the placeholder set
 * identical in both languages, which is what the catalog completeness check
 * asserts.
 */
/**
 * English copy for the session browser.
 *
 * The English object is the only source of truth for key shape: the zh-Hans
 * catalog is typed against it, so a missing translation is a compile error
 * rather than a blank line in the interface.
 */
export const EN_SESSION_COPY = {
  'session.error.currentUnavailable':
    'The current Session is not available here. Use /rename <title> to rename it directly.',
  'session.scope.workspace': 'This workspace',
  'session.scope.all': 'All sessions',
  'session.status.searching': 'Searching saved sessions…',
  'session.status.loadingMore': 'Loading more sessions…',
  'session.filter.hint': 'Filter title, ID, workspace, model, status, or branch',
  'session.status.noMatches': 'No matching sessions.',
  'session.empty.noSessionsInWorkspace': 'No {view} sessions in this workspace.',
  'session.viewWord.recent': 'recent',
  'session.viewWord.archived': 'archived',
  'session.title.untitled': 'Untitled session',
  'session.workspace.unknown': 'Unknown workspace',
  'session.hint.rename': 'Ctrl+U clear · Enter save · Esc cancel',
  'session.hint.enterEsc': 'Enter · Esc',
  'session.footer.scope.all': 'all',
  'session.footer.scope.current': 'current',
  'session.footer.action.new': 'new',
  'session.footer.action.rename': 'rename',
  'session.footer.action.archive': 'archive',
  'session.footer.action.restore': 'restore',
  'session.footer.action.switch': 'switch',
  'session.footer.view.archived': 'archived',
  'session.footer.view.recent': 'recent',
  'session.footer.move': '↑↓ move',
  'session.footer.moreAvailable': 'More sessions available · Ctrl+L more',
  'session.footer.close': 'Esc close',
  'session.rename.title': 'Sessions / Rename session',
  'session.archive.title': 'Archive session?',
  'session.archive.unknownSession': 'Unknown session',
  'session.archive.historyNote': 'History stays available under Archived.',
  'session.archive.hint': 'Enter archive · Esc cancel',
  'session.status.loadingAll': 'Loading all sessions…',
  'session.status.loadingWorkspace': 'Loading this workspace…',
  'session.error.scopeChanged': "Couldn't change the session scope.",
  'session.action.retry': 'Retry.',
  'session.error.scopePreserved': 'The current session list is unchanged.',
  'session.status.allLoadedWorkspace': 'All sessions loaded · none new in this workspace.',
  'session.status.loadedNoneInWorkspace.one':
    '{count} session loaded · none in this workspace · Ctrl+A show all.',
  'session.status.loadedNoneInWorkspace.many':
    '{count} sessions loaded · none in this workspace · Ctrl+A show all.',
  'session.status.loadedMore.one': '{count} more session{scope} loaded.',
  'session.status.loadedMore.many': '{count} more sessions{scope} loaded.',
  'session.scopeSuffix.workspace': ' in this workspace',
  'session.status.allMatchesLoaded': 'All matching sessions loaded.',
  'session.error.emptyTitle': 'Session title cannot be empty.',
  'session.status.titleUnchanged': 'Session title unchanged.',
  'session.status.renamed': 'Renamed to {title}.',
  'session.status.working': 'Working…',
  'session.status.restored': 'Session restored.',
  'session.status.archived': 'Session archived.',
  'session.error.notSaved': 'Session changes were not saved.',
  'session.error.unchanged': 'The existing session is unchanged.',
} as const;

/** Every key the session browser catalog defines. */
export type SessionCopyKey = keyof typeof EN_SESSION_COPY;
