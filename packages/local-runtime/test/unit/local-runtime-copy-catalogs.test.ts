import { describe, expect, it } from 'bun:test';

import { EN_BACKGROUND_TASK_COPY } from '../../src/background-task/copy.en.js';
import { ZH_HANS_BACKGROUND_TASK_COPY } from '../../src/background-task/copy.zh-Hans.js';
import { backgroundTaskText } from '../../src/background-task/copy.js';
import { EN_PERMISSION_COPY } from '../../src/permissions/copy.en.js';
import { ZH_HANS_PERMISSION_COPY } from '../../src/permissions/copy.zh-Hans.js';
import { permissionReasonText } from '../../src/permissions/copy.js';

/**
 * Catalog completeness for the local-runtime copy catalogs.
 *
 * The `satisfies` clause in each translation already makes a missing key a
 * compile error. This suite keeps the guarantees the type system cannot
 * express: a non-empty template on both sides, and the same set of `{name}`
 * placeholders in both, so an English template and a Chinese one can never
 * end up filling different arguments.
 */
const CATALOGS: ReadonlyArray<
  readonly [
    name: string,
    english: Readonly<Record<string, string>>,
    chinese: Readonly<Record<string, string>>,
  ]
> = [
  ['permission', EN_PERMISSION_COPY, ZH_HANS_PERMISSION_COPY],
  ['background-task', EN_BACKGROUND_TASK_COPY, ZH_HANS_BACKGROUND_TASK_COPY],
];

function placeholders(value: string): string[] {
  return [...value.matchAll(/\{([A-Za-z0-9_.-]+)\}/gu)].map((match) => match[1]);
}

describe('local-runtime copy catalogs', () => {
  it('covers both catalog surfaces', () => {
    expect(CATALOGS.length).toBe(2);
  });

  it.each(CATALOGS)('%s translates every English key into Chinese', (_name, english, chinese) => {
    expect(Object.keys(chinese).sort()).toEqual(Object.keys(english).sort());
  });

  it.each(CATALOGS)('%s keeps every template non-empty in both languages', (_name, english, chinese) => {
    for (const [key, value] of Object.entries(english)) {
      expect(value.trim(), `en ${key}`).not.toBe('');
    }
    for (const [key, value] of Object.entries(chinese)) {
      expect(value.trim(), `zh ${key}`).not.toBe('');
    }
  });

  it.each(CATALOGS)(
    '%s preserves the same placeholders in both languages',
    (_name, english, chinese) => {
      for (const [key, value] of Object.entries(english)) {
        expect(placeholders(chinese[key] ?? ''), `zh ${key}`).toEqual(placeholders(value));
      }
    },
  );
});

describe('permission reason copy', () => {
  it('keeps the English wording verbatim', () => {
    expect(EN_PERMISSION_COPY['ask.curlPipeShell']).toBe(
      'Local permission check requires approval: curl-pipe-shell command.',
    );
    expect(EN_PERMISSION_COPY['policy.websiteDeployApproval']).toBe(
      'Local permission check requires approval: website_deploy publishes files to a public endpoint on this device network context.',
    );
    expect(EN_PERMISSION_COPY['policy.sensitiveCredentialPath']).toBe(
      'Local hard safety policy blocked {tool}: sensitive credential path in {path}',
    );
  });

  it('renders both languages through the catalog', () => {
    expect(permissionReasonText('ask.recursiveRm', undefined, 'en-US')).toBe(
      'Local permission check requires approval: recursive rm command.',
    );
    expect(permissionReasonText('ask.recursiveRm', undefined, 'zh-CN')).toBe(
      '本地权限检查需要确认：递归 rm 命令。',
    );
  });

  it('fills the same placeholders in both languages', () => {
    expect(
      permissionReasonText('ask.workspaceEscape', { tool: 'write', target: '/etc/hosts' }, 'en-US'),
    ).toBe('Local permission check requires approval: write path escapes workspace (/etc/hosts).');
    expect(
      permissionReasonText('ask.workspaceEscape', { tool: 'write', target: '/etc/hosts' }, 'zh-CN'),
    ).toBe('本地权限检查需要确认：write 的路径超出工作区范围（/etc/hosts）。');
  });

  it('keeps the agent-facing deletion instruction untranslated', () => {
    const instruction = 'Deletion intent detected. The target was not deleted.';
    expect(
      permissionReasonText(
        'deletion.trashUnavailable',
        { reason: 'mavis-trash is not executable', instruction },
        'zh-CN',
      ),
    ).toContain(instruction);
  });

  it('renders the plugin-hook Plan mode rejection in both languages', () => {
    // The `{mode}` placeholder carries the Plan mode label from the shared
    // runtime catalog; the `plan` token stays the permission-mode value.
    expect(
      permissionReasonText('pluginHook.planModeUnsupported', { mode: 'Plan mode' }, 'en-US'),
    ).toBe(
      'Plugin Hook setMode(plan) is not supported because MiniMax Plan mode has a separate Turn lifecycle.',
    );
    expect(
      permissionReasonText('pluginHook.planModeUnsupported', { mode: '计划模式' }, 'zh-CN'),
    ).toBe('Plugin Hook setMode(plan) 不受支持，因为 MiniMax 计划模式拥有独立的 Turn 生命周期。');
  });
});

describe('background task copy', () => {
  it('keeps the English wording verbatim', () => {
    expect(EN_BACKGROUND_TASK_COPY['task.failed']).toBe('Background task failed: {message}');
    expect(EN_BACKGROUND_TASK_COPY['task.restartedBeforeCompleted']).toBe(
      'Local runtime restarted before task completed',
    );
    expect(EN_BACKGROUND_TASK_COPY['turn.restartedBeforeCompleted']).toBe(
      'Local runtime restarted before this turn completed.',
    );
  });

  it('renders both languages through the catalog', () => {
    expect(backgroundTaskText('task.failed', { message: 'boom' }, 'en-US')).toBe(
      'Background task failed: boom',
    );
    expect(backgroundTaskText('task.failed', { message: 'boom' }, 'zh-CN')).toBe(
      '后台任务失败：boom',
    );
    expect(backgroundTaskText('turn.restartedBeforeCompleted', undefined, 'zh-CN')).toBe(
      '本地 Runtime 在当前 Turn 完成前已重启。',
    );
  });
});
