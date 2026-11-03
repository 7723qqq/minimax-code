#!/usr/bin/env bun
// Thin launcher: run the `mcode` bin of @minimax-ai/code with the given args.
// Exists because @minimax-ai/code ships two bins, so a single-command runner
// invoking `@minimax-ai/code acp` cannot pick one. The launcher runs on Bun —
// the same runtime the CLI itself requires — so the child starts with
// `process.execPath` and no other runtime is ever launched. The `node:` imports
// are the sanctioned fallback: Bun ships its own implementation of
// fs/module/os/path.
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import os from 'node:os';
import { dirname, resolve } from 'node:path';

const require = createRequire(import.meta.url);
const pkgPath = require.resolve('@minimax-ai/code/package.json');
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
const bin = typeof pkg.bin === 'string' ? pkg.bin : pkg.bin?.mcode;
if (!bin) {
  console.error('code-acp: @minimax-ai/code has no "mcode" bin');
  process.exit(1);
}
const entry = resolve(dirname(pkgPath), bin);

// Bun.spawn replaces the child_process spawn: a start failure throws here
// instead of arriving through an error event, and `exited` settles with a
// signal-derived code where the exit event carried a signal name.
let child;
try {
  child = Bun.spawn({
    cmd: [process.execPath, entry, ...process.argv.slice(2)],
    stdin: 'inherit',
    stdout: 'inherit',
    stderr: 'inherit',
    windowsHide: true,
  });
} catch (err) {
  console.error(`code-acp: failed to start mcode: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
}

for (const sig of ['SIGINT', 'SIGTERM', 'SIGHUP']) {
  process.on(sig, () => {
    try { child.kill(sig); } catch {}
  });
}

void child.exited.then((code) => {
  const signal = child.signalCode;
  if (signal) {
    for (const s of ['SIGINT', 'SIGTERM', 'SIGHUP']) process.removeAllListeners(s);
    try {
      process.kill(process.pid, signal);
    } catch {}
    // Fallback if self-signal is unsupported (e.g. Windows): 128 + signo.
    process.exit(128 + ((os.constants.signals)[signal] ?? 0));
  }
  process.exit(code ?? 1);
});
