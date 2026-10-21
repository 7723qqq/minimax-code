/**
 * English copy for the TUI launcher.
 *
 * The launcher owns the two sentences the process prints outside the
 * interactive surface: the exit slogan and the startup TTY requirement. The
 * English object is the only source of truth for key shape: the zh-Hans
 * catalog is typed against it, so a missing translation is a compile error
 * rather than a blank line in the terminal.
 */
export const EN_LAUNCHER_COPY = {
  'launcher.exitSlogan': 'Intelligence with everyone, bye~',
  'launcher.ttyRequired': 'Minimax Code interactive mode requires a TTY.',
} as const;

/** Every key the launcher catalog defines. */
export type LauncherCopyKey = keyof typeof EN_LAUNCHER_COPY;
