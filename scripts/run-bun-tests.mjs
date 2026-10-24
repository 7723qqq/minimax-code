// Run the repository's declared test groups with `bun test`.
//
//   bun scripts/run-bun-tests.mjs                 # every group in test/vitest-suites.json
//   bun scripts/run-bun-tests.mjs status-contract # one declared group
//   bun scripts/run-bun-tests.mjs packages/...    # explicit files or patterns
//
// The preload registers the few matchers and helpers that `bun:test` does not
// ship. `--tsconfig-override` resolves workspace packages from source through
// the `paths` table in `tsconfig.standalone.json`.
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, realpathSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const suites = JSON.parse(readFileSync(path.join(root, 'test/vitest-suites.json'), 'utf8')).suites;
const args = process.argv.slice(2);
const passthroughIndex = args.indexOf('--');
const bunArgs = passthroughIndex === -1 ? [] : args.slice(passthroughIndex + 1);
const requested = (passthroughIndex === -1 ? args : args.slice(0, passthroughIndex)).filter(
  (value) => value.length > 0,
);

const selected = [];
if (requested.length === 0) {
  for (const files of Object.values(suites)) selected.push(...files);
} else {
  for (const value of requested) {
    if (Array.isArray(suites[value])) selected.push(...suites[value]);
    else selected.push(value);
  }
}

const files = Array.from(new Set(selected)).filter((file) => {
  const target = path.resolve(root, file);
  if (existsSync(target)) return true;
  process.stderr.write(`bun test: skipping missing path ${file}\n`);
  return false;
});
if (files.length === 0) {
  process.stderr.write('bun test: no test files selected\n');
  process.exit(2);
}

const bun = process.env.BUN_BIN?.trim() || 'bun';
// Mirror run-vitest-suite.mjs: the suites assert English product copy, so pin
// every locale source (`MCODE_LOCALE` outranks `Intl` on any host) and keep
// temporary fixtures on the canonical Windows TEMP path.
const environment = { ...process.env };
environment.MCODE_LOCALE = 'en';
environment.LANG = 'C';
environment.LANGUAGE = 'C';
environment.LC_ALL = 'C';
environment.LC_MESSAGES = 'C';
if (process.platform === 'win32') {
  environment.TEMP = environment.TMP = realpathSync.native(tmpdir());
}
const result = spawnSync(
  bun,
  [
    'test',
    // `node:test` has no default timeout; Bun defaults to 5s, which is too short
    // for the CLI-spawning suites in this repository. 60s also covers the
    // git-fixture suites on Windows, where each Bun process spawn costs a few
    // hundred milliseconds (an upstream runtime characteristic; `Bun.spawn` and
    // `execFileSync` measure the same).
    '--timeout=60000',
    '--preload',
    './test/bun-test-setup.ts',
    '--tsconfig-override',
    'tsconfig.standalone.json',
    ...bunArgs,
    ...files.map((file) => `./${file.replaceAll('\\', '/')}`),
  ],
  { cwd: root, stdio: 'inherit', env: environment },
);
if (result.error) {
  process.stderr.write(`bun test: failed to start ${bun}: ${result.error.message}\n`);
  process.exit(1);
}
process.exit(result.status ?? 1);
