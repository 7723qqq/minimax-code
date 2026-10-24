#!/usr/bin/env bun
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';

import { configureMcodeToolsChildEnvironment } from './mcode-tools-environment.js';

configureMcodeToolsChildEnvironment();

/**
 * Location of the embedded mcode-tools CLI.
 *
 * Two layouts have to work. In a source or npm checkout the file sits beside this
 * module, so `import.meta.url` resolves it directly. In a compiled executable
 * `import.meta.url` points inside the image (`B:/~BUN/root/...`), where no such
 * file exists, and the build places `embedded/` next to the executable instead —
 * so the fallback walks from `process.execPath`.
 *
 * The lookup stays dynamic on purpose: `embedded/mcode-tools/cli.mjs` is produced
 * by the build after esbuild has finished, so it cannot be a static import.
 */
function resolveEmbeddedEntry(): string {
  const besideModule = new URL('./embedded/mcode-tools/cli.mjs', import.meta.url);
  if (existsSync(besideModule)) return besideModule.href;

  const besideExecutable = pathToFileURL(
    join(dirname(process.execPath), 'embedded', 'mcode-tools', 'cli.mjs'),
  );
  if (existsSync(besideExecutable)) return besideExecutable.href;

  return besideModule.href;
}

await import(resolveEmbeddedEntry());
