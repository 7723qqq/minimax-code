/**
 * English copy for the help panel.
 *
 * The English object is the only source of truth for key shape: the zh-Hans
 * catalog is typed against it, so a missing translation is a compile error
 * rather than a blank line in the interface.
 */
export const EN_HELP_COPY = {
  title: 'Help',
  keyboardShortcuts: 'Keyboard shortcuts',
  slashCommands: 'Slash commands',
  sendWhileWorking: 'Send; while MCode works it sends next',
  sendWhileIdle: 'Send while idle',
  escClose: 'Esc close',
  escCloseWithKey: 'Esc close · {key} to close',
  showingRange: 'showing {a}-{b} of {n}',
  scrollHint: '↑↓ / {up} / {down} scroll',
} as const;

/** Every key the help panel catalog defines. */
export type HelpCopyKey = keyof typeof EN_HELP_COPY;
