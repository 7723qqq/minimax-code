import { isAbsolute, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export type TuiExternalTargetOpener = (target: string) => Promise<void>;

export function createTuiExternalTargetOpener(workspaceDir: string): TuiExternalTargetOpener {
  return (target) => openTuiExternalTarget(target, workspaceDir);
}

export function openTuiExternalTarget(target: string, workspaceDir: string): Promise<void> {
  const normalized = resolveTuiExternalTarget(target, workspaceDir);
  const [command, args]: [string, string[]] =
    process.platform === 'darwin'
      ? ['open', [normalized]]
      : process.platform === 'win32'
        ? ['rundll32', ['url.dll,FileProtocolHandler', normalized]]
        : ['xdg-open', [normalized]];

  // `Bun.spawn` throws synchronously when the opener cannot start, which is
  // the only failure this fire-and-forget spawn can report; once it returns,
  // the child is running and is intentionally left detached and unreferenced.
  try {
    const child = Bun.spawn({
      cmd: [command, ...args],
      detached: true,
      stdin: 'ignore',
      stdout: 'ignore',
      stderr: 'ignore',
      windowsHide: true,
    });
    child.unref();
  } catch (error) {
    return Promise.reject(error instanceof Error ? error : new Error(String(error)));
  }
  return Promise.resolve();
}

export function resolveTuiExternalTarget(target: string, workspaceDir: string): string {
  if (/^https?:\/\//iu.test(target)) return target;
  if (/^file:\/\//iu.test(target)) return fileURLToPath(target);
  return isAbsolute(target) ? target : resolve(workspaceDir, target);
}
