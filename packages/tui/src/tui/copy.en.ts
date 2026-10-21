/**
 * English copy for the TUI surfaces that do not own a dedicated catalog.
 *
 * This catalog holds the agent-team panel and summary, the background-work
 * panel, the generic settings list, the side-session command, the application
 * action failures and the history/hook projections. The English object is the
 * only source of truth for key shape: the zh-Hans catalog is typed against it,
 * so a missing translation is a compile error rather than a blank line in the
 * interface.
 */
export const EN_TUI_COPY = {
  // Agent team
  'agentTeam.activity.thinking': 'Thinking',
  'agentTeam.activity.responding': 'Responding',
  'agentTeam.activity.starting': 'Starting',
  'agentTeam.activity.waitingForInput': 'Waiting for input',
  'agentTeam.activity.reading': 'Reading',
  'agentTeam.activity.searching': 'Searching',
  'agentTeam.activity.editing': 'Editing',
  'agentTeam.activity.writing': 'Writing',
  'agentTeam.activity.runningTests': 'Running tests',
  'agentTeam.activity.runningCommand': 'Running command',
  'agentTeam.activity.usingTool': 'Using {tool}',
  'agentTeam.heading.title': 'Agent team',
  'agentTeam.header.summary': 'Agents · {count} total',
  'agentTeam.overflow': '└ … {count} more',
  'agentTeam.marker.current': 'current',
  'agentTeam.empty': 'No delegated agents',
  'agentTeam.footer.hint': '↑↓ select · PgUp/PgDn scroll · Enter open transcript · Esc return',
  'agentTeam.fallback.agentName': 'sub-agent',
  'agentTeam.fallback.task': 'Delegated task',
  'agentTeam.fallback.failed': 'Agent failed',
  'agentTeam.fallback.tool': 'tool',

  // Background work
  'backgroundWork.title': 'Tasks',
  'backgroundWork.empty': 'No background work',
  'backgroundWork.detail.unavailable': 'Background task unavailable',
  'backgroundWork.detail.changed': 'The Runtime task list changed. Press Esc to return.',
  'backgroundWork.detail.heading': 'Background task · {status}',
  'backgroundWork.detail.taskId': 'Task ID',
  'backgroundWork.detail.error': 'Error',
  'backgroundWork.detail.command': 'Command',
  'backgroundWork.detail.description': 'Description',
  'backgroundWork.detail.hint': 'PgUp/PgDn scroll · Esc back · Q close',
  'backgroundWork.action.openTranscript': 'Enter open transcript',
  'backgroundWork.action.inspect': 'Enter inspect',
  'backgroundWork.footer.hint': '↑↓ select · PgUp/PgDn scroll · {action} · Esc return',
  'backgroundWork.footer.hintNoAction': '↑↓ select · PgUp/PgDn scroll · Esc return',
  'backgroundWork.entry.agent': '[Agent]',
  'backgroundWork.entry.bash': '[Bash]',
  'backgroundWork.entry.workflow': '[Workflow]',
  'backgroundWork.entry.custom': '[Custom]',

  // Shared status labels
  'status.done': 'Done',
  'status.failed': 'Failed',
  'status.running': 'Running',
  'status.stopped': 'Stopped',
  'status.queued': 'Queued',
  'status.waiting': 'Waiting',
  'status.cancelled': 'Cancelled',
  'status.succeeded': 'Succeeded',
  'status.stopping': 'Stopping',
  'status.lost': 'Lost',

  // Shared counters
  'count.total': '{count} total',
  'count.active': '{count} active',
  'count.running': '{count} running',
  'count.waiting': '{count} waiting',
  'count.queued': '{count} queued',
  'count.done': '{count} done',
  'count.failed': '{count} failed',
  'count.stopped': '{count} stopped',
  'count.agents.one': '{count} agent',
  'count.agents.many': '{count} agents',
  'count.tools': '{count} tools',

  // Settings list
  'settingsList.hint.search': 'Type to search · Enter/Space to change · Esc to cancel',
  'settingsList.hint.change': 'Enter/Space to change · Esc to cancel',

  // Side session
  'sideSession.reject.noSession': 'Open a Session before starting a side conversation.',
  'sideSession.reject.nested':
    'A side conversation is already open. Press Ctrl+C to return before starting another.',
  'sideSession.reject.noBoundary': 'This Session is not ready yet; try again in a moment.',
  'sideSession.label.forSide': '{shortcut} for side',
  'sideSession.label.fromMain': 'Side from main session',
  'sideSession.label.toMain': '{shortcut} to main',
  'sideSession.label.toClose': '{shortcut} to close',
  'sideSession.parent.needsInput': 'main needs input',
  'sideSession.parent.needsApproval': 'main needs approval',
  'sideSession.parent.failed': 'main failed',
  'sideSession.parent.interrupted': 'main interrupted',
  'sideSession.parent.finished': 'main finished',

  // Application action failures
  'app.session.openFailed': "Couldn't open this conversation.",
  'app.session.continueFailed': "Couldn't continue the latest conversation.",
  'app.session.retryAfterReconnect': 'Retry after the connection recovers.',
  'app.agents.refreshFailed': "Couldn't refresh delegated agents.",
  'app.agents.updateAfterReconnect': 'Their status will update when the connection recovers.',
  'app.messageRestored': 'Stopped · message restored to the Composer.',

  // History and hook projections
  'projection.hook.title': 'Hook',
  'projection.hook.titleWithEvent': 'Hook · {event}',
} as const;

/** Every key the TUI catalog defines. */
export type TuiCopyKey = keyof typeof EN_TUI_COPY;

/** Shape every translation of the TUI catalog must satisfy. */
export type TuiTranslations = Readonly<Record<TuiCopyKey, string>>;
