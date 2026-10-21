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

import { createCatalogSet, isChineseLocale, translate } from '@mavis/shared/i18n';

import type { UserLocaleHint } from './locale-detect.js';
import type {
  PermissionBehavior,
  PermissionMode,
  PermissionRule,
  PermissionRuleSource,
  DecisionReason,
  PermissionReasonBody,
  SafetyCheckReason,
  SubcommandResult,
} from './types.js';

export type Lang = 'en' | 'zh';

export function localeOrDefault(locale: UserLocaleHint): Lang {
  return isChineseLocale(locale) ? 'zh' : 'en';
}

/**
 * English copy for permission reasons.
 *
 * The English object is the only source of truth for key shape: the zh-Hans
 * catalog is typed against it, so a missing translation is a compile error
 * rather than a blank line in the interface.
 */
export const EN_REASON_COPY = {
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

  // Structured decision bodies — the `{description}` half of the wrapper above.
  // The wrapper prefix is NOT part of these templates: the formatter adds it,
  // so a Chinese reader gets a Chinese label around a Chinese body.
  'body.bash.sensitiveCredentialRead':
    'sensitive credential or system-secret read requires LLM review and explicit approval if the LLM cannot allow it. Command: {command}. Reason: {reason}.',
  'body.bash.dataExfil':
    'command appears to exfiltrate credential or secret material. Command: {command}. Reason: {reason}.',
  'body.bash.irrecoverableDelete':
    'command can irreversibly destroy files, disks, or backups. Command: {command}. Reason: {reason}.',
  // Trailing hint appended to a body. The leading space is part of the
  // English template; the Chinese entry carries no leading space, so the two
  // languages join without a locale-specific separator.
  'body.bash.recoverableRemovalHint':
    ' Use `mavis-trash <path>` for recoverable removal, or drop bypass for this call.',
  'body.bash.encodedExecution':
    'encoded shell execution hides the payload and has no reliable review surface. Command: {command}. Reason: {reason}.',
  'body.bash.rawShellChannel':
    'command opens a raw shell/network channel and requires LLM review; if the LLM cannot allow it, explicit approval is required. Command: {command}. Reason: {reason}.',
  'body.bash.finalSafetyBoundary':
    'command matches a final safety boundary. Command: {command}. Reason: {reason}.',

  'body.path.systemSecretAccess':
    'system secret access requires LLM review and explicit approval if the LLM cannot allow it. Path: {path}. Reason: {reason}.',
  'body.path.credentialAccess':
    'credential or private-key access requires LLM review and explicit approval if the LLM cannot allow it. Path: {path}. Reason: {reason}.',
  'body.path.dynamicScript':
    'Running a script from an unresolved dynamic path ({path}) requires confirmation.',
  'body.path.capabilityAllow': 'Path capability allow for tool "{tool}"',
  'body.path.applyPatchUnparsed':
    'apply_patch payload could not be parsed for path-capability checks; manual confirmation required.',

  'body.fs.privateRuntimeData': 'Private runtime data access requires approval. Path: {path}',
  'body.fs.systemSecret':
    'System secret access requires LLM review and explicit approval if the LLM cannot allow it. Path: {path}',
  'body.fs.credentialAccess':
    'Credential or private-key access requires LLM review and explicit approval if the LLM cannot allow it. Path: {path}',
  'body.fs.envFile': 'Environment file may contain secrets. Path: {path}',
  'body.fs.sensitiveGitMetadata':
    'Sensitive git metadata may contain credentials or remotes with tokens. Path: {path}',
  'body.fs.protectedFile': 'Protected user or tool configuration file. Path: {path}',
  'body.fs.protectedDirectory':
    'Protected configuration or credential directory ({directory}). Path: {path}',

  'body.bash.authorizedLocalScript':
    'Authorized local script execution inside workspace / allowed paths.',
  'body.bash.authorizedWriteRedirect': 'Authorized write target in temp/workspace path.',
  'body.bash.knownSafeCommand':
    'Known read-only command (auto-approved by safe-command whitelist).',

  'body.bash.catastrophicCommand':
    'catastrophic command has no recoverable safe use case. Command: {command}',
  'body.bash.pipeToShell': 'pipe to shell',
  'body.bash.helpFlagFastAllow':
    'Help/version flag fast-allow: `{command} <help-flag>` has no side effects.',
  'body.bash.bypassDeleteSniff': 'bypass mode does not auto-run delete-like commands.',
  'body.bash.bypassAllow':
    'bypass mode: passed user deny + user ask + HARD final-deny common layer',
  'body.bash.writeAuthorizedTarget':
    'Write target is inside a write-authorized location (workspace / allowed working path).',
  'body.bash.subcommandGradedDanger': 'Subcommand-graded danger: {category}',
  'body.bash.environmentSecretRead': 'Environment secret read: {category}',
  'body.bash.sourcingLocalFile': 'Sourcing local file: {target} (temp/workspace/written)',
  'body.bash.defaultFastAllow': 'Default fast-allow: first word "{word}" is non-deletion.',
  'body.bash.noMatchingPermissionRule': 'No matching permission rule for command: {command}',

  'body.tool.checkerError': 'Tool checker error: {error}',
  'body.tool.requiresUserInteraction': 'Tool "{tool}" requires user interaction',
  'body.tool.noCheckerRegistered':
    'No permission checker registered for tool "{tool}", allowing by default',
  'body.tool.noMatchingRule': 'No permission rule matched for tool "{tool}"',

  'eval.explicitUserDeny': 'explicit user deny',
  'eval.noApprovalChannel':
    'permission requires user confirmation but no approval channel is available',
  'eval.explicitUserAllow': 'explicit user allow',
  'eval.permissionAllowed': 'permission allowed',
  'eval.interactionDisabled': 'permission interaction is disabled',
  'eval.requiresApproval': 'permission requires approval',

  'auto.allow': 'Auto classifier: {reason}',
  'auto.block':
    '⚠️ Blocked by auto classifier; explicit confirmation required to continue: {reason}',
  'auto.confirm': 'Needs confirmation: {reason}',
  'auto.timeout': '⚠️ Auto classifier timed out{reason}; asking user to confirm.',
} as const;

/**
 * Simplified Chinese copy for permission reasons.
 *
 * The `satisfies` clause is the completeness check: a key present in the
 * English catalog but absent here fails `pnpm typecheck`.
 */
export const ZH_HANS_REASON_COPY = {
  'action.allow': '已允许',
  'action.ask': '需要确认',
  'action.deny': '已拒绝',

  'behavior.allow': '允许',
  'behavior.ask': '询问',
  'behavior.deny': '拒绝',

  'source.global': '全局',
  'source.agent': 'Agent',
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

  // Structured decision bodies — the `{description}` half of the wrapper above.
  'body.bash.sensitiveCredentialRead':
    '读取敏感凭据或系统机密需要 LLM 审核；若 LLM 无法放行，还需用户显式批准。命令：{command}。原因：{reason}。',
  'body.bash.dataExfil': '命令疑似外泄凭据或机密材料。命令：{command}。原因：{reason}。',
  'body.bash.irrecoverableDelete':
    '命令可能不可逆地销毁文件、磁盘或备份。命令：{command}。原因：{reason}。',
  'body.bash.recoverableRemovalHint':
    '可恢复删除请使用 `mavis-trash <path>`，或取消本次调用的 bypassPermissions 模式。',
  'body.bash.encodedExecution':
    '编码后的 shell 执行隐藏了真实载荷，没有可靠的审查入口。命令：{command}。原因：{reason}。',
  'body.bash.rawShellChannel':
    '命令打开了原始 shell/网络通道，需要 LLM 审核；若 LLM 无法放行，则必须显式批准。命令：{command}。原因：{reason}。',
  'body.bash.finalSafetyBoundary': '命令命中最终安全边界。命令：{command}。原因：{reason}。',

  'body.path.systemSecretAccess':
    '访问系统机密需要 LLM 审核；若 LLM 无法放行，还需用户显式批准。路径：{path}。原因：{reason}。',
  'body.path.credentialAccess':
    '访问凭据或私钥需要 LLM 审核；若 LLM 无法放行，还需用户显式批准。路径：{path}。原因：{reason}。',
  'body.path.dynamicScript': '从无法解析的动态路径（{path}）运行脚本需要确认。',
  'body.path.capabilityAllow': '工具 "{tool}" 的路径能力校验通过',
  'body.path.applyPatchUnparsed':
    'apply_patch 载荷无法解析，无法完成路径能力校验，需要手动确认。',

  'body.fs.privateRuntimeData': '访问 Runtime 私有数据需要批准。路径：{path}',
  'body.fs.systemSecret':
    '访问系统机密需要 LLM 审核；若 LLM 无法放行，还需用户显式批准。路径：{path}',
  'body.fs.credentialAccess':
    '访问凭据或私钥需要 LLM 审核；若 LLM 无法放行，还需用户显式批准。路径：{path}',
  'body.fs.envFile': '环境变量文件可能包含机密。路径：{path}',
  'body.fs.sensitiveGitMetadata':
    '敏感的 git 元数据可能包含凭据或带 token 的远程地址。路径：{path}',
  'body.fs.protectedFile': '受保护的用户或工具配置文件。路径：{path}',
  'body.fs.protectedDirectory': '受保护的配置或凭据目录（{directory}）。路径：{path}',

  'body.bash.authorizedLocalScript': '已授权在工作区或允许路径内执行本地脚本。',
  'body.bash.authorizedWriteRedirect': '写入目标位于临时目录或工作区路径，已授权。',
  'body.bash.knownSafeCommand': '已知的只读命令（由安全命令白名单自动放行）。',

  'body.bash.catastrophicCommand': '灾难性命令没有可恢复的安全用法。命令：{command}',
  'body.bash.pipeToShell': '管道输入 shell',
  'body.bash.helpFlagFastAllow': '帮助/版本参数快速放行：`{command} <help-flag>` 没有副作用。',
  'body.bash.bypassDeleteSniff': 'bypass 模式不会自动执行类删除命令。',
  'body.bash.bypassAllow': 'bypass 模式：已通过用户拒绝、用户询问与 HARD 最终拒绝公共层',
  'body.bash.writeAuthorizedTarget':
    '写入目标位于已授权写入的位置（工作区或允许的工作路径）。',
  'body.bash.subcommandGradedDanger': '子命令分级危险：{category}',
  'body.bash.environmentSecretRead': '读取环境变量机密：{category}',
  'body.bash.sourcingLocalFile': '加载本地文件：{target}（临时目录/工作区/已写入）',
  'body.bash.defaultFastAllow': '默认快速放行：首词 "{word}" 不是删除操作。',
  'body.bash.noMatchingPermissionRule': '没有匹配该命令的权限规则：{command}',

  'body.tool.checkerError': '工具校验器错误：{error}',
  'body.tool.requiresUserInteraction': '工具 "{tool}" 需要用户交互',
  'body.tool.noCheckerRegistered': '工具 "{tool}" 未注册权限校验器，默认放行',
  'body.tool.noMatchingRule': '没有匹配工具 "{tool}" 的权限规则',

  'eval.explicitUserDeny': '用户显式拒绝',
  'eval.noApprovalChannel': '权限需要用户确认，但没有可用的审批通道',
  'eval.explicitUserAllow': '用户显式允许',
  'eval.permissionAllowed': '权限已允许',
  'eval.interactionDisabled': '权限交互已禁用',
  'eval.requiresApproval': '权限需要审批',

  'auto.allow': '自动判定：{reason}',
  'auto.block': '⚠️ 自动判定已阻止，需用户显式确认才能继续：{reason}',
  'auto.confirm': '需要确认：{reason}',
  'auto.timeout': '⚠️ 自动判定超时{reason}，请用户手动确认。',
} as const satisfies Readonly<Record<keyof typeof EN_REASON_COPY, string>>;

const REASON_CATALOG = createCatalogSet(EN_REASON_COPY, {
  'zh-Hans': ZH_HANS_REASON_COPY,
});

type ReasonKey = keyof typeof EN_REASON_COPY;

/**
 * Every key the permission-reason catalog defines.
 */
export type PermissionReasonCopyKey = ReasonKey;

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
  return isChineseLocale(lang) ? 'zh-Hans' : 'en';
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

/**
 * A structured body as a producer states it: a catalog key plus the values
 * that fill it.
 */
export type PermissionReasonBodyInput = {
  /** Catalog key of the body template. */
  key: PermissionReasonCopyKey;
  /** Placeholder values for the body template. */
  values?: Readonly<Record<string, string>>;
  /**
   * Action label that prefixes this body. When it is omitted the decision
   * behavior supplies the label.
   */
  action?: PermissionBehavior;
  /**
   * Optional trailing sentence appended after the body. The template carries
   * its own leading separator, so the two languages need no shared rule.
   */
  suffix?: {
    key: PermissionReasonCopyKey;
    values?: Readonly<Record<string, string>>;
  };
};

/**
 * Render one structured body in the given locale.
 *
 * The suffix template carries its own leading separator (the English entry
 * starts with a space, the Chinese entry does not), so the two parts are
 * concatenated without a locale-specific join.
 */
function renderReasonBody(body: PermissionReasonBody, lang: Lang): string {
  const main = text(lang, body.key as ReasonKey, body.values);
  if (!body.suffix) return main;
  return main + text(lang, body.suffix.key as ReasonKey, body.suffix.values);
}

/**
 * Render a structured body as the legacy English description string.
 *
 * The legacy `description` stays English because the model reads it (classifier
 * input) and telemetry records it. A body that states its own `action` also
 * carried the label in the legacy text, so the label is prepended here.
 */
export function englishReasonDescription(body: PermissionReasonBodyInput): string {
  const rendered = renderReasonBody(body, 'en');
  if (!body.action) return rendered;
  return `${actionLabel('en', body.action)}: ${rendered}`;
}

/**
 * Build a safety-check reason whose body is rendered from the catalog.
 *
 * `description` keeps the legacy English text; `body` carries the localizable
 * form. `hardBlocked` states that the check is a hard (irrecoverable) safety
 * boundary, so consumers no longer have to read the rendered text to learn it.
 */
export function safetyCheckReason(
  body: PermissionReasonBodyInput,
  options: {
    category?: string;
    classifierApprovable?: boolean;
    hardBlocked?: boolean;
  } = {},
): SafetyCheckReason {
  const reason: SafetyCheckReason = {
    type: 'safetyCheck',
    description: englishReasonDescription(body),
    body: {
      key: body.key,
      ...(body.values ? { values: body.values } : {}),
      ...(body.action ? { action: body.action } : {}),
      ...(body.suffix
        ? {
            suffix: {
              key: body.suffix.key,
              ...(body.suffix.values ? { values: body.suffix.values } : {}),
            },
          }
        : {}),
    },
  };
  if (options.category !== undefined) reason.category = options.category;
  if (options.classifierApprovable !== undefined) {
    reason.classifierApprovable = options.classifierApprovable;
  }
  if (options.hardBlocked !== undefined) reason.hardBlocked = options.hardBlocked;
  return reason;
}

/**
 * Resolve one permission-reason copy string for a locale.
 *
 * Used by the parts of the pipeline that emit a bare reason string rather than
 * a `DecisionReason`.
 */
export function permissionReasonText(
  key: PermissionReasonCopyKey,
  locale?: UserLocaleHint | null,
): string {
  return text(localeOrDefault(locale ?? 'en'), key);
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
 * Render a safety-check reason.
 *
 * A structured body is resolved from the catalog, so the wrapper label and the
 * body are localized together and the label is no longer baked into the body
 * text. A legacy producer that only carries a description string keeps the
 * bilingual prefix guard, which stops an already-formatted string from being
 * prefixed twice.
 */
function formatSafetyDecisionReason(
  reason: SafetyCheckReason,
  behavior: PermissionBehavior | undefined,
  lang: Lang,
): string {
  if (reason.body) {
    const rendered = renderReasonBody(reason.body, lang);
    const action = reason.body.action ?? behavior;
    if (action === 'allow') return text(lang, 'safety.allow', { description: rendered });
    if (action === 'deny') return text(lang, 'safety.deny', { description: rendered });
    return text(lang, 'safety.ask', { description: rendered });
  }
  const description = reason.description;
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
        return formatSafetyDecisionReason(reason, behavior, lang);
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
