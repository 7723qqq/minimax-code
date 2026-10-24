// Compare Node-native idioms against Bun-native idioms for the operations this
// migration touches. The CLI itself is Bun-only after the SQLite migration, so
// this measures the runtimes' own APIs rather than app startup. This is a local
// measurement tool, not a CI gate.
//
//   bun scripts/perf/bun-native-bench.mjs [--runs 5] [--json out.json]
//
// Every sample runs in a fresh child process so JIT state and module caches do
// not leak between Node and Bun.
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const args = process.argv.slice(2);
const valueOf = (name, fallback) => {
  const index = args.indexOf(name);
  return index === -1 ? fallback : args[index + 1];
};
const runs = Number(valueOf('--runs', '5'));
const jsonOut = valueOf('--json', undefined);
const node = process.execPath;
const bun = process.env.BUN_BIN?.trim() || 'bun';
const work = mkdtempSync(path.join(tmpdir(), 'mcode-native-bench-'));

function median(values) {
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.floor(sorted.length / 2)];
}

function sample(runtime, argv, environment) {
  const started = performance.now();
  const result = spawnSync(runtime, argv, {
    cwd: root,
    env: { ...process.env, ...environment },
    encoding: 'utf8',
  });
  const wallMs = performance.now() - started;
  if (result.status !== 0) {
    throw new Error(
      `${path.basename(runtime)} failed (${String(result.status)}): ${result.stderr.trim()}`,
    );
  }
  const lines = result.stdout.trim().split('\n');
  const last = lines.at(-1) ?? '{}';
  let reported;
  try {
    reported = JSON.parse(last);
  } catch {
    reported = { ms: wallMs };
  }
  return { wallMs, reported };
}

function measure(runtime, argv, environment) {
  const samples = [];
  for (let index = 0; index < runs; index += 1) samples.push(sample(runtime, argv, environment));
  return {
    operationMs: median(samples.map((entry) => entry.reported.ms ?? entry.wallMs)),
    wallMs: median(samples.map((entry) => entry.wallMs)),
  };
}

const rows = [];
function record(name, nodeSpec, bunSpec, environment) {
  try {
    const nodeResult = measure(node, nodeSpec, environment);
    const bunResult = measure(bun, bunSpec, environment);
    rows.push({
      name,
      nodeMs: nodeResult.operationMs,
      bunMs: bunResult.operationMs,
      nodeWallMs: nodeResult.wallMs,
      bunWallMs: bunResult.wallMs,
    });
  } catch (error) {
    rows.push({ name, error: error.message });
  }
}

const sqliteBunScript = `
const { Database } = require('bun:sqlite');
const db = new Database(process.env.BENCH_DB);
db.exec('PRAGMA journal_mode = WAL');
db.exec('DROP TABLE IF EXISTS t');
db.exec('CREATE TABLE t(a INTEGER, b TEXT)');
const insert = db.prepare('INSERT INTO t VALUES (?, ?)');
const transaction = db.transaction(() => {
  for (let index = 0; index < 5000; index += 1) insert.run(index, 'row-' + index);
});
const started = performance.now();
transaction();
const result = db.prepare('SELECT COUNT(*) AS count FROM t').get();
const ms = performance.now() - started;
db.close();
console.log(JSON.stringify({ ms, count: result.count }));
`;
const sqliteNodeScript = `
const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync(process.env.BENCH_DB);
db.exec('PRAGMA journal_mode = WAL');
db.exec('DROP TABLE IF EXISTS t');
db.exec('CREATE TABLE t(a INTEGER, b TEXT)');
const insert = db.prepare('INSERT INTO t VALUES (?, ?)');
const started = performance.now();
db.exec('BEGIN IMMEDIATE');
for (let index = 0; index < 5000; index += 1) insert.run(index, 'row-' + index);
db.exec('COMMIT');
const result = db.prepare('SELECT COUNT(*) AS count FROM t').get();
const ms = performance.now() - started;
db.close();
console.log(JSON.stringify({ ms, count: result.count }));
`;
record('SQLite 5k insert + count', ['-e', sqliteNodeScript], ['-e', sqliteBunScript], {
  BENCH_DB: path.join(work, 'bench.sqlite'),
});

const largeFile = (() => {
  try {
    return readdirSync(path.join(root, 'dist', 'chunks'))
      .map((name) => path.join(root, 'dist', 'chunks', name))
      .sort((left, right) => statSync(right).size - statSync(left).size)[0];
  } catch {
    return undefined;
  }
})();
if (largeFile) {
  record(
    'read 100x large chunk',
    [
      '-e',
      `
const { readFileSync } = require('node:fs');
const file = process.env.BENCH_FILE;
const started = performance.now();
let bytes = 0;
for (let index = 0; index < 100; index += 1) bytes += readFileSync(file).length;
console.log(JSON.stringify({ ms: performance.now() - started, bytes }));
`,
    ],
    [
      '-e',
      `
const file = process.env.BENCH_FILE;
const started = performance.now();
let bytes = 0;
for (let index = 0; index < 100; index += 1) bytes += (await Bun.file(file).arrayBuffer()).byteLength;
console.log(JSON.stringify({ ms: performance.now() - started, bytes }));
`,
    ],
    { BENCH_FILE: largeFile },
  );
}

record(
  'spawn 20x current runtime',
  [
    '-e',
    `
const { spawnSync } = require('node:child_process');
const started = performance.now();
for (let index = 0; index < 20; index += 1) {
  const result = spawnSync(process.execPath, ['-e', '0'], { stdio: 'ignore' });
  if (result.status !== 0) throw new Error('child failed');
}
console.log(JSON.stringify({ ms: performance.now() - started }));
`,
  ],
  [
    '-e',
    `
const started = performance.now();
for (let index = 0; index < 20; index += 1) {
  const child = Bun.spawn({ cmd: [process.execPath, '-e', '0'], stdout: 'ignore', stderr: 'ignore' });
  const code = await child.exited;
  if (code !== 0) throw new Error('child failed');
}
console.log(JSON.stringify({ ms: performance.now() - started }));
`,
  ],
);

record(
  'list 2k+ TS files',
  [
    '-e',
    `
const { readdirSync } = require('node:fs');
const path = require('node:path');
const started = performance.now();
let count = 0;
const walk = (directory) => {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '.git') continue;
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(target);
    else if (entry.name.endsWith('.ts')) count += 1;
  }
};
walk(path.join(process.cwd(), 'packages', 'tui', 'src'));
console.log(JSON.stringify({ ms: performance.now() - started, count }));
`,
  ],
  [
    '-e',
    `
const glob = new Bun.Glob('packages/tui/src/**/*.ts');
const started = performance.now();
let count = 0;
for await (const file of glob.scan({ cwd: process.cwd(), onlyFiles: true })) count += 1;
console.log(JSON.stringify({ ms: performance.now() - started, count }));
`,
  ],
);

const markdown = [
  '| Benchmark | Node (ms) | Bun (ms) | Node/Bun |',
  '| --- | ---: | ---: | ---: |',
  ...rows.map((row) =>
    row.error
      ? `| ${row.name} | — | — | ${row.error.replaceAll('|', '\\|')} |`
      : `| ${row.name} | ${row.nodeMs.toFixed(2)} | ${row.bunMs.toFixed(2)} | ${(row.nodeMs / row.bunMs).toFixed(2)}x |`,
  ),
].join('\n');

console.log(markdown);
if (jsonOut) writeFileSync(path.resolve(jsonOut), `${JSON.stringify({ runs, rows }, null, 2)}\n`);
rmSync(work, { recursive: true, force: true });
