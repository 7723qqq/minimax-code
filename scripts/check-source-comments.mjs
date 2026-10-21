import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

import { readExtraction } from "./lib/release-metadata.mjs";

// Source comments are written in English. Product strings are not: localized
// copy, bundled runtime prompts and skill examples keep the language their
// behaviour requires, so this gate inspects comments only and never string,
// template or regular-expression contents.
//
// The repository is also the reviewed public projection of an internal
// monorepo, so comment language is part of the review surface: a Chinese note
// added here would reach publication without an English counterpart.

const root = fileURLToPath(new URL("../", import.meta.url));

/** Script-identification range covering Han, Hangul and Kana ideographs. */
export const CJK_PATTERN =
  /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uac00-\ud7af\u{20000}-\u{2ffff}]/u;

/** Only workspace sources are in scope; third_party keeps its upstream text. */
const SOURCE_DIRECTORY = "src";
const SOURCE_FILE = /\.(?:ts|tsx)$/u;
const SKIPPED_DIRECTORIES = new Set(["node_modules", "dist", ".git"]);

/**
 * Paths whose text may legitimately be Chinese, and why the gate still passes.
 *
 * Only `src` trees under `release/extraction.json` `packageRoots` are walked,
 * and only comment trivia is inspected, so most of these need no exemption at
 * all. The list exists so the boundary is reviewable rather than implied:
 *
 *  - i18n catalogs (`shared/src/i18n/runtime-catalog.zh-Hans.ts`,
 *    `tui/.../copy.zh-Hans.ts`, the `zh` object in `status-line-copy.ts`) keep
 *    their translations in string literals, which the scanner never reports;
 *    a Chinese *comment* there is still a violation, because comments are
 *    English by policy;
 *  - bundled runtime prompts and `packages/local-runtime/assets/skills/**`
 *    live outside any `src` directory and are not walked;
 *  - `third_party/**` is vendored upstream code with its own language policy,
 *    and is listed in `packageRoots`, so it is skipped explicitly below;
 *  - test fixtures keep Chinese assertions; tests are outside the walked `src`
 *    trees, and `*.test.ts` files under `src` are excluded by filename.
 */
export const COMMENT_LANGUAGE_EXEMPTIONS = Object.freeze([
  { path: "third_party/", reason: "vendored upstream code" },
  { path: "packages/local-runtime/assets/", reason: "bundled skill assets" },
]);

const TEST_FILE = /\.(?:test|spec)\.[cm]?[jt]sx?$/u;

function listSourceFiles(directory) {
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (SKIPPED_DIRECTORIES.has(entry.name)) continue;
    const current = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...listSourceFiles(current));
    else if (SOURCE_FILE.test(entry.name)) files.push(current);
  }
  return files;
}

/**
 * Return the comment trivia in one TypeScript source.
 *
 * The language scanner is used rather than a regular expression so a `//`
 * inside a string, template literal or regular expression is not mistaken for
 * a comment, and so an apostrophe inside a comment does not desynchronize the
 * scan.
 */
export function readComments(text) {
  const scanner = ts.createScanner(ts.ScriptTarget.Latest, false, ts.LanguageVariant.Standard, text);
  const comments = [];
  for (;;) {
    const token = scanner.scan();
    if (token === ts.SyntaxKind.EndOfFileToken) return comments;
    if (
      token !== ts.SyntaxKind.SingleLineCommentTrivia &&
      token !== ts.SyntaxKind.MultiLineCommentTrivia
    )
      continue;
    const start = scanner.getTokenPos();
    comments.push({
      start,
      text: scanner.getTokenText(),
      line: text.slice(0, start).split("\n").length,
    });
  }
}

function isExempt(relativePath) {
  return COMMENT_LANGUAGE_EXEMPTIONS.some((entry) => relativePath.startsWith(entry.path));
}

/**
 * Scan every first-party `src` tree for Chinese text in comments.
 *
 * Returns `{ file, line, text }` entries; an empty array means the tree is
 * clean. Exported so the release-tool tests can assert the behaviour instead of
 * re-implementing the scanner.
 */
export function findChineseComments(options = {}) {
  const repositoryRoot = options.root ?? root;
  const packageRoots = options.packageRoots ?? readExtraction(repositoryRoot).packageRoots;
  const violations = [];
  for (const packageRoot of packageRoots) {
    const sourceRoot = path.join(repositoryRoot, packageRoot, SOURCE_DIRECTORY);
    let files;
    try {
      files = listSourceFiles(sourceRoot);
    } catch {
      // A package may legitimately have no `src` directory.
      continue;
    }
    for (const file of files) {
      if (TEST_FILE.test(file)) continue;
      const relativePath = path.relative(repositoryRoot, file).split(path.sep).join("/");
      if (isExempt(relativePath)) continue;
      const text = readFileSync(file, "utf8");
      for (const comment of readComments(text)) {
        if (!CJK_PATTERN.test(comment.text)) continue;
        violations.push({
          file: relativePath,
          line: comment.line,
          text: comment.text.trim().slice(0, 120),
        });
      }
    }
  }
  return violations;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const violations = findChineseComments();
  if (violations.length > 0) {
    console.error("Source comments must be written in English:");
    for (const violation of violations)
      console.error(`  ${violation.file}:${String(violation.line)}: ${violation.text}`);
    console.error(
      "\nTranslate the comment to English. Localized product strings, i18n catalogs, " +
        "bundled runtime prompts and skill assets are out of scope and must stay unchanged.",
    );
    process.exit(1);
  }
  console.log("Source comment language passed: no Chinese comments in first-party sources.");
}
