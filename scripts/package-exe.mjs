// Package MiniMax Code as one executable from the official npm artifact.
//
//   pnpm build (MCODE_RELEASE_TAG)     dist (ESM, chunked)
//   package-cli-release.mjs            minimax-code-<version>.tar.gz
//   extracted package  ->  one CommonJS main  ->  SEA blob with every asset
//   embedded  ->  postject injects the blob into a copy of node.exe
//
// Building from the npm archive keeps one source of truth: the executable
// carries exactly the files `npm install minimax-code-<version>.tar.gz` would
// place on disk. That flow requires a clean committed tree, so
// `--from-dist` packages the current working-tree build instead for iteration.
//
// The CLI derives its package root from `import.meta.url` and then reads by
// path, so the bundle is rewritten to point at a synthetic root and the entry
// banner answers those paths from `node:sea`. Only files the platform must see
// on disk (native addons, spawned helpers) are written to a versioned cache
// under %LOCALAPPDATA%\mcode\sea-<version>.
//
// Usage: node scripts/package-exe.mjs [--out <dir>] [--skip-build] [--from-dist]
//
// `--out` defaults to `dist-exe`, which is already ignored by Git and sits
// outside `dist/` so the npm archive never embeds a previous executable.
// `--skip-build` reuses an existing `dist/` when only the packaging changed.
// `--from-dist` skips the npm archive and packages `dist/` directly.
import { build } from "esbuild";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { x as extractTar } from "tar";
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  realpathSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const args = process.argv.slice(2);
const valueOf = (name) => {
  const index = args.indexOf(name);
  return index === -1 ? undefined : args[index + 1];
};
const skipBuild = args.includes("--skip-build");
const fromDist = args.includes("--from-dist");
const scriptRoot = fileURLToPath(new URL("../", import.meta.url));
const repo = path.resolve(valueOf("--repo") ?? scriptRoot);
const outDir = path.resolve(valueOf("--out") ?? path.join(repo, "dist-exe"));

if (process.platform !== "win32") {
  // The synthetic root and the native-binding cache path below are Windows
  // facts; a POSIX build would need its own root and cache directory.
  throw new Error("scripts/package-exe.mjs currently packages Windows executables only");
}

const rootVersion = JSON.parse(readFileSync(path.join(repo, "package.json"), "utf8")).version;
const tag = "v" + rootVersion;

// Intermediate files live outside the repository: `--out` may sit inside
// `dist/`, and copying `dist` into a directory beneath itself is invalid.
const workDir = mkdtempSync(path.join(tmpdir(), "mcode-sea-"));

if (!skipBuild) {
  const buildResult = spawnSync(process.execPath, [path.join(repo, "scripts", "build.mjs")], {
    stdio: "inherit",
    cwd: repo,
    // The npm flow stamps version and gitHead from the release tag; without it
    // `package-cli-release.mjs` refuses the build it is handed.
    env: fromDist ? process.env : { ...process.env, MCODE_RELEASE_TAG: tag },
  });
  if (buildResult.status !== 0) throw new Error("build exited " + String(buildResult.status));
}

let sourceRoot = repo;
if (fromDist) {
  if (!existsSync(path.join(repo, "dist", "cli.js"))) {
    throw new Error("dist/cli.js is missing; run `pnpm build` or drop --skip-build");
  }
} else {
  // Build from the official npm archive so the executable carries the same
  // files a tar.gz installation would. That packaging requires a clean
  // committed tree at the revision the build was stamped with.
  //
  // A previous `--out dist/exe` left an executable inside `dist/`, and the npm
  // packaging would copy it into the archive, embedding a whole executable in
  // the blob. Refuse rather than ship that.
  if (existsSync(path.join(repo, "dist", "exe"))) {
    throw new Error(
      "dist/exe from an earlier run would be embedded in the npm archive; remove it or pass --out outside dist/",
    );
  }
  const archiveDir = path.join(workDir, "npm");
  mkdirSync(archiveDir, { recursive: true });
  const packaged = spawnSync(
    process.execPath,
    [path.join(repo, "scripts", "package-cli-release.mjs"), tag, archiveDir],
    { stdio: "inherit", cwd: repo },
  );
  if (packaged.status !== 0) {
    throw new Error(
      "npm packaging exited " +
        String(packaged.status) +
        "; it requires a clean committed tree and a build stamped with MCODE_RELEASE_TAG (use --from-dist to package the working tree instead)",
    );
  }
  const archive = path.join(archiveDir, "minimax-code-" + rootVersion + ".tar.gz");
  sourceRoot = path.join(workDir, "package");
  mkdirSync(sourceRoot, { recursive: true });
  await extractTar({ file: archive, cwd: sourceRoot, strip: 1 });
}

// The npm archive keeps the runtime files at the package root (`cli.js`,
// `chunks/`, `assets/`), matching an installed package; `dist/` is the same
// layout under the source build. Both are staged under the synthetic `dist/`
// directory the bundle expects.
const payloadRoot = fromDist ? path.join(repo, "dist") : sourceRoot;
const version = JSON.parse(readFileSync(path.join(payloadRoot, "package.json"), "utf8")).version;
const SYNTHETIC_ROOT = "C:\\__mcode_sea__";
const SYNTHETIC_URL = "file:///C:/__mcode_sea__/dist/cli.js";
const SENTINEL_FUSE = "NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2";
const EXTERNALS = [
  "better-sqlite3",
  "@mariozechner/clipboard",
  "@vscode/ripgrep",
  "@larksuiteoapi/node-sdk",
];

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

// 1. Rewrite the ESM output so it compiles as CommonJS.
const stageDist = path.join(workDir, "stage", "dist");
cpSync(payloadRoot, stageDist, { recursive: true });

function listFiles(directory, predicate = () => true) {
  const found = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const current = path.join(directory, entry.name);
    if (entry.isDirectory()) found.push(...listFiles(current, predicate));
    else if (predicate(current)) found.push(current);
  }
  return found;
}

let rewritten = 0;
for (const file of listFiles(stageDist, (file) => file.endsWith(".js"))) {
  const original = readFileSync(file, "utf8");
  const next = original
    .replaceAll("import.meta.url", "globalThis.__MCODE_SEA_URL__")
    .replace(
      /\}await l\(\);\s*$/u,
      "}l().catch((e)=>{process.stderr.write(String(e && e.stack ? e.stack : e) + String.fromCharCode(10));process.exitCode=1});" +
        String.fromCharCode(10),
    );
  if (next !== original) rewritten += 1;
  writeFileSync(file, next);
}
console.log("rewrote " + String(rewritten) + " bundle files for CommonJS");

// 2. Runtime banner: runs before any bundled module.
const banner = `"use strict";
const __sea_ = (() => { try { return require("node:sea"); } catch { return null; } })();
const __fs_ = require("node:fs");
const __path_ = require("node:path");
const __os_ = require("node:os");
const __url_ = require("node:url");
const __Module_ = require("node:module");
const ROOT = ${JSON.stringify(SYNTHETIC_ROOT)};
const CACHE = process.env.MCODE_SEA_CACHE || __path_.join(process.env.LOCALAPPDATA || __os_.tmpdir(), "mcode", "sea-${version}");
globalThis.__MCODE_SEA_URL__ = ${JSON.stringify(SYNTHETIC_URL)};
const embedded = new Map();
if (__sea_ && __sea_.isSea && __sea_.isSea()) {
  for (const key of __sea_.getAssetKeys()) embedded.set(key, __sea_.getRawAsset(key));
}
function toPath(value) {
  if (typeof value === "string") return value;
  try { return value instanceof URL ? __url_.fileURLToPath(value) : null; } catch { return null; }
}
const ROOT_PREFIX = __path_.resolve(ROOT).toLowerCase() + __path_.sep;
function relativeKey(value) {
  const target = toPath(value);
  if (target === null) return null;
  const normalized = __path_.resolve(target).toLowerCase();
  if (!normalized.startsWith(ROOT_PREFIX)) return null;
  return normalized.slice(ROOT_PREFIX.length).split(__path_.sep).join("/");
}
const loggedMissingAssets = new Set();
// Windows resolves paths case-insensitively, so persona.md finds PERSONA.md on
// disk. The asset map has to emulate that, and several loaders also derive a
// root from dirname(cli.js)/.. and then look for assets/, configs/ and friends
// there instead of under dist/.
const embeddedLower = new Map();
for (const key of embedded.keys()) embeddedLower.set(key.toLowerCase(), key);
function assetBytes(key) {
  const found =
    embedded.get(key) ??
    embedded.get(embeddedLower.get(key.toLowerCase())) ??
    embedded.get(embeddedLower.get(("dist/" + key).toLowerCase()));
  if (found === undefined) {
    if (process.env.MCODE_SEA_DEBUG === "1" && !loggedMissingAssets.has(key)) {
      loggedMissingAssets.add(key);
      process.stderr.write("mcode-sea: miss " + key + String.fromCharCode(10));
    }
    return null;
  }
  return Buffer.from(found);
};
function wantsDirents(options) {
  return Boolean(options && typeof options === "object" && options.withFileTypes);
}
function direntFor(name, isDirectory) {
  return { name: name, parentPath: "", path: "", isFile: () => !isDirectory, isDirectory: () => isDirectory, isSymbolicLink: () => false, isBlockDevice: () => false, isCharacterDevice: () => false, isFIFO: () => false, isSocket: () => false };
}
function childNamesFor(key) {
  const prefix = key === "" ? "" : key + "/";
  const names = [];
  const seenNames = new Set();
  for (const assetKey of embedded.keys()) {
    if (!assetKey.startsWith(prefix)) continue;
    const remainder = assetKey.slice(prefix.length);
    if (remainder.length === 0) continue;
    const name = remainder.split("/")[0];
    if (seenNames.has(name)) continue;
    seenNames.add(name);
    names.push(name);
  }
  return names;
}
function direntsFor(key, names, options) {
  if (!wantsDirents(options)) return names;
  const prefix = key === "" ? "" : key + "/";
  return names.map((name) =>
    direntFor(name, embeddedLower.has((prefix + name).toLowerCase()) ? false : true),
  );
}
function decodeAsset(bytes, options) {
  const encoding =
    typeof options === "string"
      ? options
      : options && typeof options === "object"
        ? options.encoding
        : undefined;
  return encoding ? bytes.toString(encoding) : bytes;
}
function materialize(key) {
  const target = __path_.join(CACHE, key);
  if (__fs_.existsSync(target)) return target;
  const bytes = assetBytes(key);
  if (bytes === null) return null;
  __fs_.mkdirSync(__path_.dirname(target), { recursive: true });
  __fs_.writeFileSync(target, bytes);
  return target;
}
const MUST_BE_FILE = /\\.(node|exe|wasm)$/i;
const ALWAYS_REAL = new Set(["dist/image-preview-worker.js", "dist/mcode-tools.js", "dist/matrix-mcp-stdio.js"]);
function realPathFor(value) {
  const key = relativeKey(value);
  if (key === null) return null;
  if (MUST_BE_FILE.test(key) || ALWAYS_REAL.has(key)) return materialize(key);
  return null;
}
const originalReadFileSync = __fs_.readFileSync;
__fs_.readFileSync = function (target, ...rest) {
  const real = realPathFor(target);
  if (real !== null) return originalReadFileSync(real, ...rest);
  const key = relativeKey(target);
  const bytes = key === null ? null : assetBytes(key);
  if (bytes !== null) return decodeAsset(bytes, rest[0]);
  return originalReadFileSync(target, ...rest);
};
const originalExistsSync = __fs_.existsSync;
__fs_.existsSync = function (target) {
  const key = relativeKey(target);
  if (key !== null && (embedded.has(key) || originalExistsSync(__path_.join(CACHE, key)))) return true;
  return originalExistsSync(target);
};
const originalStatSync = __fs_.statSync;
__fs_.statSync = function (target, ...rest) {
  const real = realPathFor(target);
  if (real !== null) return originalStatSync(real, ...rest);
  const key = relativeKey(target);
  if (key !== null && embedded.has(key)) {
    const size = assetBytes(key).length;
    return { size: size, isFile: () => true, isDirectory: () => false, mtimeMs: 0 };
  }
  return originalStatSync(target, ...rest);
};
const originalReaddirSync = __fs_.readdirSync;
__fs_.readdirSync = function (target, ...rest) {
  const key = relativeKey(target);
  if (key !== null) {
    const names = childNamesFor(key);
    if (names.length > 0) return direntsFor(key, names, rest[0]);
  }
  return originalReaddirSync(target, ...rest);
};
const __fsp_ = __fs_.promises;
const __origFspReadFile = __fsp_.readFile;
__fsp_.readFile = async function (target, ...rest) {
  const real = realPathFor(target);
  if (real !== null) return __origFspReadFile.call(__fsp_, real, ...rest);
  const key = relativeKey(target);
  const bytes = key === null ? null : assetBytes(key);
  if (bytes !== null) return decodeAsset(bytes, rest[0]);
  return __origFspReadFile.call(__fsp_, target, ...rest);
};
const __origFspAccess = __fsp_.access;
__fsp_.access = async function (target, ...rest) {
  const key = relativeKey(target);
  if (key !== null && (embedded.has(key) || __fs_.existsSync(__path_.join(CACHE, key)))) return undefined;
  return __origFspAccess.call(__fsp_, target, ...rest);
};
const __origFspStat = __fsp_.stat;
__fsp_.stat = async function (target, ...rest) {
  const real = realPathFor(target);
  if (real !== null) return __origFspStat.call(__fsp_, real, ...rest);
  const key = relativeKey(target);
  if (key !== null && embedded.has(key)) {
    const size = assetBytes(key).length;
    return { size: size, isFile: () => true, isDirectory: () => false, mtimeMs: 0 };
  }
  return __origFspStat.call(__fsp_, target, ...rest);
};
const __origFspReaddir = __fsp_.readdir;
__fsp_.readdir = async function (target, ...rest) {
  const key = relativeKey(target);
  if (key !== null) {
    const names = childNamesFor(key);
    if (names.length > 0) return direntsFor(key, names, rest[0]);
  }
  return __origFspReaddir.call(__fsp_, target, ...rest);
};
const materializedExternals = new Set();
const EXTERNALS = ${JSON.stringify(EXTERNALS)};
function ensureExternal(name) {
  if (materializedExternals.has(name)) return;
  const prefix = "node_modules/" + name + "/";
  for (const key of embedded.keys()) {
    if (key === "node_modules/" + name || key.startsWith(prefix)) materialize(key);
  }
  materializedExternals.add(name);
}
function loadExternal(name) {
  ensureExternal(name);
  return __Module_.createRequire(process.execPath)(__path_.join(CACHE, "node_modules", name));
}
globalThis.__MCODE_LOAD__ = loadExternal;
const originalResolve = __Module_._resolveFilename;
__Module_._resolveFilename = function (request, ...rest) {
  if (process.env.MCODE_SEA_DEBUG === "1" && String(request).indexOf("better") >= 0) process.stderr.write("mcode-sea: resolve " + String(request) + String.fromCharCode(10));
  const match = EXTERNALS.find((name) => request === name || request.startsWith(name + "/"));
  if (match !== undefined) {
    ensureExternal(match);
    const target = __path_.join(CACHE, "node_modules", request);
    if (__fs_.existsSync(target) || __fs_.existsSync(target + ".js")) {
      return originalResolve.call(this, target, ...rest);
    }
  }
  return originalResolve.call(this, request, ...rest);
};
if (__sea_ && __sea_.isSea && __sea_.isSea()) {
  // The CLI documents MAVIS_SQLITE3_MODULE_PATH as the native-binding override,
  // so unpacking that closure is enough; no module-resolution trickery.
  if (!process.env.MAVIS_SQLITE3_MODULE_PATH) {
    for (const name of ["better-sqlite3", "bindings", "file-uri-to-path"]) ensureExternal(name);
    const sqliteRoot = __path_.join(CACHE, "node_modules");
  if (!process.env.MAVIS_BUILTIN_AGENTS_V2_DIR) {
    process.env.MAVIS_BUILTIN_AGENTS_V2_DIR = __path_.join(ROOT, "dist", "assets", "agents");
  }
    if (__fs_.existsSync(__path_.join(sqliteRoot, "better-sqlite3"))) {
      process.env.MAVIS_SQLITE3_MODULE_PATH = sqliteRoot;
    }
  }
  if (process.env.MCODE_SEA_DEBUG === "1") {
    process.stderr.write("mcode-sea: cache=" + CACHE + " assets=" + String(embedded.size) +
      " sqlite=" + String(process.env.MAVIS_SQLITE3_MODULE_PATH) + String.fromCharCode(10));
  }
}
`;

const bundlePath = path.join(workDir, "app.cjs");
await build({
  entryPoints: [path.join(stageDist, "cli.js")],
  bundle: true,
  platform: "node",
  format: "cjs",
  target: "node24",
  outfile: bundlePath,
  banner: { js: banner },
  external: EXTERNALS,
  legalComments: "none",
  logLevel: "warning",
});
console.log("bundled " + (statSync(bundlePath).size / 1024 / 1024).toFixed(1) + " MiB");
let bundleText = readFileSync(bundlePath, "utf8");
for (const name of EXTERNALS) {
  bundleText = bundleText
    .split('require("' + name + '")')
    .join('globalThis.__MCODE_LOAD__("' + name + '")');
}
writeFileSync(bundlePath, bundleText);

// 3. Asset map: rewritten dist tree plus the external module closure.
function resolveFrom(fromDir, name) {
  let current = fromDir;
  for (;;) {
    const candidate = path.join(current, "node_modules", name);
    if (existsSync(path.join(candidate, "package.json"))) return realpathSync(candidate);
    const parent = path.dirname(current);
    if (parent === current) throw new Error("cannot resolve " + name + " from " + fromDir);
    current = parent;
  }
}

const assets = {};
// Only type declarations and source maps are dropped: prompt, persona and
// roster files are `.md` and are read at runtime.
const SKIP_ASSET = /\.(?:d\.ts|map)$/iu;
function addTree(root, prefix) {
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const current = path.join(root, entry.name);
    if (entry.isDirectory()) addTree(current, prefix + entry.name + "/");
    else if (!SKIP_ASSET.test(entry.name)) assets[prefix + entry.name] = current;
  }
}
addTree(stageDist, "dist/");

const seen = new Map();
function collectExternal(packageDir) {
  const manifest = JSON.parse(readFileSync(path.join(packageDir, "package.json"), "utf8"));
  if (manifest.name.startsWith("@types/")) return;
  if (seen.has(manifest.name) && seen.get(manifest.name) === packageDir) return;
  seen.set(manifest.name, packageDir);
  addTree(packageDir, "node_modules/" + manifest.name + "/");
  for (const dependency of Object.keys(manifest.dependencies ?? {})) {
    collectExternal(resolveFrom(packageDir, dependency));
  }
}
for (const name of EXTERNALS) collectExternal(resolveFrom(repo, name));
console.log("embedded " + String(Object.keys(assets).length) + " assets from " + String(seen.size) + " packages");

const seaConfigPath = path.join(workDir, "sea-config.json");
writeFileSync(
  seaConfigPath,
  JSON.stringify(
    {
      main: bundlePath,
      output: path.join(workDir, "app.blob"),
      assets: assets,
      disableExperimentalSEAWarning: true,
      useCodeCache: false,
      useSnapshot: false,
    },
    null,
    2,
  ) + "\n",
);

function run(command, args) {
  const result = spawnSync(command, args, { stdio: "inherit" });
  if (result.status !== 0) throw new Error(command + " exited " + String(result.status));
}
run(process.execPath, ["--experimental-sea-config", seaConfigPath]);
console.log("blob " + (statSync(path.join(workDir, "app.blob")).size / 1024 / 1024).toFixed(1) + " MiB");

// 4. Inject the blob into a copy of the running node.exe.
const requireFromHere = createRequire(import.meta.url);
let postjectCli;
try {
  postjectCli = requireFromHere.resolve("postject/dist/cli.js");
} catch {
  throw new Error('postject is not installed; run "pnpm install" before packaging');
}
const exePath = path.join(outDir, "mcode-" + version + ".exe");
cpSync(process.execPath, exePath);
run(process.execPath, [
  postjectCli,
  exePath,
  "NODE_SEA_BLOB",
  path.join(workDir, "app.blob"),
  "--sentinel-fuse",
  SENTINEL_FUSE,
]);
console.log("built " + exePath + " (" + (statSync(exePath).size / 1024 / 1024).toFixed(1) + " MiB)");
rmSync(workDir, { recursive: true, force: true });
