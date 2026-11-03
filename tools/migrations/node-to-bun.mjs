#!/usr/bin/env bun
// Prefer Bun-native APIs over Bun's `node:` compatibility layer.
//
// Bun ships its own implementation of the `node:` modules, so code importing
// them already runs on Bun; there is no Node runtime to port away from. This
// tool rewrites the mechanical cases where the Bun-native surface is a
// drop-in (shebangs, digest constructors, engines) and reports the places
// where Bun's `node:` implementation or Bun-native surface needs a human
// decision — subprocesses, `.cmd` shims, and runtime-version labels.
//
// Rules are grounded in Bun 1.4.4 semantics: `Bun.CryptoHasher` accepts the
// documented digest algorithms and a string/Buffer HMAC key (no KeyObject or
// CryptoKey), has no Node options argument, and `digest()` returns a Buffer in
// this release. `--direction bun-to-node` is an inventory only: `bun:sqlite`
// and `bun:test` have no Node-equivalent surface in this repository.
//
// Usage:
//   bun tools/migrations/node-to-bun.mjs                  # dry run (default)
//   bun tools/migrations/node-to-bun.mjs --write          # apply automatic rules
//   bun tools/migrations/node-to-bun.mjs --check          # exit 1 when fixes are pending
//   bun tools/migrations/node-to-bun.mjs --rules digest,shebang
//   bun tools/migrations/node-to-bun.mjs --direction bun-to-node
//   bun tools/migrations/node-to-bun.mjs --root <path> --json
//   bun tools/migrations/node-to-bun.mjs --list-rules
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = fileURLToPath(new URL('../../', import.meta.url));
const selfPath = fileURLToPath(import.meta.url);

const CODE_EXTENSIONS = new Set(['.ts', '.tsx', '.mts', '.cts', '.js', '.jsx', '.mjs', '.cjs']);
const SKIP_DIRECTORIES = new Set([
  'node_modules',
  'third_party',
  'dist',
  'dist-exe',
  '.cache',
  '.git',
  'coverage',
]);
const DEFAULT_ROOTS = [
  'packages',
  'scripts',
  'test',
  'tools',
  'examples',
  'docs',
  'README.md',
  'README_ZH.md',
  'SECURITY.md',
  'CONTRIBUTING.md',
  'AGENTS.md',
];

// Paths whose `node:child_process` use is a documented exception: the shared
// sync wrapper, the benchmark subject, and the miniapp process emulation layer.
const SANCTIONED_CHILD_PROCESS = [
  'scripts/lib/exec.mjs',
  'scripts/perf/bun-native-bench.mjs',
  'packages/local-runtime-v2/src/service/miniapp/process/node-runtime/',
];

// The publish flow may name the registry CLI (docs/development-rules.md).
const PUBLISH_ALLOWLIST = new Set([
  'docs/releasing.md',
  'scripts/publish-cli-release.mjs',
  'scripts/release-cli.mjs',
  'scripts/package-cli-release.mjs',
  'scripts/verify-cli-release.mjs',
]);

const RULES = new Map([
  [
    'shebang',
    {
      mode: 'auto',
      description: 'Rewrite first-party `#!/usr/bin/env node` entry shebangs to Bun.',
    },
  ],
  [
    'digest',
    {
      mode: 'auto',
      description: 'Replace createHash/createHmac with Bun.CryptoHasher and prune node:crypto imports.',
    },
  ],
  [
    'engines',
    {
      mode: 'auto',
      description: 'Replace engines.node with engines.bun in package.json.',
    },
  ],
  [
    'child-process',
    {
      mode: 'report',
      description: 'Report value imports of node:child_process with the repository replacement.',
    },
  ],
  [
    'undici-entry',
    {
      mode: 'auto',
      description:
        'Import undici/index.js when a module needs dispatcher members Bun\u2019s built-in module omits.',
    },
  ],
  [
    'cmd-shims',
    {
      mode: 'report',
      description: 'Report spawns of .cmd/.bat shims, which Bun cannot execute reliably.',
    },
  ],
  [
    'runtime-version',
    {
      mode: 'report',
      description: 'Report diagnostics that label process.version (Bun\u2019s Node-compat value) as Node.',
    },
  ],
  [
    'docs-commands',
    {
      mode: 'report',
      description: 'Report npm/npx/pnpm/yarn commands outside the publish allowlist.',
    },
  ],
]);

const BUN_ONLY_PATTERNS = [
  ['bun:sqlite', /\bbun:sqlite\b/],
  ['bun:test', /\bbun:test\b/],
  ['Bun.spawn', /\bBun\.spawn(?:Sync)?\b/],
  ['Bun.CryptoHasher', /\bBun\.CryptoHasher\b/],
  ['Bun.file', /\bBun\.file\b/],
  ['Bun.write', /\bBun\.write\b/],
  ['Bun.which', /\bBun\.which\b/],
  ['Bun.hash', /\bBun\.hash\b/],
  ['bun shebang', /^#!.*\bbun\b/],
  ['bun command', /\b(?:bunx|bun\s+(?:install|run|test|x))\b/],
];

function usage() {
  return [
    'Usage: bun tools/migrations/node-to-bun.mjs [options]',
    '',
    'Options:',
    '  --write                 Apply automatic rules in place (default: dry run).',
    '  --check                 Exit 1 when automatic fixes are pending.',
    '  --rules <list>          Comma-separated rule names (default: all).',
    '  --list-rules            Print rule names and exit.',
    '  --direction <name>      node-to-bun (default) or bun-to-node.',
    '  --root <path>           Scan a path instead of the repository defaults.',
    '  --json                  Emit a machine-readable report.',
    '  --help                  Show this message.',
  ].join('\n');
}

function fail(message) {
  process.stderr.write(`${message}\n\n${usage()}\n`);
  process.exit(2);
}

function parseArgs(argv) {
  const options = {
    write: false,
    check: false,
    json: false,
    listRules: false,
    help: false,
    direction: 'node-to-bun',
    rules: undefined,
    roots: [],
  };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--write') options.write = true;
    else if (argument === '--check') options.check = true;
    else if (argument === '--json') options.json = true;
    else if (argument === '--list-rules') options.listRules = true;
    else if (argument === '--help' || argument === '-h') options.help = true;
    else if (argument === '--direction') options.direction = argv[++index];
    else if (argument === '--rules') {
      options.rules = (argv[++index] ?? '')
        .split(',')
        .map((name) => name.trim())
        .filter(Boolean);
    } else if (argument === '--root') {
      const value = argv[++index];
      if (!value) fail('--root requires a path.');
      options.roots.push(path.resolve(value));
    } else {
      fail(`Unknown argument: ${argument}`);
    }
  }
  if (options.write && options.check) fail('--write and --check cannot be combined.');
  if (options.direction !== 'node-to-bun' && options.direction !== 'bun-to-node') {
    fail(`Unknown direction: ${options.direction}`);
  }
  if (options.direction === 'bun-to-node' && options.write) {
    fail('--direction bun-to-node is report-only; --write is not supported.');
  }
  const selected = options.rules ?? [...RULES.keys()];
  for (const name of selected) {
    if (!RULES.has(name)) fail(`Unknown rule: ${name}`);
  }
  options.rules = selected;
  return options;
}

function relativeTo(base, file) {
  return path.relative(base, file).replaceAll('\\', '/');
}

function* walk(target) {
  let stats;
  try {
    stats = statSync(target);
  } catch {
    return;
  }
  if (stats.isFile()) {
    yield target;
    return;
  }
  if (!stats.isDirectory() || SKIP_DIRECTORIES.has(path.basename(target))) return;
  for (const entry of readdirSync(target, { withFileTypes: true })) {
    if (entry.isDirectory() && SKIP_DIRECTORIES.has(entry.name)) continue;
    yield* walk(path.join(target, entry.name));
  }
}

function isCode(file) {
  return CODE_EXTENSIONS.has(path.extname(file));
}

function isMarkdown(file) {
  return path.extname(file) === '.md';
}

function isPackageJson(file) {
  return path.basename(file) === 'package.json';
}

function pathCandidates(file, displayRoot) {
  return [relativeTo(displayRoot, file), relativeTo(repositoryRoot, file)];
}

function isSanctionedChildProcess(file, displayRoot) {
  return pathCandidates(file, displayRoot).some((relative) =>
    SANCTIONED_CHILD_PROCESS.some((entry) =>
      entry.endsWith('/') ? relative.startsWith(entry) : relative === entry,
    ),
  );
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function quotedRanges(line) {
  const ranges = [];
  let quote;
  let start = 0;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (quote) {
      if (character === '\\') {
        index += 1;
        continue;
      }
      if (character === quote) {
        ranges.push([start, index]);
        quote = undefined;
      }
    } else if (character === '"' || character === "'") {
      quote = character;
      start = index;
    }
  }
  return ranges;
}

function insideQuotedRange(ranges, index) {
  return ranges.some(([start, end]) => index > start && index < end);
}

// A match inside a '...' or "..." literal is data (a fixture or an error
// message), never a call site.
function replaceOutsideQuotes(line, pattern, replacer) {
  const ranges = quotedRanges(line);
  return line.replace(pattern, (...args) => {
    const offset = args[args.length - 2];
    if (typeof offset === 'number' && insideQuotedRange(ranges, offset)) return args[0];
    return replacer(...args);
  });
}

function callOutsideStrings(text, name) {
  const pattern = new RegExp(`\\b${name}\\s*\\(`, 'gu');
  return text.split('\n').some((line) => {
    const trimmed = line.trimStart();
    if (trimmed.startsWith('//') || trimmed.startsWith('*')) return false;
    const ranges = quotedRanges(line);
    for (const match of line.matchAll(pattern)) {
      if (!insideQuotedRange(ranges, match.index ?? 0)) return true;
    }
    return false;
  });
}

function matchesOutsideQuotes(line, pattern) {
  const ranges = quotedRanges(line);
  const flags = pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`;
  for (const match of line.matchAll(new RegExp(pattern.source, flags))) {
    if (!insideQuotedRange(ranges, match.index ?? 0)) return true;
  }
  return false;
}

const CRYPTO_IMPORT_LINE = /^(\s*)import\s*\{([^}]*)\}\s*from\s*(['"])node:crypto\3\s*;?\s*$/u;

// The algorithms Bun 1.4.4 documents for `Bun.CryptoHasher`, normalized to
// lower case without separators. Node aliases such as `SHA-256` resolve to the
// same name in both runtimes; anything else is left for review.
const BUN_1_4_4_DIGESTS = new Set([
  'blake2b256',
  'blake2b512',
  'blake2s256',
  'md4',
  'md5',
  'ripemd160',
  'sha1',
  'sha224',
  'sha256',
  'sha384',
  'sha512',
  'sha512224',
  'sha512256',
  'sha3224',
  'sha3256',
  'sha3384',
  'sha3512',
  'shake128',
  'shake256',
]);

function isBunDigestAlgorithm(algorithm) {
  return BUN_1_4_4_DIGESTS.has(algorithm.toLowerCase().replaceAll(/[-_]/gu, ''));
}

// Lines inside comments or template literals are left alone: a fixture string
// that embeds Node code is data, not a call site. Import pruning is line-based
// for the same reason — a whole-text regex would edit fixture strings too.
function ruleDigest(file, source) {
  if (!isCode(file)) return {};
  const lines = source.split('\n');
  const rewritten = [];
  const manual = [];
  let edits = 0;
  let hmacEdits = 0;
  let inBlockComment = false;
  let inTemplate = false;

  for (const line of lines) {
    const trimmed = line.trimStart();
    if (inBlockComment) {
      if (trimmed.includes('*/')) inBlockComment = false;
      rewritten.push(line);
      continue;
    }
    if (trimmed.startsWith('/*') && !trimmed.includes('*/')) {
      inBlockComment = true;
      rewritten.push(line);
      continue;
    }
    if (trimmed.startsWith('//') || trimmed.startsWith('*')) {
      rewritten.push(line);
      continue;
    }
    const backticks = (line.match(/(?<!\\)`/g) ?? []).length;
    if (inTemplate || backticks > 0) {
      if (backticks % 2 === 1) inTemplate = !inTemplate;
      rewritten.push(line);
      continue;
    }

    let next = line;
    next = replaceOutsideQuotes(
      next,
      /(?<![.\w$])createHash\s*\(\s*(['"])([^'"]+)\1\s*\)/g,
      (whole, quote, algorithm) => {
        if (!isBunDigestAlgorithm(algorithm)) return whole;
        edits += 1;
        return `new Bun.CryptoHasher(${quote}${algorithm}${quote})`;
      },
    );
    next = replaceOutsideQuotes(
      next,
      /(?<![.\w$])createHmac\s*\(\s*(['"])([^'"]+)\1\s*,\s*((?:[^,()]|\([^()]*\))+?)\s*\)/g,
      (whole, quote, algorithm, key) => {
        if (!isBunDigestAlgorithm(algorithm)) return whole;
        edits += 1;
        hmacEdits += 1;
        return `new Bun.CryptoHasher(${quote}${algorithm}${quote}, ${key})`;
      },
    );
    rewritten.push(next);
  }

  if (edits === 0) return {};

  const importLines = rewritten.map((line) => CRYPTO_IMPORT_LINE.test(line));
  const bodyText = rewritten.filter((_line, index) => !importLines[index]).join('\n');
  const stillUsed = (name) =>
    new RegExp(`(?<![.\\w$])${escapeRegExp(name)}\\b`, 'u').test(bodyText);
  const pruned = [];
  rewritten.forEach((line, index) => {
    if (!importLines[index]) {
      pruned.push(line);
      return;
    }
    const match = CRYPTO_IMPORT_LINE.exec(line);
    const [, indent, body, quote] = match;
    if (/\bcreate(?:Hash|Hmac)\s+as\b/u.test(body)) {
      manual.push('aliased createHash/createHmac import left for review');
      pruned.push(line);
      return;
    }
    const names = body
      .split(',')
      .map((name) => name.trim())
      .filter(Boolean);
    const kept = names.filter((name) => {
      const [imported, local = imported] = name.split(/\s+as\s+/).map((part) => part.trim());
      if (imported !== 'createHash' && imported !== 'createHmac') return true;
      return stillUsed(local);
    });
    if (kept.length === names.length) {
      pruned.push(line);
      return;
    }
    if (kept.length === 0) return;
    pruned.push(`${indent}import { ${kept.join(', ')} } from ${quote}node:crypto${quote};`);
  });

  const text = pruned.join('\n');
  if (hmacEdits > 0) {
    manual.push(
      `${hmacEdits} HMAC constructor(s): Bun 1.4.4 accepts a string or Buffer key, not a KeyObject/CryptoKey`,
    );
  }
  if (callOutsideStrings(text, 'createHash')) {
    manual.push(
      'createHash call left for review (unsupported algorithm, property access, options argument, or non-literal algorithm)',
    );
  }
  if (callOutsideStrings(text, 'createHmac')) {
    manual.push(
      'createHmac call left for review (unsupported algorithm, property access, options argument, or non-literal algorithm)',
    );
  }
  return { text, edits: [`${edits} digest constructor(s)`], manual };
}

function ruleShebang(file, source) {
  if (!isCode(file)) return {};
  const match = /^#![^\n]*\n/.exec(source);
  if (!match) return {};
  const firstLine = match[0].trimEnd();
  if (!/^#!\s*\/(?:usr\/)?bin\/(?:env\s+)?node\b/.test(firstLine)) return {};
  return {
    text: `#!/usr/bin/env bun\n${source.slice(match[0].length)}`,
    edits: ['entry shebang rewritten to Bun'],
  };
}

function ruleEngines(file, source) {
  if (!isPackageJson(file)) return {};
  let manifest;
  try {
    manifest = JSON.parse(source);
  } catch {
    return { manual: ['package.json is not valid JSON; engines not inspected'] };
  }
  const engines = manifest.engines;
  if (!engines || typeof engines !== 'object' || !Object.hasOwn(engines, 'node')) return {};
  const nextEngines = {};
  for (const [name, value] of Object.entries(engines)) {
    if (name !== 'node') nextEngines[name] = value;
  }
  if (!nextEngines.bun) nextEngines.bun = '>=1.4.4';
  manifest.engines = nextEngines;
  const indentMatch = /^\{\r?\n([ \t]+)"/.exec(source);
  const indent = indentMatch?.[1] ?? 2;
  return {
    text: `${JSON.stringify(manifest, null, indent)}\n`,
    edits: ['engines.node replaced with engines.bun'],
  };
}

function ruleChildProcess(file, source, context) {
  if (!isCode(file) || isSanctionedChildProcess(file, context.displayRoot)) return {};
  const manual = [];
  for (const line of source.split('\n')) {
    const importMatch = /^import\s+((?:type\s+)?\{[^}]*\}|[^;]+?)\s+from\s+(['"])node:child_process\2/.exec(
      line.trimStart(),
    );
    if (importMatch) {
      if (/^type\s/u.test(importMatch[1])) continue;
      const names = importMatch[1]
        .replace(/^\{|\}$/g, '')
        .split(',')
        .map((name) => name.trim())
        .filter(Boolean)
        .filter((name) => !/^type\s/u.test(name))
        .map((name) => name.split(/\s+as\s+/)[0].trim());
      if (names.length === 0) continue;
      const sync = names.filter((name) => ['execFileSync', 'spawnSync', 'execSync'].includes(name));
      const asyncNames = names.filter((name) => ['spawn', 'exec', 'execFile', 'fork'].includes(name));
      const unknown = names.filter((name) => !sync.includes(name) && !asyncNames.includes(name));
      if (sync.length > 0) {
        manual.push(
          `${sync.join(', ')}: use scripts/lib/exec.mjs (preserves spawnSync/execFileSync failure shapes)`,
        );
      }
      if (asyncNames.length > 0) {
        manual.push(
          `${asyncNames.join(', ')}: use Bun.spawn/Bun.spawnSync and review the failure-shape difference`,
        );
      }
      if (unknown.length > 0) manual.push(`${unknown.join(', ')}: no automatic replacement`);
      continue;
    }
    if (/\brequire\s*\(\s*(['"])node:child_process\1\s*\)/.test(line)) {
      manual.push('require(node:child_process): use Bun.spawn or scripts/lib/exec.mjs');
    }
  }
  return { manual };
}

function ruleDocsCommands(file, source, context) {
  if (!isMarkdown(file)) return {};
  if (pathCandidates(file, context.displayRoot).some((relative) => PUBLISH_ALLOWLIST.has(relative))) {
    return {};
  }
  // Changelogs record commands as they were run at the time; rewriting the
  // history would make the entry describe a command that never happened.
  if (/^CHANGELOG\b/iu.test(path.basename(file))) return {};
  const patterns = [
    [/\bnpm\s+(?:install|i)\b/u, 'use `bun install` / `bun install --global`'],
    [/\bnpm\s+run\b/u, 'use `bun run`'],
    [/\bnpm\s+test\b/u, 'use `bun test`'],
    [/\bnpx\s+/u, 'use `bunx`'],
    [/\bpnpm\s+/u, 'use `bun`'],
    [/\byarn\s+/u, 'use `bun`'],
  ];
  const manual = [];
  source.split('\n').forEach((line, index) => {
    for (const [pattern, suggestion] of patterns) {
      if (pattern.test(line)) {
        manual.push(`line ${index + 1}: ${suggestion}`);
        return;
      }
    }
  });
  return { manual };
}

// Bun maps the bare `undici` specifier to its built-in compatibility module,
// which omits this dispatcher export. Import the package entry only when a
// module needs it; otherwise the built-in module keeps fetch and dispatchers
// on one implementation.
const UNDICI_MISSING_MEMBERS = new Set(['Socks5ProxyAgent']);

function ruleUndiciEntry(file, source) {
  if (!isCode(file)) return {};
  let edits = 0;
  const lines = source.split('\n').map((line) =>
    replaceOutsideQuotes(
      line,
      /import\s*\{([^}]*)\}\s*from\s*(['"])undici\2\s*;?/gu,
      (whole, body, quote) => {
        const names = body
          .split(',')
          .map((name) => name.trim().split(/\s+as\s+/)[0].trim())
          .filter(Boolean);
        if (!names.some((name) => UNDICI_MISSING_MEMBERS.has(name))) return whole;
        edits += 1;
        return `import { ${body.trim()} } from ${quote}undici/index.js${quote};`;
      },
    ),
  );
  if (edits === 0) return {};
  return { text: lines.join('\n'), edits: [`${edits} undici import(s) moved to undici/index.js`] };
}

function ruleCmdShims(file, source) {
  if (!isCode(file)) return {};
  const manual = [];
  const pattern = /\b(?:spawn|spawnSync|exec|execFile|execFileSync)\s*\(\s*['"][^'"]*\.(?:cmd|bat)['"]/iu;
  source.split('\n').forEach((line, index) => {
    const trimmed = line.trimStart();
    if (trimmed.startsWith('//') || trimmed.startsWith('*') || line.includes('`')) return;
    if (!matchesOutsideQuotes(line, pattern)) return;
    manual.push(
      `line ${index + 1}: .cmd/.bat shims cannot be spawned reliably; resolve npm-cli.js or run through cmd.exe`,
    );
  });
  return { manual };
}

function ruleRuntimeVersion(file, source) {
  if (!isCode(file)) return {};
  const manual = [];
  const pattern = /\bnode_?[Vv]ersion\s*:\s*process\.version\b/u;
  source.split('\n').forEach((line, index) => {
    const trimmed = line.trimStart();
    if (trimmed.startsWith('//') || trimmed.startsWith('*') || line.includes('`')) return;
    if (line.includes('bunVersion') || line.includes('versions.bun')) return;
    if (!matchesOutsideQuotes(line, pattern)) return;
    manual.push(
      `line ${index + 1}: process.version is Bun's Node-compat value; report process.versions.bun and label the runtime`,
    );
  });
  return { manual };
}

function inventoryBunOnly(file, source) {
  if (!isCode(file) && !isMarkdown(file)) return {};
  const entries = [];
  const lines = source.split('\n');
  for (const [kind, pattern] of BUN_ONLY_PATTERNS) {
    const count = lines.filter((line) => pattern.test(line)).length;
    if (count > 0) entries.push({ kind, count });
  }
  return entries.length > 0 ? { inventory: entries } : {};
}

function run(options) {
  const scanRoots = options.roots.length > 0
    ? options.roots
    : DEFAULT_ROOTS.map((entry) => path.join(repositoryRoot, entry));
  const displayRoot = options.roots.length === 1 ? options.roots[0] : repositoryRoot;
  const applicable = new Set(options.rules);
  const automatic = [];
  const manual = [];
  const inventory = [];
  let scanned = 0;
  let pendingWrites = 0;

  for (const scanRoot of scanRoots) {
    for (const file of walk(scanRoot)) {
      if (path.resolve(file) === path.resolve(selfPath)) continue;
      if (!isCode(file) && !isMarkdown(file) && !isPackageJson(file)) continue;
      scanned += 1;
      const source = readFileSync(file, 'utf8');
      const relative = relativeTo(displayRoot, file);

      if (options.direction === 'bun-to-node') {
        const result = inventoryBunOnly(file, source);
        for (const entry of result.inventory ?? []) {
          inventory.push({ file: relative, ...entry });
        }
        continue;
      }

      let next = source;
      for (const [name, rule] of RULES) {
        if (!applicable.has(name)) continue;
        const implementation = {
          shebang: ruleShebang,
          digest: ruleDigest,
          engines: ruleEngines,
          'child-process': ruleChildProcess,
          'docs-commands': ruleDocsCommands,
          'undici-entry': ruleUndiciEntry,
          'cmd-shims': ruleCmdShims,
          'runtime-version': ruleRuntimeVersion,
        }[name];
        const result = implementation(file, next, { displayRoot });
        if (result.text !== undefined && result.text !== next) {
          next = result.text;
          automatic.push({ file: relative, rule: name, edits: result.edits ?? [] });
          pendingWrites += 1;
        }
        for (const detail of result.manual ?? []) {
          manual.push({ file: relative, rule: name, detail });
        }
      }

      if (next !== source && options.write) writeFileSync(file, next, 'utf8');
    }
  }

  return {
    direction: options.direction,
    root: displayRoot,
    scanned,
    rules: options.rules,
    automatic,
    manual,
    inventory,
    pending: pendingWrites > 0,
    wrote: options.write && pendingWrites > 0,
  };
}

function printHuman(report) {
  const lines = [];
  lines.push(`direction: ${report.direction}`);
  lines.push(`scanned: ${report.scanned} file(s)`);
  if (report.direction === 'bun-to-node') {
    const total = report.inventory.reduce((sum, entry) => sum + entry.count, 0);
    lines.push(`Bun-only references: ${total}`);
    for (const entry of report.inventory) {
      lines.push(`  ${entry.file}: ${entry.kind} x${entry.count}`);
    }
    lines.push('');
    lines.push(
      'Report only: Bun implements the `node:` modules itself; this lists Bun-only surfaces, not a supported Node backport.',
    );
    return lines.join('\n');
  }
  if (report.automatic.length > 0) {
    lines.push(`${report.wrote ? 'rewritten' : 'pending'} automatic fixes:`);
    for (const entry of report.automatic) {
      lines.push(`  ${entry.file} [${entry.rule}] ${entry.edits.join('; ')}`);
    }
    if (!report.wrote) lines.push('  run again with --write to apply');
  } else {
    lines.push('automatic fixes: none');
  }
  if (report.manual.length > 0) {
    lines.push('manual review:');
    for (const entry of report.manual) {
      lines.push(`  ${entry.file} [${entry.rule}] ${entry.detail}`);
    }
  } else {
    lines.push('manual review: none');
  }
  return lines.join('\n');
}

const options = parseArgs(process.argv.slice(2));
if (options.help) {
  process.stdout.write(`${usage()}\n`);
  process.exit(0);
}
if (options.listRules) {
  for (const [name, rule] of RULES) {
    process.stdout.write(`${name} (${rule.mode}): ${rule.description}\n`);
  }
  process.exit(0);
}

const report = run(options);
process.stdout.write(`${options.json ? JSON.stringify(report, null, 2) : printHuman(report)}\n`);
if (options.check && report.pending) process.exit(1);
