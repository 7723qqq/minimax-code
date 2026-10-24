/**
 * English copy for the local-runtime permission reasons.
 *
 * These strings are the denial / confirmation reasons the local runtime hands
 * to the user (permission card, session transcript) and to the model (tool
 * denial detail). They used to be hard-coded English inside `checkers.ts` and
 * `facade.ts`, so a Chinese deployment read English reasons while every other
 * permission surface was localized.
 *
 * This catalog is the source of truth for the key shape. The zh-Hans
 * translation is typed with `satisfies`, so a missing translation is a compile
 * error rather than a blank reason at runtime.
 */
export const EN_PERMISSION_COPY = {
  'bypassImmune.networkShare':
    'Local hard safety policy blocked {tool}: direct access to the network share "{share}" is not supported from built-in or bash tools. Copy the file into a local workspace first.',
  'bypassImmune.rootRecursiveDelete':
    'Local hard safety policy blocked {tool}: recursive deletion targets a root or home directory, which is unrecoverable. Target a specific sub-path instead of "/", a drive root, or the home directory.',
  'policy.webFetchApproval':
    "Local permission check requires approval: web_fetch will request {url} from this device's local network context.",
  'policy.webFetchApprovalNoUrl':
    "Local permission check requires approval: web_fetch will request a URL from this device's local network context.",
  'policy.websiteDeployApproval':
    'Local permission check requires approval: website_deploy publishes files to a public endpoint on this device network context.',
  'policy.sensitiveCredentialPath':
    'Local hard safety policy blocked {tool}: sensitive credential path in {path}',
  'ask.curlPipeShell': 'Local permission check requires approval: curl-pipe-shell command.',
  'ask.shellSubstitution':
    'Local permission check requires approval: shell substitution in bash command.',
  'ask.slowUnboundedScan':
    'Local permission check requires approval: slow unbounded filesystem scan.',
  'ask.recursiveRm': 'Local permission check requires approval: recursive rm command.',
  'ask.workspaceEscape':
    'Local permission check requires approval: {tool} path escapes workspace ({target}).',
  'deletion.trashUnavailable':
    'Local hard safety policy blocked deletion: the Windows mavis-trash launcher is unavailable ({reason}). The agent must not fall back to a permanent delete command. {instruction}',
  'deletion.untrustedTrashLauncher':
    'Local hard safety policy blocked deletion: bare or non-canonical mavis-trash is untrusted because PATH/CWD may select a different executable. The target was not deleted. Retry with one top-level rm command; the runtime will use the trusted launcher at "{launcherPath}". Do not bypass this with a permanent delete command, wrapper, script, or filesystem API.',
  // The `{mode}` placeholder carries the display name of the Plan mode, which
  // the shared runtime catalog owns; the `plan` token in the sentence is the
  // permission-mode value and stays in its original form.
  'pluginHook.planModeUnsupported':
    'Plugin Hook setMode(plan) is not supported because MiniMax {mode} has a separate Turn lifecycle.',
} as const;

/** Key type of the local-runtime permission-reason catalog. */
export type PermissionCopyKey = keyof typeof EN_PERMISSION_COPY;
