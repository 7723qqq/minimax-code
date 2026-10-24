// Run one declared suite group from test/vitest-suites.json under `bun test`.
//
// The declared suites are the single source of truth for both the gate names
// and their files. The suites import `bun:sqlite` and spawn the CLI with the
// running runtime, so Node can no longer load them; scripts/run-bun-tests.mjs
// drives `bun test` over the same files with the repository's preload and
// tsconfig overrides. This entry point keeps the historical
// `run-vitest-suite.mjs <group>` contract used by package.json and
// scripts/verify.mjs.
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { suiteFiles, repositoryRoot } from "./lib/vitest-suites.mjs";

const name = process.argv[2];
if (!name) throw new Error("Usage: bun scripts/run-vitest-suite.mjs <suite>");
const files = suiteFiles(repositoryRoot, name);
if (files.length === 0) throw new Error(`Unknown suite: ${name}`);

const inActions = process.env.GITHUB_ACTIONS === "true";
const result = spawnSync(
  process.execPath,
  [path.join(repositoryRoot, "scripts", "run-bun-tests.mjs"), ...files.map((file) => `./${file.replaceAll("\\", "/")}`)],
  {
    // Actions logs are not readable from every environment, so a failing suite
    // is captured and its tail re-emitted as an annotation. Local runs keep
    // streaming output unchanged.
    stdio: inActions ? ["inherit", "pipe", "pipe"] : "inherit",
    cwd: repositoryRoot,
    ...(inActions ? { maxBuffer: 64 * 1024 * 1024 } : {}),
  },
);
if (inActions) {
  const stdout = result.stdout?.toString() ?? "";
  const stderr = result.stderr?.toString() ?? "";
  if (stdout) process.stdout.write(stdout);
  if (stderr) process.stderr.write(stderr);
  if ((result.status ?? 1) !== 0) {
    const tail = (stderr || stdout).slice(-3000);
    const escaped = tail.replace(/%/gu, "%25").replace(/\r/gu, "").replace(/\n/gu, "%0A");
    console.error(`::error title=Suite ${name} failed under bun test::${escaped}`);
  }
}
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
