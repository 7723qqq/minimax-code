import path from 'node:path';
import { describe, expect, it } from 'bun:test';

import { createToolPermissionContext } from '../../../src/context.js';
import { PermissionEngine, type ToolPermissionChecker } from '../../../src/engine.js';
import { formatDecisionReason, safetyCheckReason } from '../../../src/reason-format.js';
import { isIrrecoverableSafetyCheck } from '../../../src/tools/bash-checker.js';
import { evaluateBashStatic } from '../../../src/tools/bash-permission.js';
import type { DecisionReason, SafetyCheckReason } from '../../../src/types.js';

/**
 * Localization of permission decision reasons.
 *
 * The permission catalog localizes the wrapper ("Blocked: {description}") and
 * the body it wraps. These tests pin the two properties that make that safe:
 *
 *   1. a hard (irrecoverable) block is still recognised as one after the body
 *      is localized — the classifier reads a structured signal, not the
 *      rendered text;
 *   2. the Chinese output is a Chinese label around a Chinese body, with no
 *      English fragment left over.
 */

/** Every safety-check reason inside a decision, including subcommand results. */
function safetyReasons(reason: DecisionReason): SafetyCheckReason[] {
  if (reason.type === 'safetyCheck') return [reason];
  if (reason.type !== 'subcommandResults') return [];
  return [...reason.reasons.values()]
    .map((entry) => entry.reason)
    .filter((entry): entry is SafetyCheckReason => entry.type === 'safetyCheck');
}

/** The catalog key of a safety-check reason, when it carries one. */
function bodyKey(reason: DecisionReason): string | undefined {
  return reason.type === 'safetyCheck' ? reason.body?.key : undefined;
}

function testContext() {
  const workingDirectory = path.resolve('synthetic-workspace');
  return createToolPermissionContext({
    workingDirectory,
    dataDir: path.join(workingDirectory, 'data'),
    homeDir: path.join(workingDirectory, 'home'),
    platform: 'linux',
    shellFamily: 'posix',
    isFile: () => false,
    rules: [],
  });
}

describe('hard-blocked safety checks survive localization', () => {
  it('classifies a hard block from the structured signal, not from the text', () => {
    const decision = evaluateBashStatic('rm -rf /', [], undefined, 'default');
    const reasons = safetyReasons(decision.reason);
    expect(reasons).toHaveLength(1);
    const reason = reasons[0]!;

    expect(reason.hardBlocked).toBe(true);
    expect(isIrrecoverableSafetyCheck(reason)).toBe(true);

    // The rendered text differs per language; the classification does not.
    const english = formatDecisionReason(reason, 'deny', 'en');
    const chinese = formatDecisionReason(reason, 'deny', 'zh');
    expect(english).toBe(
      'Blocked: catastrophic command has no recoverable safe use case. Command: rm -rf /',
    );
    expect(chinese.startsWith('已拒绝：')).toBe(true);
    expect(isIrrecoverableSafetyCheck(reason)).toBe(true);
  });

  it('still classifies a hard block whose description was localized', () => {
    // The failure mode this change must avoid: a Chinese body no longer starts
    // with an English action word, so a text-based classifier would lose it.
    const reason: SafetyCheckReason = {
      type: 'safetyCheck',
      description: '已拒绝：灾难性命令没有可恢复的安全用法。命令：rm -rf /',
      body: {
        key: 'body.bash.catastrophicCommand',
        values: { command: 'rm -rf /' },
        action: 'deny',
      },
      hardBlocked: true,
    };

    expect(isIrrecoverableSafetyCheck(reason)).toBe(true);
  });

  it('keeps the legacy prefix path for producers that only carry a string', () => {
    expect(
      isIrrecoverableSafetyCheck({ type: 'safetyCheck', description: 'Blocked: legacy hard block' }),
    ).toBe(true);
    expect(
      isIrrecoverableSafetyCheck({
        type: 'safetyCheck',
        description: 'Needs confirmation: system secret access requires review.',
      }),
    ).toBe(true);
    expect(
      isIrrecoverableSafetyCheck({ type: 'safetyCheck', description: 'pipe to shell' }),
    ).toBe(false);
  });

  it('marks a soft ask as not hard blocked', () => {
    const decision = evaluateBashStatic('echo hello', [], undefined, 'default');
    for (const reason of safetyReasons(decision.reason)) {
      expect(isIrrecoverableSafetyCheck(reason)).toBe(false);
    }
  });
});

describe('the Chinese output is a Chinese label around a Chinese body', () => {
  // The substituted values carry no letters either, so the assertion below is
  // about the copy alone.
  const reason = safetyCheckReason(
    { key: 'body.bash.dataExfil', values: { command: '/1/2', reason: '3' }, action: 'deny' },
    { hardBlocked: true },
  );

  it('renders the English body verbatim', () => {
    expect(formatDecisionReason(reason, 'deny', 'en')).toBe(
      'Blocked: command appears to exfiltrate credential or secret material. Command: /1/2. Reason: 3.',
    );
  });

  it('renders a Chinese label around a Chinese body', () => {
    const chinese = formatDecisionReason(reason, 'deny', 'zh');
    expect(chinese).toBe('已拒绝：命令疑似外泄凭据或机密材料。命令：/1/2。原因：3。');
    expect(chinese.startsWith('已拒绝：')).toBe(true);
    expect(chinese).not.toMatch(/[A-Za-z]/);
    expect(chinese).not.toContain('Blocked');
    expect(chinese).not.toContain('Needs confirmation');
  });

  it('localizes the body of a soft ask as well', () => {
    const soft = safetyCheckReason({ key: 'body.bash.pipeToShell' });
    expect(formatDecisionReason(soft, 'ask', 'zh')).toBe('需要确认：管道输入 shell');
    expect(formatDecisionReason(soft, 'ask', 'en')).toBe('Needs confirmation: pipe to shell');
  });
});

describe('the English wording stays verbatim', () => {
  // The catalog holds the English text of every body. These expectations are
  // the pre-localization sentences, wrapper included, so a reworded template
  // or a moved wrapper fails here instead of in production.
  const CASES: ReadonlyArray<
    readonly [key: string, values: Record<string, string>, action?: 'allow' | 'ask' | 'deny', legacy: string]
  > = [
    [
      'body.bash.sensitiveCredentialRead',
      { command: 'CMD', reason: 'WHY' },
      'ask',
      'Needs confirmation: sensitive credential or system-secret read requires LLM review and explicit approval if the LLM cannot allow it. Command: CMD. Reason: WHY.',
    ],
    [
      'body.bash.dataExfil',
      { command: 'CMD', reason: 'WHY' },
      'deny',
      'Blocked: command appears to exfiltrate credential or secret material. Command: CMD. Reason: WHY.',
    ],
    [
      'body.bash.irrecoverableDelete',
      { command: 'CMD', reason: 'WHY' },
      'deny',
      'Blocked: command can irreversibly destroy files, disks, or backups. Command: CMD. Reason: WHY.',
    ],
    [
      'body.bash.encodedExecution',
      { command: 'CMD', reason: 'WHY' },
      'deny',
      'Blocked: encoded shell execution hides the payload and has no reliable review surface. Command: CMD. Reason: WHY.',
    ],
    [
      'body.bash.rawShellChannel',
      { command: 'CMD', reason: 'WHY' },
      'ask',
      'Needs confirmation: command opens a raw shell/network channel and requires LLM review; if the LLM cannot allow it, explicit approval is required. Command: CMD. Reason: WHY.',
    ],
    [
      'body.bash.finalSafetyBoundary',
      { command: 'CMD', reason: 'WHY' },
      'deny',
      'Blocked: command matches a final safety boundary. Command: CMD. Reason: WHY.',
    ],
    [
      'body.path.systemSecretAccess',
      { path: 'P', reason: 'WHY' },
      'ask',
      'Needs confirmation: system secret access requires LLM review and explicit approval if the LLM cannot allow it. Path: P. Reason: WHY.',
    ],
    [
      'body.path.credentialAccess',
      { path: 'P', reason: 'WHY' },
      'ask',
      'Needs confirmation: credential or private-key access requires LLM review and explicit approval if the LLM cannot allow it. Path: P. Reason: WHY.',
    ],
    [
      'body.path.dynamicScript',
      { path: 'P' },
      'ask',
      'Needs confirmation: Running a script from an unresolved dynamic path (P) requires confirmation.',
    ],
    [
      'body.path.capabilityAllow',
      { tool: 'T' },
      'allow',
      'Allowed: Path capability allow for tool "T"',
    ],
    [
      'body.fs.privateRuntimeData',
      { path: 'P' },
      'ask',
      'Needs confirmation: Private runtime data access requires approval. Path: P',
    ],
    [
      'body.fs.systemSecret',
      { path: 'P' },
      'ask',
      'Needs confirmation: System secret access requires LLM review and explicit approval if the LLM cannot allow it. Path: P',
    ],
    [
      'body.fs.credentialAccess',
      { path: 'P' },
      'ask',
      'Needs confirmation: Credential or private-key access requires LLM review and explicit approval if the LLM cannot allow it. Path: P',
    ],
    [
      'body.fs.envFile',
      { path: 'P' },
      'ask',
      'Needs confirmation: Environment file may contain secrets. Path: P',
    ],
    [
      'body.fs.sensitiveGitMetadata',
      { path: 'P' },
      'ask',
      'Needs confirmation: Sensitive git metadata may contain credentials or remotes with tokens. Path: P',
    ],
    [
      'body.fs.protectedFile',
      { path: 'P' },
      'ask',
      'Needs confirmation: Protected user or tool configuration file. Path: P',
    ],
    [
      'body.fs.protectedDirectory',
      { directory: '.git', path: 'P' },
      'ask',
      'Needs confirmation: Protected configuration or credential directory (.git). Path: P',
    ],
    [
      'body.bash.authorizedLocalScript',
      {},
      'allow',
      'Allowed: Authorized local script execution inside workspace / allowed paths.',
    ],
    [
      'body.bash.authorizedWriteRedirect',
      {},
      'allow',
      'Allowed: Authorized write target in temp/workspace path.',
    ],
    [
      'body.bash.knownSafeCommand',
      {},
      'allow',
      'Allowed: Known read-only command (auto-approved by safe-command whitelist).',
    ],
    [
      'body.bash.catastrophicCommand',
      { command: 'CMD' },
      'deny',
      'Blocked: catastrophic command has no recoverable safe use case. Command: CMD',
    ],
    ['body.bash.pipeToShell', {}, 'ask', 'Needs confirmation: pipe to shell'],
    [
      'body.bash.helpFlagFastAllow',
      { command: 'CMD' },
      'allow',
      'Allowed: Help/version flag fast-allow: `CMD <help-flag>` has no side effects.',
    ],
    [
      'body.bash.bypassAllow',
      {},
      'allow',
      'Allowed: bypass mode: passed user deny + user ask + HARD final-deny common layer',
    ],
    [
      'body.bash.writeAuthorizedTarget',
      {},
      'allow',
      'Allowed: Write target is inside a write-authorized location (workspace / allowed working path).',
    ],
    [
      'body.bash.subcommandGradedDanger',
      { category: 'CAT' },
      'ask',
      'Needs confirmation: Subcommand-graded danger: CAT',
    ],
    [
      'body.bash.environmentSecretRead',
      { category: 'CAT' },
      'ask',
      'Needs confirmation: Environment secret read: CAT',
    ],
    [
      'body.bash.sourcingLocalFile',
      { target: 'TGT' },
      'allow',
      'Allowed: Sourcing local file: TGT (temp/workspace/written)',
    ],
    [
      'body.bash.defaultFastAllow',
      { word: 'W' },
      'allow',
      'Allowed: Default fast-allow: first word "W" is non-deletion.',
    ],
    [
      'body.bash.noMatchingPermissionRule',
      { command: 'CMD' },
      'ask',
      'Needs confirmation: No matching permission rule for command: CMD',
    ],
    [
      'body.tool.checkerError',
      { error: 'ERR' },
      'ask',
      'Needs confirmation: Tool checker error: ERR',
    ],
    [
      'body.tool.requiresUserInteraction',
      { tool: 'T' },
      'ask',
      'Needs confirmation: Tool "T" requires user interaction',
    ],
    [
      'body.tool.noCheckerRegistered',
      { tool: 'T' },
      'allow',
      'Allowed: No permission checker registered for tool "T", allowing by default',
    ],
    [
      'body.tool.noMatchingRule',
      { tool: 'T' },
      'ask',
      'Needs confirmation: No permission rule matched for tool "T"',
    ],
  ];

  it.each(CASES)('%s renders the pre-localization sentence', (key, values, action, legacy) => {
    const reason = safetyCheckReason({
      key: key as Parameters<typeof safetyCheckReason>[0]['key'],
      values,
      ...(action ? { action } : {}),
    });
    expect(formatDecisionReason(reason, action, 'en')).toBe(legacy);
  });

  it('keeps the recoverable-removal hint as one shared sentence', () => {
    const hinted = safetyCheckReason({
      key: 'body.bash.irrecoverableDelete',
      values: { command: 'CMD', reason: 'WHY' },
      action: 'deny',
      suffix: { key: 'body.bash.recoverableRemovalHint' },
    });
    expect(formatDecisionReason(hinted, 'deny', 'en')).toBe(
      'Blocked: command can irreversibly destroy files, disks, or backups. Command: CMD. Reason: WHY. Use `mavis-trash <path>` for recoverable removal, or drop bypass for this call.',
    );

    const sniffed = safetyCheckReason({
      key: 'body.bash.bypassDeleteSniff',
      suffix: { key: 'body.bash.recoverableRemovalHint' },
    });
    expect(formatDecisionReason(sniffed, 'deny', 'en')).toBe(
      'Blocked: bypass mode does not auto-run delete-like commands. Use `mavis-trash <path>` for recoverable removal, or drop bypass for this call.',
    );
  });
});

describe('the engine and permission core share one key per sentence', () => {
  const failingChecker: ToolPermissionChecker = {
    checkPermissions: () => {
      throw new Error('checker exploded');
    },
  };
  const passthroughChecker: ToolPermissionChecker = {
    checkPermissions: () => ({ behavior: 'passthrough', reason: { type: 'sandbox' } }),
  };

  function bothOwners(toolName: string, checker?: ToolPermissionChecker) {
    const engine = new PermissionEngine();
    if (checker) engine.registerToolPermissionChecker(toolName, checker);
    const context = testContext();
    return {
      engine: engine.checkPermission(toolName, {}, context, { policyOwner: 'engine' }),
      core: engine.checkPermission(toolName, {}, context, { policyOwner: 'core' }),
    };
  }

  it('resolves the checker-error sentence to one key', () => {
    const { engine, core } = bothOwners('demo_tool', failingChecker);
    expect(bodyKey(engine.reason)).toBe('body.tool.checkerError');
    expect(bodyKey(core.reason)).toBe('body.tool.checkerError');
    expect(engine.reason.type === 'safetyCheck' && engine.reason.description).toBe(
      'Tool checker error: checker exploded',
    );
  });

  it('resolves the user-interaction sentence to one key', () => {
    const { engine, core } = bothOwners('question');
    expect(bodyKey(engine.reason)).toBe('body.tool.requiresUserInteraction');
    expect(bodyKey(core.reason)).toBe('body.tool.requiresUserInteraction');
    expect(engine.reason.type === 'safetyCheck' && engine.reason.description).toBe(
      'Tool "question" requires user interaction',
    );
  });

  it('resolves the missing-checker sentence to one key', () => {
    const { engine, core } = bothOwners('demo_tool');
    expect(bodyKey(engine.reason)).toBe('body.tool.noCheckerRegistered');
    expect(bodyKey(core.reason)).toBe('body.tool.noCheckerRegistered');
    expect(engine.reason.type === 'safetyCheck' && engine.reason.description).toBe(
      'No permission checker registered for tool "demo_tool", allowing by default',
    );
  });

  it('resolves the unmatched-rule sentence to one key', () => {
    const { engine, core } = bothOwners('demo_tool', passthroughChecker);
    expect(bodyKey(engine.reason)).toBe('body.tool.noMatchingRule');
    expect(bodyKey(core.reason)).toBe('body.tool.noMatchingRule');
    expect(engine.reason.type === 'safetyCheck' && engine.reason.description).toBe(
      'No permission rule matched for tool "demo_tool"',
    );
  });

  it('renders the shared sentences in Chinese for both owners', () => {
    const { engine, core } = bothOwners('demo_tool');
    expect(formatDecisionReason(engine.reason, 'allow', 'zh')).toBe(
      '已允许：工具 "demo_tool" 未注册权限校验器，默认放行',
    );
    expect(formatDecisionReason(core.reason, 'allow', 'zh')).toBe(
      '已允许：工具 "demo_tool" 未注册权限校验器，默认放行',
    );
  });
});
