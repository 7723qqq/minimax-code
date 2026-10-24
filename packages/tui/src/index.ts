#!/usr/bin/env node

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  configureTuiRuntimeEnvironment,
  resolveTuiStartupEnvironmentOption,
} from './cli/environment.js';
import { prepareMcodePrefixProcess } from './update/prefix-update.js';
import { isInternalMcodePackageName, resolveMcodePackageName } from './update/install-source.js';

/**
 * Point the runtime at the built-in Agent assets beside a compiled executable.
 *
 * In a source or npm checkout those assets are found relative to this module. In
 * an executable `import.meta.url` points inside the image, and the asset files
 * are shipped next to the binary instead, so the directory has to be named
 * explicitly. An explicit `MAVIS_BUILTIN_AGENTS_V2_DIR` always wins.
 */
function configureBundledAgentAssets(): void {
  if (process.env.MAVIS_BUILTIN_AGENTS_V2_DIR?.trim()) return;
  const besideExecutable = join(dirname(process.execPath), 'assets', 'agents');
  if (existsSync(join(besideExecutable, '_v2'))) {
    process.env.MAVIS_BUILTIN_AGENTS_V2_DIR = besideExecutable;
  }
}

async function main(): Promise<void> {
  configureBundledAgentAssets();
  const packageName = resolveMcodePackageName(fileURLToPath(import.meta.url));
  const internalPackage = isInternalMcodePackageName(packageName);
  let startupBuildEnvironment: ReturnType<typeof resolveTuiStartupEnvironmentOption>;
  try {
    startupBuildEnvironment = resolveTuiStartupEnvironmentOption(
      process.argv.slice(2),
      internalPackage,
    );
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
    return;
  }
  const { getTuiDataDirPath } = await import('./runtime/data-dir.js');
  configureTuiRuntimeEnvironment({
    dataDir: getTuiDataDirPath(),
    ...(startupBuildEnvironment ? { startupBuildEnvironment } : {}),
  });
  const prefixProcess = await prepareMcodePrefixProcess();
  try {
    const { runTuiCli } = await import('./cli/main.js');
    await runTuiCli({ allowStartupEnvironmentSelection: internalPackage });
  } finally {
    prefixProcess.remove();
  }
}

await main();
