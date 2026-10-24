import { realpath } from 'node:fs/promises';
import { resolve } from 'node:path';

import { resolvePath } from './path-utils.js';

export interface GitRunResult {
  code: number;
  stdout: string;
  stderr: string;
}

/**
 * Runs one Git command and buffers its whole output.
 *
 * `Bun.spawn` replaces `promisify(execFile)` so the runtime's own subprocess
 * surface is used throughout. Two behaviours are reproduced deliberately:
 *
 *  - A failure to start the process is reported as a result, not thrown. The
 *    previous implementation caught the `execFile` rejection, so callers test
 *    `result.code` instead of wrapping the call in `try`. `Bun.spawn` throws
 *    synchronously for `ENOENT`, so that throw is caught here.
 *  - The workspace must be reachable before Git runs. `execFile` started Git
 *    and let it report a missing directory in its own words; `Bun.spawn`
 *    instead fails with `uv_spawn 'git'`, which names the wrong thing. The
 *    directory is therefore checked first so callers keep reading a message
 *    about the workspace.
 *  - Output is decoded as UTF-8 through the streams rather than through
 *    `maxBuffer`. `readAll` already applies a byte ceiling, which is what
 *    `GIT_MAX_BUFFER` expressed before.
 *
 * Expect the first call in a process to be slow on Windows. Spawning a native
 * executable without a shell costs one multi-second wait per process before the
 * runtime settles; every later spawn of the same shape is fast. This is an
 * upstream runtime characteristic reached through both `Bun.spawn` and
 * `node:child_process`, not something this wrapper adds, so it is recorded
 * rather than worked around: routing Git through `cmd /c` would change argument
 * quoting for every caller to buy back a cost paid once per process.
 */
export async function git(args: string[], workspace: string): Promise<GitRunResult> {
  const cwd = resolvePath(workspace);
  if (!(await isDirectory(cwd))) return missingWorkspace(cwd);
  try {
    const child = Bun.spawn({
      cmd: ['git', '-c', 'core.quotePath=false', ...args],
      cwd,
      env: gitEnv(),
      stdin: 'ignore',
      stdout: 'pipe',
      stderr: 'pipe',
    });
    const [stdout, stderr, code] = await Promise.all([
      readAll(child.stdout, GIT_MAX_BUFFER),
      readAll(child.stderr, GIT_MAX_BUFFER),
      child.exited,
    ]);
    return { code, stdout, stderr };
  } catch (error) {
    return {
      code: 1,
      stdout: '',
      stderr: error instanceof Error ? error.message : String(error),
    };
  }
}

function missingWorkspace(cwd: string): GitRunResult {
  return { code: 1, stdout: '', stderr: `workspace directory does not exist: ${cwd}` };
}

/**
 * Whether `cwd` is a directory.
 *
 * `Bun.file(path).exists()` is false for a directory, so it cannot stand in for
 * this check; `stat()` is the surface that reports the entry type.
 */
async function isDirectory(cwd: string): Promise<boolean> {
  try {
    return (await Bun.file(cwd).stat()).isDirectory();
  } catch {
    return false;
  }
}

export async function gitRoot(workspace: string): Promise<string | undefined> {
  const result = await git(['rev-parse', '--show-toplevel'], workspace);
  return result.code === 0 ? result.stdout.trim() : undefined;
}

export async function gitCommonDir(workspace: string): Promise<string | undefined> {
  const result = await git(['rev-parse', '--git-common-dir'], workspace);
  if (result.code !== 0 || !result.stdout.trim()) return undefined;
  const commonDir = resolve(workspace, result.stdout.trim());
  return realpath(commonDir).catch(() => commonDir);
}

/**
 * Upper bound on buffered output, previously `execFile`'s `maxBuffer`.
 *
 * Chunks past the ceiling are dropped rather than truncating mid-character, so
 * a caller that hits it sees a shorter string instead of a broken code point.
 */
export const GIT_MAX_BUFFER = 16 * 1024 * 1024;

async function readAll(stream: ReadableStream<Uint8Array>, limit: number): Promise<string> {
  const decoder = new TextDecoder();
  let text = '';
  for await (const chunk of stream) {
    text += decoder.decode(chunk, { stream: true });
    if (text.length > limit) return text.slice(0, limit);
  }
  return text + decoder.decode();
}

function gitEnv(): Record<string, string | undefined> {
  const env: Record<string, string | undefined> = { ...process.env };
  for (const key of Object.keys(env)) {
    if (key.startsWith('GIT_')) delete env[key];
  }
  return env;
}
