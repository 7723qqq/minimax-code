import type { LauncherCopyKey } from './launcher-copy.en.js';

/**
 * Simplified Chinese copy for the TUI launcher.
 *
 * The `satisfies` clause is the completeness check: a key present in the
 * English catalog but absent here fails `pnpm typecheck`.
 */
export const ZH_HANS_LAUNCHER_COPY = {
  'launcher.exitSlogan': '与大家共智，再见~',
  'launcher.ttyRequired': 'Minimax Code 交互模式需要 TTY 终端。',
} as const satisfies Readonly<Record<LauncherCopyKey, string>>;
