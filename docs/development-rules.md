# Development rules

Rules for changing this repository. Each rule names the file that owns the decision, the command that enforces it, or both. This document does not restate `AGENTS.md` or `CONTRIBUTING.md`; it records decisions those files did not yet cover. When a rule here and a tool disagree, the tool wins and this document is the defect.

## How binding is each rule

Read every rule through its enforcement label. Only one label is machine-checked.

| Label | Meaning | What happens if you break it |
| --- | --- | --- |
| **Enforced** | A gate fails. | `bun run verify` goes red; you cannot merge without fixing it or changing the gate. |
| **Convention** | Nothing fails. A reviewer may reject it. | Only human review catches it. |
| **Recommendation** | My judgement from the audit, not a project requirement. | Nothing fails, and a reviewer may legitimately disagree. |

No gate in `scripts/verify.mjs` checks package layering, dependency cycles, shebang text, or the choice between a `node:` import and a Bun API. Those rules are therefore **convention**, and their authority comes from reviewer agreement, not from tooling. If a rule matters enough that a mistake must be impossible, it needs a gate — propose one through the "Add a verification gate" row below rather than relying on this document.

The Bun runtime policy below is **binding by decision**, even though no gate checks it yet: it settles what to do, and a change that violates it is a defect to fix, not a judgement call to discuss.

Where a rule is labelled **Recommendation**, replacing it is a way to spend maintenance effort, not a way to fix a bug: an optimization can reasonably be deferred. Where a rule is **Enforced** or **binding by decision**, deferring it leaves a known defect standing.

## Package layering and dependency direction

**Enforced (partly):** `check:source` verifies that `release/extraction.json` `packageRoots` and the root `package.json` `workspaces` stay identical. **Convention:** the tiers below.

Dependencies form a strict downward lattice. A package may depend only on a lower tier or a tier-0 leaf. The repository has no cycles today; adding one is a design error that no gate reports.

| Tier | Packages |
| --- | --- |
| 0 | `@mavis/shared`, `@mavis/protocol`, `@mavis/background-task`, `@mavis/conversation-contract`, `@mavis/mcp`, `@mavis/oauth-core`, `@mavis/oauth-lease-protocol`, `@mavis/plugin-hooks`, `@mavis/session-report`, `@mavis/skills`, `@mavis/system-reminder`, `@earendil-works/pi-ai`, `@earendil-works/pi-tui`, `@minimax/mcode-sandbox-runtime` |
| 1 | `@mavis/config`, `@mavis/browser-core`, `@mavis/mcode-tools-host`, `@earendil-works/pi-agent-core` |
| 2 | `@earendil-works/pi-coding-agent` |
| 3 | `@mavis/agent-core` |
| 4 | `@mavis/agent-runtime`, `@mavis/context-manager`, `@mavis/cron`, `@mavis/goal`, `@mavis/permission`, `@mavis/runaway-guard` |
| 5 | `@mavis/agent-tools`, `@mavis/agent-extension` |
| 6 | `@mavis/local-runtime` |
| 7 | `@mavis/local-runtime-v2` |
| 8 | `@minimax/code` (`packages/tui`) |

Rules that follow from the table:

- `packages/tui` is the only product entry point and sits at the top. Nothing may depend on `@minimax/code`; everything product-facing flows the other way. **Enforced** indirectly: `@minimax/code` exports only `./package.json`, so a reverse dependency has no module to import.
- `local-runtime` and `local-runtime-v2` are **serial** layers, not alternatives. V2 depends on V1 for host facilities; V1 must never import V2. **Convention.** Say so in review when a change moves a symbol between them.
- A tier-0 package may not import a higher tier. `@mavis/shared` and `@mavis/protocol` importing anything product-shaped is a review reject. **Convention.**
- `@mavis/agent-extension` is an aggregation layer. Add a module there only when it composes several `packages/agent-modules/*` packages; single-module behavior belongs in the module. **Convention.**

Vendored trees (`third_party/pi-mono/packages/*`, `third_party/sandbox-runtime`) are upstream code with their own licenses and their own test suites. First-party packages may depend on them; they may not depend on first-party packages, and their tests are outside `test/vitest-suites.json` by design. **Convention**, and cheap to keep because vendored builds do not see first-party sources.

## Standalone build boundary

**Enforced.** `check:standalone` reads `dist/metafile.json`, not the source tree. It enforces two things:

1. No input from `scripts/lib/retired-sources.mjs` `retiredBuildInputs` appears in the build.
2. Every path in its `required` list is emitted with `bytesInOutput > 0`.

Because `required` lists source paths, a moved file must be updated there in the same change, or the gate fails with the path named.

Adding a capability means adding its entry point to the `required` list. **This one is convention with a real cost**: the gate cannot know about a capability nobody listed for it, so a refactor can drop it from the bundle while every gate stays green. Add it in the same change as the capability.

`retired-sources.mjs` declares two sets with different domains. Keep them separate: `retiredSourceRoots` must not exist as public source (`check:source`), `nonBundledSources` may exist but must not reach the bundle (`check:standalone`). A path belongs to exactly one set. `retiredBuildInputs` is the union, so a path cannot lose its bundle restriction by later becoming publishable.

Do not restore a retired path and do not delete a capability to make a gate pass. `AGENTS.md` "Boundaries" is the governing rule.

## Runtime and package tooling

**Binding policy (decided 2026-10-25, no exceptions): this repository runs entirely on Bun — every command, script, test, and tool.** Use the Bun-native surface where one exists, and fall back to Bun's own bundled `node:` implementation where no Bun-native API exists. This is a requirement, not a preference.

The runtime is Bun 1.4.4 (`package.json` `packageManager`). `bun.lock` is the only lockfile and the only dependency-resolution authority.

1. **Commands.** Every operating instruction runs through `bun` or `bun run`: script execution is `bun <script>`, package scripts are `bun run <script>`, tests are `bun test`, dependency installation is `bun install --frozen-lockfile`. No instruction, example, or command may name a different runtime or package manager.
2. **APIs.** Use the Bun-native surface where one exists: `Bun.spawn` / `Bun.spawnSync` for subprocesses, `bun:sqlite` for SQLite, `Bun.CryptoHasher` for digests (including `copy()` for prefix states and `base64url` output), and `Bun.file`, `Bun.which`, `Bun.hash` where they cover the need.
3. **Fallback.** Where Bun has no native API, import the `node:` module — Bun's own bundled implementation of that surface. That covers `node:path`, `node:fs`, `node:fs/promises`, `node:crypto`, `node:os`, `node:url`, `node:module` (`createRequire`), `node:util`, `node:buffer`, `node:stream`, `node:net`, `node:events`, `node:timers/promises`, `node:string_decoder`, `node:async_hooks` (`AsyncLocalStorage` and the async-id probes have no Bun-native counterpart), `node:readline` (Bun 1.4.4 exposes only `text()` and `stream()` on `Bun.file`, with no streaming line reader), and `node:child_process` **type** imports (`ChildProcess`, `SpawnOptions`, `ExecFileException`), which stay until a Bun type surface replaces them. `node:test` and `node:assert` stay for the same reason: `bun test` already runs them, and changing a test's framework is not part of changing its runtime. Importing these is the sanctioned route, not a compromise to portability.
4. **Shebangs.** First-party entry points use `#!/usr/bin/env bun`. Any other shebang on a first-party entry is a defect: the built CLI cannot execute on another runtime at all, because `bun:sqlite` is declared external and the bundle carries `bun:` specifiers. `tools/plugins/validate-plugin.mjs` is invoked as `bun tools/plugins/validate-plugin.mjs <plugin>`.
5. **The package registry's publish CLI is confined to the publish flow.** It appears only in `scripts/publish-cli-release.mjs`, `scripts/release-cli.mjs`, `scripts/package-cli-release.mjs`, `scripts/verify-cli-release.mjs`, `docs/releasing.md`, and the publish job of `.github/workflows/cli-release.yml`, and only to publish the package and verify that published install. End-user installation and removal instructions everywhere else use `bun install --global` and `bun remove --global`. The updater's interop with installations made through other package managers resolves their CLI entry points (for example `npm-cli.js`) as files and runs them under the current runtime; generated helpers that external tooling loads keep a `node:`-require surface so any runtime can consume them. That is interop with what the updater finds on the machine, not guidance to use another toolchain, and it never justifies naming one in an instruction.
6. **`node:child_process` call shapes.** `packages/local-runtime-v2/src/service/miniapp/process/node-runtime/` keeps the `node:child_process` spawn surface because that directory exists to reproduce the process semantics the miniapp runtimes target. Every other runtime call uses `Bun.spawn` / `Bun.spawnSync`; synchronous script and test call sites go through `scripts/lib/exec.mjs`, which preserves the failure shapes (start-error result, throw-on-nonzero, `maxBuffer`) those callers branch on.

`bun tools/migrations/node-to-bun.mjs` prefers the Bun-native surface over Bun's `node:` compatibility layer. Bun implements the `node:` modules itself, so code importing them already runs on Bun; the tool rewrites only the mechanical drop-ins — entry shebangs, digest constructors whose algorithm and string/Buffer HMAC key the 1.4.4 binding accepts, `engines`, and `undici/index.js` imports — and reports what needs a decision: subprocesses, `.cmd` shims, digest options, runtime-version labels, and install commands outside the publish flow. `--direction bun-to-node` is an inventory of Bun-only surfaces, not a supported backport.

A comment or document that directs the reader to another runtime or package manager, or claims that one is required, is a defect to fix. There is no category of file that keeps such text on purpose.

### Deprecating a `node:` surface

When a change replaces a `node:` runtime call with a Bun-native one, note the behavioral difference in a comment at the call site (sync result shape, throw-instead-of-error, signalled-child reporting) rather than leaving a silent swap. Type-only imports do not need this.

### Test network guards

A guard injected into a child process must **prove it is active**.

Bun does not honor `--import` from `NODE_OPTIONS`. A test that injects a guard that way observes an unguarded child, and its "no network access" assertion becomes vacuously true. `test/smoke.test.mjs` and `test/byok.test.mjs` inject the guard as an explicit `--preload` argument on every CLI child for that reason; a new test that shells out must do the same. Assert a positive signal from the guard itself — a marker line, a loaded flag, or a deliberately blocked request — rather than the absence of an audit file.

The general form of the rule: when a test's evidence is "nothing happened", add a probe showing the thing that would have noticed. This is **enforced by convention** today; consider a gate if the class recurs.

## Single sources of truth

Each concern has exactly one owner. Edit the owner, then run its generator or check; never edit a consumer by hand.

| Concern | Owner | Enforcement |
| --- | --- | --- |
| Package scope | `release/extraction.json` `packageRoots` | `bun run check:source` |
| Export subpath → source file | each package's `exports` | `bun run check:tsconfig` |
| Test files per gate | `test/vitest-suites.json` | `bun run check:source` |
| Retired paths | `scripts/lib/retired-sources.mjs` | `check:source`, `check:standalone` |
| Verification pipeline | `scripts/verify.mjs` | `bun run verify` |
| Documentation-only classification | `scripts/ci-changes.mjs` | `test:release-tools` |
| Published file inventory | `release/public-source.json` | `bun run check:source` |
| Shared paths and constants | `scripts/lib/*.mjs` | review |

Two gaps in that enforcement, which review must cover because no gate does:

- `suiteInventoryViolations` scans only `packages/**` for undeclared `*.test.*` files. A test file added directly under `test/` that is not declared in `test/vitest-suites.json` and not named by a `package.json` gate will never run and will not be reported. Declare it.
- `release/dependency-licenses.json` has no generator in this repository. It is a reviewed inventory. Changing dependencies means reviewing and updating it by hand; do not claim it was regenerated.

## Common changes

Each row lists every file that must change. Missing one leaves a gate red or a file silently unpublished.

| Change | Files | Commands |
| --- | --- | --- |
| Add a workspace package | root `package.json` `workspaces`; `release/extraction.json` `packageRoots`; the package's `package.json` with `exports` | `bun install`, then `bun run gen:tsconfig`, then `bun scripts/source-inventory.mjs --write` |
| Add or change an export subpath | the package's `package.json` `exports` | `bun run gen:tsconfig` |
| Add a test file | the path in the correct group of `test/vitest-suites.json` | `bun run check:source`, then the owning gate |
| Add a verification gate | a step in `scripts/verify.mjs` with `platforms` when it is not universal; a `package.json` script if the step uses `script` | `bun run verify --list`, then `bun run verify` |
| Add a standalone capability | the entry-point path in `required` inside `scripts/check-standalone-boundary.mjs` | `bun run build`, then `bun run check:standalone` |
| Retire a source path | the correct set in `scripts/lib/retired-sources.mjs` | `bun run check:source`, `bun run check:standalone` |
| Add a published file | nothing, if content only | `bun scripts/source-inventory.mjs --write` |

Do not add gate steps to a workflow file. `scripts/verify.mjs` is the only pipeline definition; CI calls `bun run verify` with a profile.

## Generated files

Do not edit these by hand.

| File | Regenerate | Check |
| --- | --- | --- |
| `release/public-source.json` | `bun scripts/source-inventory.mjs --write` | `bun run check:source` |
| `tsconfig.standalone.json` `paths` | `bun run gen:tsconfig` | `bun run check:tsconfig` |

Recording a file in the inventory does not make it suitable for publication. Review the added, removed, and renamed entries in the diff and keep only files that belong in the release. Content-only edits to already-published files do not need regeneration. The inventory scans the working tree including untracked files outside its exclusions, so keep review material, verification reports, and temporary artifacts outside the repository.

## Branches and pull requests

Branch from the default branch and open a pull request; never push to the default branch. Name branches by purpose in lowercase kebab-case: `feat/`, `fix/`, `docs/`, `refactor/`, `test/`, `chore/`. Do not use agent or tool names, including `codex/`.

A pull request states the change, the checks that ran, and the boundaries that were not tested. Use `PASS`, `FAIL`, and `NOT_RUN` for the actual checks; never describe an unrun check as passing. Apply the change-type and product labels, and `perf:full` when `CONTRIBUTING.md` "Performance checks" requires it.

Never merge internal history or cherry-pick internal commits. Advance `release/extraction.json` `sourceRevision` only after reviewing every difference for the selected revision.

## Pre-submit verification

Run individual gates while iterating and the complete profile on the reviewed commit.

```bash
bun run verify --list      # gates that apply on this platform
bun run typecheck
bun run build
bun run check:standalone   # requires a current build
bun run verify             # clean tracked working tree, reviewed commit
```

Source export reads committed `HEAD` and rejects uncommitted tracked changes, so a full `bun run verify` cannot run in a dirty tree. Run the affected individual gates during editing and state that the full profile was not run, instead of implying it passed.

`bun run test:bun` without arguments runs every declared group, including platform-scoped ones. On Windows and macOS that includes groups whose gates `scripts/verify.mjs` deliberately excludes, so a bare `test:bun` failure there is expected and is not evidence of a regression. Use the owning gate, such as `bun run test:capabilities` or `bun run test:windows`.

`bun run check:plugin` validates a Plugin directory, not this repository. Run it as `bun tools/plugins/validate-plugin.mjs path/to/plugin`; pointing it at the repository root only scans `node_modules`.

### What the report must say

Report the command, the exit code, and the first failing assertion or error line for every failure, and classify it as environment or code. Report the revision and platform.

Passing gates are offline evidence with synthetic inputs. They do not establish:

- live-service behavior: OAuth, Token Plan, BYOK endpoints, web search, the plugin catalog, connectors, or tool leases;
- cross-platform behavior for gates excluded on the current host, such as the POSIX permission facade and the macOS seatbelt sandbox;
- packaging paths that require another operating system, such as registry archive installation, or a tag and release run;
- that a passing test asserts what its name claims. A guard that never loads makes "no network access" true by accident, so state which mechanism proved the tested property.

Name the untested boundaries explicitly. "Verified" means the named command ran and passed on the named host.
