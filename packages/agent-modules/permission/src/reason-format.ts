/**
 * Localized DecisionReason formatter — produces the human-readable `reason`
 * strings emitted at the wire by `LocalPermissionFacade`.
 *
 * Templates live in two catalogs keyed by the same English reference object.
 * The `Lang` view is retained because callers outside this module pass it
 * around, and because the wire carries `'en' | 'zh'` rather than a BCP 47 tag.
 *
 * Default mode (no LLM) and auto mode (with LLM prefix) MUST go through the
 * same tables so the two pipelines stay in sync. When adding a new
 * DecisionReason variant, add its template here too — a missing key surfaces as
 * a TypeScript error.
 */

import { createCatalogSet, translate } from '@mavis/shared/i18n';

import type { UserLocaleHint } from './locale-detect.js';
import type {
  PermissionBehavior,
  PermissionMode,
  PermissionRule,
  PermissionRuleSource,
  DecisionReason,
  SubcommandResult,
} from './types.js';

export type Lang = 'en' | 'zh';

export function localeOrDefault(locale: UserLocaleHint): Lang {
  return locale === 'zh' ? 'zh' : 'en';
}

const EN_REASON_COPY = {
  'action.allow': 'Allowed',
  'action.ask': 'Needs confirmation',
  'action.deny': 'Blocked',

  'behavior.allow': 'allow',
  'behavior.ask': 'ask',
  'behavior.deny': 'deny',

  'source.global': 'global',
  'source.agent': 'agent',
  'source.session': 'session',

  'mode.off': 'Allowed: permission mode is off; permission review was skipped.',
  'mode.bypass':
    'Allowed: permission mode is bypassPermissions and no bypass-immune safety rule matched.',
  'mode.named': 'Allowed by permission mode: {mode}.',

  'workingDirectory.allow':
    'Allowed: filesystem path is within an approved read/write boundary. Path: {path}',
  'workingDirectory.ask':
    'Needs confirmation: filesystem path is outside the workspace or configured allow paths. Path: {path}',
  'workingDirectory.deny':
    'Blocked: filesystem path is outside the workspace or configured allow paths. Path: {path}',
  'internalWhitelist.allow': 'Allowed: internal Mavis-managed path. Path: {path}',
  'trustedExactWrite.allow': 'Allowed: the current turn allows writing the exact path. Path: {path}',
  'tempDirectory.allow': 'Allowed: filesystem path is inside a temporary directory. Path: {path}',
  'sandbox.allow': 'Allowed: path is covered by the sandbox allow-list.',
  'pathValidation.deny': 'Blocked: invalid filesystem path. {error}',
  'dangerousRemoval.deny': 'Blocked: dangerous removal target. Path: {path}',
  'rmRewrite.allow':
    'Allowed: rm command was rewritten to mavis-trash for recoverable deletion. Original command: {command}',

  unknown: 'Unknown reason',
  'bash.empty': 'Allowed: empty bash command.',
  'subcommand.summary': '{prefix}: bash subcommand decision for "{command}". {detail}',
  'rule.decision': '{action}: matched {source} {behavior} permission rule for {scope}.',

  'safety.allow': 'Allowed: {description}',
  'safety.deny': 'Blocked: {description}',
  'safety.ask': 'Needs confirmation: {description}',

  'auto.allow': 'Auto classifier: {reason}',
  'auto.block':
    '⚠️ Blocked by auto classifier; explicit confirmation required to continue: {reason}',
  'auto.confirm': 'Needs confirmation: {reason}',
  'auto.timeout': '⚠️ Auto classifier timed out{reason}; asking user to confirm.',
} as const;

const ZH_HANS_REASON_COPY = {
  'action.allow': '已允许',
  'action.ask': '需要确认',
  'action.deny': '已拒绝',

  'behavior.allow': '允许',
  'behavior.ask': '询问',
  'behavior.deny': '拒绝',

  'source.global': '全局',
  'source.agent': 'agent',
  'source.session': '会话',

  'mode.off': '已允许：权限模式为 off，已跳过权限审查。',
  'mode.bypass': '已允许：权限模式为 bypassPermissions，且未命中任何强制安全规则。',
  'mode.named': '已允许：权限模式 {mode} 放行。',

  'workingDirectory.allow': '已允许：文件路径在已批准的读写边界内。路径：{path}',
  'workingDirectory.ask': '需要确认：文件路径在工作区或允许路径之外。路径：{path}',
  'workingDirectory.deny': '已拒绝：文件路径在工作区或允许路径之外。路径：{path}',
  'internalWhitelist.allow': '已允许：Mavis 内部托管路径。路径：{path}',
  'trustedExactWrite.allow': '已允许：当前 Turn 已授权写入精确路径。路径：{path}',
  'tempDirectory.allow': '已允许：文件路径在临时目录内。路径：{path}',
  'sandbox.allow': '已允许：路径在 sandbox 允许列表内。',
  'pathValidation.deny': '已拒绝：文件路径非法。{error}',
  'dangerousRemoval.deny': '已拒绝：危险删除目标。路径：{path}',
  'rmRewrite.allow': '已允许：rm 命令已改写为 mavis-trash 以便恢复。原命令：{command}',

  unknown: '原因未知',
  'bash.empty': '已允许：空的 bash 命令。',
  'subcommand.summary': '{prefix}：bash 子命令 "{command}" 的判定。{detail}',
  'rule.decision': '{action}：命中 {source} {behavior} 权限规则，作用域 {scope}。',

  'safety.allow': '已允许：{description}',
  'safety.deny': '已拒绝：{description}',
  'safety.ask': '需要确认：{description}',

  'auto.allow': '自动判定：{reason}',
  'auto.block': '⚠️ 自动判定已阻止，需用户显式确认才能继续：{reason}',
  'auto.confirm': '需要确认：{reason}',
  'auto.timeout': '⚠️ 自动 classifier 超时{reason}，请用户手动确认。',
} as const satisfies Readonly<Record<keyof typeof EN_REASON_COPY, string>>;

const REASON_CATALOG = createCatalogSet(EN_REASON_COPY, {
  'zh-Hans': ZH_HANS_REASON_COPY,
});

type ReasonKey = keyof typeof EN_REASON_COPY;

/**
 * Translate one permission-reason key.
 *
 * `Lang` maps directly onto a catalog name, so the formatter family below keeps
 * working with the `'en' | 'zh'` value it already threads through its helpers.
 */
function text(lang: Lang, key: ReasonKey, values?: Readonly<Record<string, string>>): string {
  return translate(REASON_CATALOG, catalogName(lang), key, values);
}

function catalogName(lang: Lang): string {
  return lang === 'zh' ? 'zh-Hans' : 'en';
}

function actionLabel(lang: Lang, behavior: PermissionBehavior): string {
  return text(lang, `action.${behavior}` as ReasonKey);
}

function behaviorLabel(lang: Lang, behavior: PermissionBehavior): string {
  return text(lang, `behavior.${behavior}` as ReasonKey);
}

function sourceLabel(lang: Lang, source: PermissionRuleSource): string {
  return text(lang, `source.${source}` as ReasonKey);
}

function formatMode(lang: Lang, mode: PermissionMode): string {
  return text(lang, 'mode.named', { mode });
}

function formatWorkingDirectoryReason(
  behavior: PermissionBehavior | undefined,
  fsPath: string,
  lang: Lang,
): string {
  if (behavior === 'allow') return text(lang, 'workingDirectory.allow', { path: fsPath });
  if (behavior === 'ask') return text(lang, 'workingDirectory.ask', { path: fsPath });
  return text(lang, 'workingDirectory.deny', { path: fsPath });
}

function formatInternalWhitelistReason(fsPath: string, lang: Lang): string {
  return text(lang, 'internalWhitelist.allow', { path: fsPath });
}

function formatTrustedExactWriteReason(fsPath: string, lang: Lang): string {
  return text(lang, 'trustedExactWrite.allow', { path: fsPath });
}

function formatTempDirectoryReason(fsPath: string, lang: Lang): string {
  return text(lang, 'tempDirectory.allow', { path: fsPath });
}

function formatPathValidationReason(error: string, lang: Lang): string {
  return text(lang, 'pathValidation.deny', { error });
}

function formatDangerousRemovalReason(fsPath: string, lang: Lang): string {
  return text(lang, 'dangerousRemoval.deny', { path: fsPath });
}

function formatRmRewriteReason(rewrittenCommand: string, lang: Lang): string {
  return text(lang, 'rmRewrite.allow', { command: rewrittenCommand });
}

function formatSubcommandSummary(
  prefix: string,
  command: string,
  detail: string,
  lang: Lang,
): string {
  return text(lang, 'subcommand.summary', { prefix, command, detail });
}

function formatRuleDecisionReason(rule: PermissionRule, lang: Lang): string {
  const behavior = rule.ruleBehavior;
  const scope = rule.ruleValue.ruleContent
    ? `${rule.ruleValue.toolName}(${rule.ruleValue.ruleContent})`
    : rule.ruleValue.toolName;
  return text(lang, 'rule.decision', {
    action: actionLabel(lang, behavior),
    source: sourceLabel(lang, rule.source),
    behavior: behaviorLabel(lang, behavior),
    scope,
  });
}

/**
 * Safety descriptions may already be localized by an upstream subsystem. The
 * guard intentionally matches the leading action words in both languages so an
 * already-formatted string is not prefixed twice.
 */
function formatSafetyDecisionReason(
  description: string,
  behavior: PermissionBehavior | undefined,
  lang: Lang,
): string {
  if (
    /^(<system-reminder|Allowed|Blocked|Needs confirmation|Auto classifier|LLM classifier|No LLM client|⚠️|已允许|已拒绝|需要确认|⚠️ )/.test(
      description,
    )
  ) {
    return description;
  }
  if (behavior === 'allow') return text(lang, 'safety.allow', { description });
  if (behavior === 'deny') return text(lang, 'safety.deny', { description });
  return text(lang, 'safety.ask', { description });
}

function formatSubcommandDecisionReason(
  reasons: Map<string, SubcommandResult>,
  lang: Lang = 'en',
): string {
  if (reasons.size === 0) return text(lang, 'bash.empty');
  const priority: Record<PermissionBehavior, number> = { deny: 0, ask: 1, allow: 2 };
  const entries = [...reasons.entries()].sort(
    ([, a], [, b]) => priority[a.behavior] - priority[b.behavior],
  );
  const first = entries[0];
  if (!first) return text(lang, 'bash.empty');
  const [command, result] = first;
  const detail = formatDecisionReason(result.reason, result.behavior, lang);
  const prefix = actionLabel(lang, result.behavior);
  return formatSubcommandSummary(prefix, command, detail, lang);
}

/**
 * Render a `DecisionReason` (or bare `PermissionRule`) into a user-facing
 * string.
 */
export function formatDecisionReason(
  reason: PermissionRule | DecisionReason,
  behavior?: PermissionBehavior,
  locale: UserLocaleHint | Lang = 'en',
): string {
  const lang = localeOrDefault(locale as UserLocaleHint);
  if ('type' in reason) {
    switch (reason.type) {
      case 'rule':
        return formatRuleDecisionReason(reason.rule, lang);
      case 'safetyCheck':
        return formatSafetyDecisionReason(reason.description, behavior, lang);
      case 'mode':
        if (reason.mode === 'off') return text(lang, 'mode.off');
        if (reason.mode === 'bypassPermissions') return text(lang, 'mode.bypass');
        return formatMode(lang, reason.mode);
      case 'workingDirectory':
        return formatWorkingDirectoryReason(behavior, reason.path, lang);
      case 'internalWhitelist':
        return formatInternalWhitelistReason(reason.path, lang);
      case 'trustedExactWrite':
        return formatTrustedExactWriteReason(reason.path, lang);
      case 'tempDirectory':
        return formatTempDirectoryReason(reason.path, lang);
      case 'sandbox':
        return text(lang, 'sandbox.allow');
      case 'pathValidation':
        return formatPathValidationReason(reason.error, lang);
      case 'dangerousRemoval':
        return formatDangerousRemovalReason(reason.path, lang);
      case 'subcommandResults':
        return formatSubcommandDecisionReason(reason.reasons, lang);
      case 'rmRewrite':
        return formatRmRewriteReason(reason.rewrittenCommand, lang);
      case 'recoverableDeleteRewrite':
        return formatRmRewriteReason(reason.targets.join(' '), lang);
      default:
        return text(lang, 'unknown');
    }
  }
  // Bare PermissionRule.
  return formatRuleDecisionReason(reason, lang);
}

// ---------------------------------------------------------------------------
// Auto-mode classifier prefixes (used by the LocalPermissionFacade
// cloud-gateway branch).
// ---------------------------------------------------------------------------

export function formatAutoClassifierReason(
  verdict: 'allow' | 'block' | 'confirm' | 'timeout',
  reasonText: string,
  locale: UserLocaleHint,
): string {
  const lang = localeOrDefault(locale);
  switch (verdict) {
    case 'allow':
      return text(lang, 'auto.allow', { reason: reasonText });
    case 'block':
      return text(lang, 'auto.block', { reason: reasonText });
    case 'timeout':
      return text(lang, 'auto.timeout', { reason: reasonText });
    case 'confirm':
    default:
      return text(lang, 'auto.confirm', { reason: reasonText });
  }
}

// ---------------------------------------------------------------------------
// Blocked-tool reason — the string handed to the LLM when a tool call is
// denied at `beforeToolCall`. The model reads this to decide how to recover
// (try another approach / explain to the user / drop a blocked rule), so the
// source is surfaced as a machine-readable tag.
// ---------------------------------------------------------------------------

/**
 * Where a tool-call denial originated. Surfaced to the LLM so it can tell a
 * user veto apart from a configured rule apart from a built-in safety wall.
 *
 *   - `user`          — the user rejected the call in the confirmation dialog
 *                       (includes auto-mode cloud `block` that was downgraded
 *                       to ask and then rejected).
 *   - `rule`          — matched a user-configured `deny` permission rule.
 *   - `safety`        — matched a built-in safety boundary (HARD final-deny,
 *                       dangerous removal, invalid path, …).
 *   - `safety-immune` — bypass-immune safety deny (UNC / network share,
 *                       `rm -rf /`, `rm -rf ~`). Cannot be relaxed by any mode.
 */
export type ToolDenialSource = 'user' | 'rule' | 'safety' | 'safety-immune';

export interface BlockedToolReasonInput {
  source: ToolDenialSource;
  toolName: string;
  /**
   * Already-localized decision reason for non-user denials — the engine /
   * facade output from {@link formatDecisionReason}. Rendered as the body.
   */
  detail?: string;
  /**
   * Already-localized reason the confirmation was raised in the first place
   * (original safety / cloud-classifier text), carried through on a `user`
   * denial so the model knows what the user vetoed.
   */
  trigger?: string;
}

/**
 * Render the LLM-facing denial string. The leading `[permission:denied
 * source=<source>]` tag is intentionally fixed English so the model (and log
 * greps) can parse the origin regardless of the user's locale; the trailing
 * body reuses the already-localized `detail` / `trigger` text verbatim.
 */
export function formatBlockedToolReason(input: BlockedToolReasonInput): string {
  const { source, toolName, detail, trigger } = input;
  const tag = `[permission:denied source=${source}]`;
  if (source === 'user') {
    const base = `${tag} User rejected the \`${toolName}\` call in the confirmation dialog.`;
    return trigger ? `${base} Trigger: ${trigger}` : base;
  }
  const body = detail && detail.trim().length > 0 ? detail : `\`${toolName}\` call was denied.`;
  return `${tag} ${body}`;
}
