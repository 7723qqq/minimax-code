/**
 * English copy for the changelog panel.
 *
 * The English object is the only source of truth for key shape: the zh-Hans
 * catalog is typed against it, so a missing translation is a compile error
 * rather than a blank line in the interface.
 */
export const EN_CHANGELOG_COPY = {
  escClose: 'Esc close',
  linesOf: 'Lines {a}-{b} of {n} · PgUp/PgDn scroll · Esc close',
  mcodeVersion: 'MCode {version}',
} as const;

/** Every key the changelog panel catalog defines. */
export type ChangelogCopyKey = keyof typeof EN_CHANGELOG_COPY;
