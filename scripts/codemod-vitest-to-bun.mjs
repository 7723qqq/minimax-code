// Convert the repository's test files from `vitest` to `bun:test`.
//
// The conversion is mechanical on purpose: `bun:test` already provides the
// test primitives, the spies and the timer surface, so the only work is
// rewriting the import and renaming the API calls. Files that need behaviour
// the conversion cannot express — module replacement in particular — are
// reported and left for a manual rewrite.
//
// Usage:
//   bun scripts/codemod-vitest-to-bun.mjs            # rewrite in place
//   bun scripts/codemod-vitest-to-bun.mjs --check    # report only
import { readFileSync, writeFileSync } from 'node:fs';
import { globSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const check = process.argv.includes('--check');

// `vi.*` members that `bun:test` exposes under a different name.
const renames = new Map([
  ['vi.fn', 'mock'],
  ['vi.spyOn', 'spyOn'],
  ['vi.useFakeTimers', 'jest.useFakeTimers'],
  ['vi.useRealTimers', 'jest.useRealTimers'],
  ['vi.advanceTimersByTime', 'jest.advanceTimersByTime'],
  ['vi.advanceTimersToNextTimer', 'jest.advanceTimersToNextTimer'],
  ['vi.runAllTimers', 'jest.runAllTimers'],
  ['vi.runOnlyPendingTimers', 'jest.runOnlyPendingTimers'],
  ['vi.getTimerCount', 'jest.getTimerCount'],
  ['vi.clearAllTimers', 'jest.clearAllTimers'],
  ['vi.isFakeTimers', 'jest.isFakeTimers'],
  ['vi.restoreAllMocks', 'jest.restoreAllMocks'],
  ['vi.clearAllMocks', 'jest.clearAllMocks'],
  ['vi.resetAllMocks', 'jest.resetAllMocks'],
]);

// Members that live in `test/bun-test-setup.ts`.
const helpers = new Map([
  ['vi.mocked', 'mocked'],
  ['vi.waitFor', 'waitFor'],
  ['vi.stubEnv', 'stubEnv'],
  ['vi.unstubAllEnvs', 'unstubAllEnvs'],
  ['vi.stubGlobal', 'stubGlobal'],
  ['vi.unstubAllGlobals', 'unstubAllGlobals'],
  ['vi.advanceTimersByTimeAsync', 'advanceTimersByTimeAsync'],
]);

// Members with no Bun equivalent that need a manual rewrite.
const manual = ['vi.mock', 'vi.hoisted', 'vi.resetModules', 'vi.importActual'];

// The names `bun:test` exports that the suite imports from `vitest` today.
const bunTestExports = new Set([
  'afterAll',
  'afterEach',
  'beforeAll',
  'beforeEach',
  'describe',
  'expect',
  'it',
  'test',
  'expectTypeOf',
]);

const files = globSync('{packages,test}/**/*.{test,spec}.{ts,mts,cts,mjs}', {
  cwd: root,
});

const report = { converted: [], manual: [], skipped: [] };

for (const relative of files) {
  const file = path.join(root, relative);
  const source = readFileSync(file, 'utf8');
  if (!/from\s+['"]vitest['"]/.test(source)) {
    report.skipped.push(relative);
    continue;
  }

  let next = source;
  const needed = new Set();
  const unresolved = new Set();

  // Rewrite the import itself. `vi` is not a Bun export, so it is removed and
  // the members it provided are routed to their Bun or helper equivalents.
  //
  // The replacement is built with a function, so `$` sequences in the source
  // are never interpreted as replacement patterns.
  next = next.replace(
    /import\s*\{([^}]*)\}\s*from\s*(['"])vitest\2\s*;?/g,
    (whole, body) => {
      const names = body
        .split(',')
        .map((part) => part.trim())
        .filter(Boolean);
      const keep = [];
      for (const name of names) {
        if (name === 'vi') continue;
        if (bunTestExports.has(name)) keep.push(name);
        else unresolved.add(name);
      }
      if (unresolved.size > 0) {
        throw new Error(
          `Unsupported vitest import in ${relative}: ${[...unresolved].join(', ')}`,
        );
      }
      if (keep.length === 0) return '';
      return `import { ${keep.join(', ')} } from 'bun:test';`;
    },
  );

  // Route each `vi.*` member. The pattern requires a word boundary after the
  // member so `vi.fn(` never matches inside a longer identifier.
  const used = new Set();
  for (const [from, to] of [...renames, ...helpers]) {
    const pattern = new RegExp(`\\b${from.replaceAll('.', '\\.')}\\b`, 'g');
    if (!pattern.test(next)) continue;
    next = next.replace(pattern, to);
    used.add(to);
  }
  for (const member of manual) {
    if (new RegExp(`\\b${member.replaceAll('.', '\\.')}\\b`).test(next)) {
      unresolved.add(member);
    }
  }

  // `vi` used on its own: a chained call split across lines (`vi\n  .fn()`),
  // or a `typeof vi.fn` reference. Both name the `vi` namespace itself, which
  // `bun:test` does not export, so the namespace is mapped onto `mock` — the
  // Bun export that provides the same factory function.
  const bareVi = /(^|[^.\w])vi(\s*\.\s*fn|\s*<|\s*[,)\];])/m;
  if (bareVi.test(next)) {
    next = next.replace(/(^|[^.\w])vi(\s*\.\s*fn)/gm, '$1mock$2');
    next = next.replace(/(^|[^.\w])vi(\s*<)/gm, '$1mock$2');
    next = next.replace(/typeof vi\.fn/g, 'typeof mock');
    used.add('mock');
  }

  // A chain that spans lines reads `vi` on one line and `.member(` on the
  // next, so the prefix and the member are separated by a line break. The
  // member names are routed to their Bun or helper equivalents.
  const multilineMember = /(^|[^.\w])vi(\s*\.\s*)(fn|spyOn|mocked|waitFor|stubEnv|stubGlobal|unstubAllEnvs|unstubAllGlobals|useFakeTimers|useRealTimers|restoreAllMocks|clearAllMocks|resetAllMocks|advanceTimersByTime|advanceTimersByTimeAsync|getTimerCount|clearAllTimers)(\s*[(<])/g;
  const memberReplacements = new Map([
    ['fn', 'mock'],
    ['mocked', 'mocked'],
    ['waitFor', 'waitFor'],
    ['stubEnv', 'stubEnv'],
    ['stubGlobal', 'stubGlobal'],
    ['unstubAllEnvs', 'unstubAllEnvs'],
    ['unstubAllGlobals', 'unstubAllGlobals'],
    ['advanceTimersByTimeAsync', 'advanceTimersByTimeAsync'],
  ]);
  next = next.replace(multilineMember, (whole, lead, gap, member, tail) => {
    const replacement = memberReplacements.get(member) ?? `jest.${member}`;
    used.add(replacement);
    return `${lead}${replacement}${tail}`;
  });

  // A chained call that spans lines reads `mock\n  .fn()`. The chain belongs to
  // the factory, so the `.fn` member is dropped and the generic argument kept.
  next = next.replace(/\bmock\s*\.\s*fn(<[^>]*>)?\(/g, 'mock$1(');

  // `mock` and `spyOn` come from `bun:test`; `jest` is the timer and spy
  // namespace Bun exposes.
  const bunNames = new Set();
  for (const name of used) {
    if (name === 'mock' || name === 'spyOn') bunNames.add(name);
    else if (name.startsWith('jest.')) bunNames.add('jest');
  }
  const helperNames = new Set();
  for (const name of used) {
    if (!bunNames.has(name) && !name.startsWith('jest.')) helperNames.add(name);
  }

  // The rewritten `vitest` import already carries the `bun:test` names, so the
  // extra ones are merged into it rather than opening a second import from the
  // same module.
  if (bunNames.size > 0) {
    next = next.replace(
      /import\s*\{([^}]*)\}\s*from\s*(['"])bun:test\2\s*;?/,
      (whole, body) => {
        const existing = body
          .split(',')
          .map((part) => part.trim())
          .filter(Boolean);
        const merged = [...new Set([...existing, ...bunNames])].sort();
        return `import { ${merged.join(', ')} } from 'bun:test';`;
      },
    );
  }
  if (helperNames.size > 0) {
    const relativeToTest = path
      .relative(path.dirname(file), path.join(root, 'test/bun-test-setup.ts'))
      .replaceAll('\\', '/')
      .replace(/\.ts$/, '.js');
    next =
      `import { ${[...helperNames].sort().join(', ')} } from '${relativeToTest}';\n${next}`;
  }

  if (unresolved.size > 0) {
    report.manual.push({ file: relative, members: [...unresolved] });
    continue;
  }

  if (next === source) {
    report.skipped.push(relative);
    continue;
  }
  report.converted.push(relative);
  if (!check) writeFileSync(file, next, 'utf8');
}

console.log(`converted: ${report.converted.length}`);
console.log(`skipped (no vitest import): ${report.skipped.length}`);
console.log(`manual rewrite needed: ${report.manual.length}`);
for (const entry of report.manual) {
  console.log(`  ${entry.file}: ${entry.members.join(', ')}`);
}
if (!check) {
  console.log('\nrewrite these files by hand:');
  for (const entry of report.manual) console.log(`  ${entry.file}`);
}
