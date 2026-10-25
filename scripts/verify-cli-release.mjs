import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { versionFromTag } from './lib/cli-release.mjs';

/**
 * Run npm through `npm-cli.js` and the current runtime instead of the `npm`
 * shim: the shim's `node` shebang would drag Node into a Bun-only toolchain,
 * while the npm CLI itself is plain JavaScript the running runtime executes.
 */
function resolveNpmCliInvocation() {
  const besideRuntime = path.join(path.dirname(process.execPath), 'node_modules', 'npm', 'bin', 'npm-cli.js');
  if (existsSync(besideRuntime)) return { runtime: process.execPath, npmCli: besideRuntime };
  const shim = execFileSync(process.platform === 'win32' ? 'where' : 'which', [
    process.platform === 'win32' ? 'npm.cmd' : 'npm',
  ], { encoding: 'utf8' }).trim().split(/\r?\n/u)[0];
  if (shim) {
    const besideShim = path.join(path.dirname(realpathSync(shim)), 'node_modules', 'npm', 'bin', 'npm-cli.js');
    if (existsSync(besideShim)) return { runtime: process.execPath, npmCli: besideShim };
  }
  throw new Error('npm-cli.js could not be located for the release verification');
}

const root = fileURLToPath(new URL('../', import.meta.url));
const version = versionFromTag(process.env.MCODE_RELEASE_TAG);
if (!process.env.MCODE_RELEASE_ARCHIVE) throw new Error('MCODE_RELEASE_ARCHIVE is required.');
if (!['linux', 'darwin'].includes(process.platform)) throw new Error('Package validation currently supports Linux and macOS.');
const archive = path.resolve(process.env.MCODE_RELEASE_ARCHIVE);
const sha256 = createHash('sha256').update(readFileSync(archive)).digest('hex');
assert.equal(readFileSync(`${archive}.sha256`, 'utf8'), `${sha256}  ${path.basename(archive)}\n`, 'Release archive checksum mismatch');
const revision = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
const temporary = mkdtempSync(path.join(tmpdir(), 'mcode-package-install-'));
try {
  // No global install or real user profile is modified. Dependencies and the
  // generated npm launcher must resolve from this fresh installation alone.
  const prefix = path.join(temporary, 'install');
  const home = path.join(temporary, 'home');
  mkdirSync(home);
  const env = {
    ...process.env, HOME: home, USERPROFILE: home,
    MINIMAX_DATA_DIR: path.join(home, 'data'), MAVIS_DATA_DIR: path.join(home, 'data'),
    MCODE_DISABLE_TELEMETRY: '1',
  };
  for (const name of Object.keys(env)) {
    if (/^npm_config_/i.test(name)) delete env[name];
  }
  Object.assign(env, {
    npm_config_cache: path.join(temporary, 'npm-cache'),
    npm_config_userconfig: path.join(home, '.npmrc'),
  });
  delete env.NODE_PATH;
  delete env.NODE_OPTIONS;
  const { runtime, npmCli } = resolveNpmCliInvocation();
  execFileSync(runtime, [npmCli, 'install', '--global', '--prefix', prefix,
    '--registry=https://registry.npmjs.org/', '--include=optional', '--ignore-scripts=false',
    '--allow-scripts=@minimax-ai/code', '--no-audit', '--no-fund', archive],
  { cwd: home, env, stdio: 'inherit', timeout: 300000 });
  const installed = path.join(prefix, 'lib/node_modules/@minimax-ai/code');
  const release = JSON.parse(readFileSync(path.join(installed, 'release.json'), 'utf8'));
  assert.equal(release.version, version);
  assert.equal(release.tag, process.env.MCODE_RELEASE_TAG);
  assert.equal(release.revision, revision);
  const result = execFileSync(path.join(prefix, 'bin/mcode'), ['--version'], { cwd: home, env, encoding: 'utf8', timeout: 30000 });
  assert.equal(result.trim(), version);
  const require = createRequire(path.join(installed, 'package.json'));
  // `bun:sqlite` is a Bun builtin, so the better-sqlite3 addon-load check of the
  // Node era is covered by the Bun-launched `bin/mcode` run above. The Bun
  // version is recorded so the release publisher can pin it to the matrix.
  const bunVersion = execFileSync('bun', ['--version'], { encoding: 'utf8', timeout: 30000 }).trim();
  assert.match(bunVersion, /^\d+\.\d+\.\d+$/);
  assert.match(execFileSync(require('@vscode/ripgrep').rgPath, ['--version'], { encoding: 'utf8' }), /ripgrep/);
  execFileSync(process.execPath, [path.join(root, 'scripts/run-bun-tests.mjs'), 'test/smoke.test.mjs', 'test/byok.test.mjs'], {
    cwd: root, env: { ...env, MCODE_TEST_CLI: path.join(installed, 'cli.js') }, stdio: 'inherit', timeout: 240000,
  });
  if (process.env.MCODE_VERIFY_REPORT_DIR) {
    mkdirSync(process.env.MCODE_VERIFY_REPORT_DIR, { recursive: true });
    writeFileSync(path.join(process.env.MCODE_VERIFY_REPORT_DIR, 'package-install.json'), JSON.stringify({
      status: 'PASS', version, revision, sha256, platform: process.platform, arch: process.arch, node: process.version, bun: bunVersion,
    }, null, 2) + '\n');
  }
  console.log(`Verified npm installation of ${path.basename(archive)} (${sha256}).`);
} finally {
  rmSync(temporary, { recursive: true, force: true });
}
