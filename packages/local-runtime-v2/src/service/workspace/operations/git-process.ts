import { resolve } from 'node:path';

import { WorkspaceGitCommandError } from '../contracts.js';

const GIT_MAX_BUFFER = 16 * 1024 * 1024;

export interface GitRunResult {
  code: number;
  stdout: string;
  stderr: string;
}

export interface GitRunOptions {
  signal?: AbortSignal;
}

export interface GitStreamOptions {
  signal?: AbortSignal;
  onStdout: (chunk: string) => void;
  maxStderrBytes?: number;
}

/**
 * Runs one Git command and buffers its whole output.
 *
 * `Bun.spawn` replaces `promisify(execFile)` so the runtime's own subprocess
 * surface is used throughout. Behaviours reproduced deliberately:
 *
 *  - A failed start, or a non-zero exit, is reported as a result rather than
 *    thrown, matching the previous `execFile` catch. `Bun.spawn` throws
 *    synchronously for `ENOENT`, so that throw is caught here.
 *  - An abort signal still surfaces as an `AbortError` instead of a result,
 *    which is what callers branch on.
 *  - The workspace must be reachable before Git runs. `execFile` started Git
 *    and let it report a missing directory in its own words; `Bun.spawn`
 *    instead fails with `uv_spawn 'git'`, which names the wrong thing.
 *  - `GIT_MAX_BUFFER` is applied by `readAll` instead of by `execFile`.
 *
 * Expect the first call in a process to be slow on Windows. Spawning a native
 * executable without a shell costs one multi-second wait per process before the
 * runtime settles; every later spawn of the same shape is fast. This is an
 * upstream runtime characteristic reached through both `Bun.spawn` and
 * `node:child_process`, not something this wrapper adds, so it is recorded
 * rather than worked around: routing Git through `cmd /c` would change argument
 * quoting for every caller to buy back a cost paid once per process.
 */
export async function git(
  args: string[],
  workspace: string,
  options: GitRunOptions = {},
): Promise<GitRunResult> {
  if (options.signal?.aborted) throw abortError();
  const cwd = resolve(workspace);
  if (!(await isDirectory(cwd))) return missingWorkspace(cwd);
  try {
    const child = Bun.spawn({
      cmd: ['git', '-c', 'core.quotePath=false', '--no-optional-locks', ...args],
      cwd,
      env: gitEnv(),
      stdin: 'ignore',
      stdout: 'pipe',
      stderr: 'pipe',
    });
    const onAbort = () => child.kill();
    options.signal?.addEventListener('abort', onAbort, { once: true });
    try {
      const [stdout, stderr, code] = await Promise.all([
        readAll(child.stdout, GIT_MAX_BUFFER),
        readAll(child.stderr, GIT_MAX_BUFFER),
        child.exited,
      ]);
      if (options.signal?.aborted) throw abortError();
      return { code, stdout, stderr };
    } finally {
      options.signal?.removeEventListener('abort', onAbort);
    }
  } catch (error) {
    if (isAbortFailure(error, options.signal)) {
      throw abortError();
    }
    return {
      code: 1,
      stdout: '',
      stderr: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Runs Git without buffering stdout. Review search and untracked enumeration
 * use this path so repository-sized output never crosses a buffer ceiling.
 *
 * `Bun.spawn` streams are `ReadableStream`, so the previous `data` listeners and
 * `TextDecoder` pair collapse into `for await` reads over the same decoder.
 * Decoding keeps `stream: true` so a multi-byte character split across chunks
 * is reassembled rather than emitted as a replacement character.
 */
export async function gitStream(
  args: string[],
  workspace: string,
  options: GitStreamOptions,
): Promise<Omit<GitRunResult, 'stdout'>> {
  if (options.signal?.aborted) throw abortError();
  const cwd = resolve(workspace);
  if (!(await isDirectory(cwd))) {
    throw new Error(`workspace directory does not exist: ${cwd}`);
  }

  const child = Bun.spawn({
    cmd: ['git', '-c', 'core.quotePath=false', '--no-optional-locks', ...args],
    cwd,
    env: gitEnv(),
    stdin: 'ignore',
    stdout: 'pipe',
    stderr: 'pipe',
  });

  const stdoutDecoder = new TextDecoder();
  const stderrDecoder = new TextDecoder();
  const stderrLimit = options.maxStderrBytes ?? 64 * 1024;
  let stderr = '';
  let settled = false;

  const cleanup = () => options.signal?.removeEventListener('abort', onAbort);
  const onAbort = () => {
    child.kill();
  };
  options.signal?.addEventListener('abort', onAbort, { once: true });

  const pumpStdout = async () => {
    for await (const chunk of child.stdout) {
      if (settled) return;
      const text = stdoutDecoder.decode(chunk, { stream: true });
      if (text) options.onStdout(text);
    }
    const tail = stdoutDecoder.decode();
    if (tail && !settled) options.onStdout(tail);
  };
  const pumpStderr = async () => {
    for await (const chunk of child.stderr) {
      if (stderr.length >= stderrLimit) continue;
      stderr += stderrDecoder.decode(chunk, { stream: true });
      if (stderr.length > stderrLimit) stderr = stderr.slice(0, stderrLimit);
    }
    if (stderr.length < stderrLimit) {
      stderr += stderrDecoder.decode();
      if (stderr.length > stderrLimit) stderr = stderr.slice(0, stderrLimit);
    }
  };

  try {
    const [, , code] = await Promise.all([pumpStdout(), pumpStderr(), child.exited]);
    settled = true;
    if (options.signal?.aborted) throw abortError();
    return { code, stderr };
  } catch (error) {
    if (isAbortFailure(error, options.signal)) throw abortError();
    throw error;
  } finally {
    settled = true;
    cleanup();
    // A killed child can reject the stream reads; the caller already has its
    // answer at that point, so the pending readers are not awaited again.
    child.stdout.cancel?.().catch(() => undefined);
    child.stderr.cancel?.().catch(() => undefined);
  }
}

export function requireGitSuccess(
  result: GitRunResult,
  operation: 'diff' | 'ls-files',
): GitRunResult {
  if (result.code !== 0) {
    throw new WorkspaceGitCommandError(
      operation,
      result.code,
      (result.stderr || result.stdout).trim(),
    );
  }
  return result;
}

/**
 * Upper bound on buffered output, previously `execFile`'s `maxBuffer`.
 *
 * Chunks past the ceiling are dropped rather than truncating mid-character, so
 * a caller that hits it sees a shorter string instead of a broken code point.
 */
async function readAll(stream: ReadableStream<Uint8Array>, limit: number): Promise<string> {
  const decoder = new TextDecoder();
  let text = '';
  for await (const chunk of stream) {
    text += decoder.decode(chunk, { stream: true });
    if (text.length > limit) return text.slice(0, limit);
  }
  return text + decoder.decode();
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

function gitEnv(): Record<string, string | undefined> {
  const env: Record<string, string | undefined> = { ...process.env };
  for (const key of Object.keys(env)) {
    if (key.startsWith('GIT_')) delete env[key];
  }
  return env;
}

function abortError(): Error {
  const error = new Error('Git operation aborted');
  error.name = 'AbortError';
  return error;
}

function isAbortFailure(error: unknown, signal: AbortSignal | undefined): boolean {
  return signal?.aborted === true || (error instanceof Error && error.name === 'AbortError');
}
