/**
 * Git invocation shared by the review modules.
 *
 * `Bun.spawn` replaces `promisify(execFile)` so the runtime's own subprocess
 * surface is used, and so every review path reads Git output the same way.
 *
 * A slow first call is expected on Windows: spawning a native executable
 * directly (no shell) costs one multi-second wait per process before the
 * runtime settles, after which the same spawn is fast. That is an upstream
 * runtime characteristic, not a property of this wrapper, so it is documented
 * rather than worked around — routing Git through `cmd /c` would change argument
 * quoting for every caller to buy back a one-time cost.
 */

const GIT_MAX_BUFFER = 16 * 1024 * 1024;

export interface GitExecResult {
  stdout: string;
  stderr: string;
  code: number;
}

/**
 * Runs Git and buffers its output.
 *
 * A non-zero exit is reported on the result rather than thrown, matching the
 * `execFile` behaviour callers already branch on; a failure to start the
 * process rejects, because every current caller treats that as fatal.
 */
export async function execGit(
  workspace: string,
  args: readonly string[],
): Promise<GitExecResult> {
  const child = Bun.spawn({
    cmd: ['git', ...args],
    cwd: workspace,
    stdin: 'ignore',
    stdout: 'pipe',
    stderr: 'pipe',
  });
  const [stdout, stderr, code] = await Promise.all([
    readAll(child.stdout, GIT_MAX_BUFFER),
    readAll(child.stderr, GIT_MAX_BUFFER),
    child.exited,
  ]);
  return { stdout, stderr, code };
}

/**
 * Runs Git and returns only its standard output.
 *
 * Rejects on a non-zero exit so a caller can translate a missing object or an
 * absent repository into its own error type, which is what the previous
 * `await execFileAsync(...)` plus `catch` blocks did.
 */
export async function execGitStdout(
  workspace: string,
  args: readonly string[],
): Promise<string> {
  const result = await execGit(workspace, args);
  if (result.code !== 0) {
    throw new Error(
      `git ${args[0] ?? ''} failed with exit ${result.code}: ${result.stderr.trim()}`,
    );
  }
  return result.stdout;
}

/**
 * Upper bound on buffered output, previously `execFile`'s `maxBuffer`.
 *
 * Chunks past the ceiling are dropped rather than truncating mid-character, so
 * a caller that hits it sees a shorter string instead of a broken code point.
 * The stream is still drained to EOF afterwards: stopping the reads would let
 * the child block on a full pipe and never exit, and `execGit` awaits
 * `child.exited` alongside this read.
 */
async function readAll(stream: ReadableStream<Uint8Array>, limit: number): Promise<string> {
  const decoder = new TextDecoder();
  let text = '';
  let capped = false;
  for await (const chunk of stream) {
    if (capped) continue;
    text += decoder.decode(chunk, { stream: true });
    if (text.length > limit) {
      text = text.slice(0, limit);
      capped = true;
    }
  }
  if (!capped) text += decoder.decode();
  return text;
}
