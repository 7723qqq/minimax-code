// Shared Bun-native subprocess wrappers for the repository's scripts and tests.
//
// `Bun.spawnSync` is the only subprocess surface used here, but a raw swap of
// `node:child_process` would silently change the failure shape the call sites
// branch on. These wrappers reproduce the two shapes the repository used and
// are the single place that documents the differences:
//
//  - A failure to *start* the process (missing executable) is returned as
//    `result.error` by `spawnSync` and thrown by `execFileSync`, as before.
//    `Bun.spawn` throws in both cases, so the throw is caught and converted.
//  - A non-zero exit is a value for `spawnSync` (`result.status`) and an error
//    for `execFileSync`, whose thrown error carries `status`, `signal`,
//    `stdout` and `stderr` like the Node one did.
//  - `maxBuffer` is reported as `ENOBUFS` with `status: null` and the kill
//    signal, matching node's spawnSync shape; the excess is dropped. One real
//    deviation remains: Bun's synchronous spawn cannot kill a child mid-stream,
//    so an over-limit child runs to completion and only the result is truncated.
//  - A `timeout` is reported as `ETIMEDOUT` with `status: null` and the kill
//    signal, matching node's spawnSync result.error shape. (Node's async
//    `spawn` reports a timeout only through the exit signal, but every caller
//    here uses the synchronous surface.)
//  - `signal` mirrors `signalCode`: Bun reports a signal-terminated child
//    through a signal-derived exit code plus the signal name.
import { Buffer } from 'node:buffer';

const MAX_BUFFER_DEFAULT = 1024 * 1024;

function stdioKinds(stdio) {
  if (Array.isArray(stdio)) {
    const [stdin = 'pipe', stdout = 'pipe', stderr = 'pipe'] = stdio;
    return [stdin, stdout, stderr];
  }
  const kind = stdio ?? 'pipe';
  return [kind === 'inherit' || kind === 'ignore' ? kind : 'pipe',
    kind === 'inherit' || kind === 'ignore' ? kind : 'pipe',
    kind === 'inherit' || kind === 'ignore' ? kind : 'pipe'];
}

function decode(value, encoding) {
  if (value == null) return encoding ? '' : Buffer.alloc(0);
  const buffer = Buffer.isBuffer(value) ? value : Buffer.from(value);
  return encoding ? buffer.toString(encoding) : buffer;
}

/**
 * Build a platform-shell argv, because Bun's subprocess surface does not
 * implement a `shell` option. On Windows the payload doubles embedded quotes
 * (`""`) and trailing backslashes, and the whole line is wrapped in a quote
 * pair that `cmd /s` strips; the caller must spawn it with
 * `windowsVerbatimArguments: true` (spawnSync below forces it for the shell
 * path). This matches `quoteCmdShellArg` in `packages/tui/src/host/
 * external-editor.ts`. POSIX segments with whitespace are single-quoted.
 */
function shellArgv(command, args) {
  const quote = (part) => {
    if (!/["\s]/u.test(part)) return part;
    if (process.platform === 'win32')
      return `"${part.replaceAll('"', '""').replace(/(\\+)$/u, '$1$1')}"`;
    return `'${part.replaceAll("'", "'\\''")}'`;
  };
  const line = [command, ...args].map(quote).join(' ');
  return process.platform === 'win32'
    ? ['cmd.exe', '/d', '/s', '/c', `"${line}"`]
    : ['/bin/sh', '-c', line];
}

export function spawnSync(command, args = [], options = {}) {
  const [stdin, stdout, stderr] = stdioKinds(options.stdio);
  const maxBuffer = options.maxBuffer ?? MAX_BUFFER_DEFAULT;
  const cmd = options.shell ? shellArgv(command, args) : [command, ...args];
  const started = performance.now();
  try {
    const result = Bun.spawnSync({
      cmd,
      cwd: options.cwd,
      env: options.env,
      stdin,
      stdout,
      stderr,
      timeout: options.timeout,
      killSignal: options.killSignal,
      windowsHide: options.windowsHide,
      // The shell path builds its payload by hand and needs it passed verbatim
      // (no re-quoting); direct callers keep their own choice, e.g. tests that
      // pre-wrap a cmd.exe `/c` payload in libuv's form.
      windowsVerbatimArguments: options.shell ? true : options.windowsVerbatimArguments,
      detached: options.detached,
    });
    const elapsed = performance.now() - started;
    let error;
    let status = result.exitCode;
    let signal = result.signalCode ?? null;
    let out = decode(result.stdout, options.encoding);
    let err = decode(result.stderr, options.encoding);
    const outLength = Buffer.isBuffer(out) ? out.length : Buffer.byteLength(out);
    const errLength = Buffer.isBuffer(err) ? err.length : Buffer.byteLength(err);
    if (options.timeout && status === null && elapsed >= options.timeout) {
      error = new Error(`spawnSync ${command} ETIMEDOUT`);
      error.code = 'ETIMEDOUT';
      error.syscall = `spawnSync ${command}`;
      status = null;
      signal = options.killSignal ?? 'SIGTERM';
    } else if (outLength > maxBuffer || errLength > maxBuffer) {
      error = new Error('maxBuffer exceeded');
      error.code = 'ENOBUFS';
      status = null;
      signal = options.killSignal ?? 'SIGTERM';
      if (Buffer.isBuffer(out)) out = out.subarray(0, maxBuffer);
      else out = out.slice(0, maxBuffer);
      if (Buffer.isBuffer(err)) err = err.subarray(0, maxBuffer);
      else err = err.slice(0, maxBuffer);
    }
    return {
      pid: result.pid ?? undefined,
      status,
      signal,
      stdout: out,
      stderr: err,
      error,
    };
  } catch (cause) {
    return {
      pid: undefined,
      status: null,
      signal: null,
      stdout: decode(null, options.encoding),
      stderr: decode(null, options.encoding),
      error: cause,
    };
  }
}

export function execFileSync(file, args = [], options = {}) {
  const result = spawnSync(file, args, options);
  if (result.error) {
    // Carry the node-style failure context on every thrown error, including
    // the synthesized ETIMEDOUT/ENOBUFS shapes above.
    result.error.status = result.status;
    result.error.signal = result.signal;
    result.error.stdout = result.stdout;
    result.error.stderr = result.stderr;
    throw result.error;
  }
  if (result.status !== 0) {
    const error = new Error(
      `${file} ${args.join(' ')} exited with code ${String(result.status)}`,
    );
    error.status = result.status;
    error.signal = result.signal;
    error.stdout = result.stdout;
    error.stderr = result.stderr;
    throw error;
  }
  return result.stdout;
}
