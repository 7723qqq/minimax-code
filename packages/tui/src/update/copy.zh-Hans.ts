import type { TuiUpdateCopyKey } from './copy.en.js';

/**
 * Simplified Chinese copy for the TUI update and prefix-activation surface.
 *
 * The `satisfies` clause is the completeness check: a key present in the
 * English catalog but absent here fails `pnpm typecheck`.
 */
export const ZH_HANS_TUI_UPDATE_COPY = {
  'update.prefix.activationScheduled': '已暂存的 MCode 更新将在当前进程退出后生效。',
  'update.prefix.journalScheduleFailed': 'MCode 更新已暂存，但无法安排激活日志。',
  'update.prefix.nonPrefixPlan': 'MCode npm prefix 更新器收到了非 prefix 更新计划。',
  'update.prefix.ownershipMissing': '缺少 MCode npm prefix 的归属信息。',
  'update.prefix.pendingActivation.default':
    'MCode {version} 已暂存。重启后将在正在运行的 MCode 会话退出后继续激活。',
  'update.prefix.pendingActivation.blocking.one':
    'MCode {version} 已暂存。激活将等待另外 {count} 个 MCode 会话退出。',
  'update.prefix.pendingActivation.blocking.many':
    'MCode {version} 已暂存。激活将等待另外 {count} 个 MCode 会话退出。',
  'update.prefix.pendingActivation.immediate':
    'MCode {version} 已暂存，将在当前进程退出后生效。',
  'update.prefix.pendingCleanup.default':
    'MCode {version} 已生效。重启后将在正在运行的 MCode 会话退出后完成更新清理。',
  'update.prefix.pendingCleanup.blocking.one':
    'MCode {version} 已生效。更新清理将等待另外 {count} 个 MCode 会话退出。',
  'update.prefix.pendingCleanup.blocking.many':
    'MCode {version} 已生效。更新清理将等待另外 {count} 个 MCode 会话退出。',
  'update.prefix.pendingCleanup.immediate': 'MCode {version} 已生效，重启后将完成更新清理。',
  'update.prefix.stagedVersionMismatch': 'MCode 更新已暂存 {actualVersion}，预期为 {expectedVersion}。',
  'update.prefix.staged.default':
    'MCode {version} 已下载并安全暂存，正在等待正在运行的 MCode 会话退出后激活。',
  'update.prefix.staged.blocking.one':
    'MCode {version} 已下载并安全暂存，正在等待另外 {count} 个 MCode 会话退出后激活。',
  'update.prefix.staged.blocking.many':
    'MCode {version} 已下载并安全暂存，正在等待另外 {count} 个 MCode 会话退出后激活。',
  'update.prefix.staged.immediate':
    'MCode {version} 已下载并安全暂存，将在当前进程退出后生效。',
  'update.prefix.notStaged': 'MCode {version} 未暂存，当前生效的安装版本未变：{reason}',
  'update.versionedAlreadyActive': 'MCode {version} 已生效。',
  'update.installedVersionMismatch':
    'MCode 更新安装了 {installedVersion}，预期为 {latestVersion}。',
} as const satisfies Readonly<Record<TuiUpdateCopyKey, string>>;
