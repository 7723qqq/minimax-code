import type { UpdateCopyKey } from './copy.en.js';

/**
 * Simplified Chinese copy for the update panel.
 *
 * The `satisfies` clause is the completeness check: a key present in the
 * English catalog but absent here fails `pnpm typecheck`.
 */
export const ZH_HANS_UPDATE_COPY = {
  'update.error.installFailed': '无法安装本次更新。',
  'update.error.installNextStep': '请重试，或关闭此面板后稍后再试。',
  'update.error.installPreserved': '仍在运行上一个 MCode 版本。',
  'update.error.restartFailed': 'MCode 无法自动重启。',
  'update.error.restartNextStep': '请关闭此终端并重新启动 MCode。',
  'update.error.restartPreserved': '本次更新已经安装。',
  'update.review.title': '有可用的 MCode 更新',
  'update.review.updateNow': '立即更新',
  'update.review.notNow': '暂不更新',
  'update.review.hint': '↑↓ 选择 · Enter 确认 · d 详情 · Esc 关闭',
  'update.applying.title': '{frame} 正在更新 MCode',
  'update.applying.progress': '{phase} {version}，来源 {source}',
  'update.applying.latestOutput': '最新输出',
  'update.applying.cancelling': '正在安全取消… · d 详情',
  'update.applying.cancelHint': 'Esc 安全取消 · d 详情',
  'update.applying.finishing': '正在安全完成 · 取消已锁定 · d 详情',
  'update.paused.title': '更新已暂停',
  'update.paused.checkAgain': '› 重新检查',
  'update.hint.retryClose': 'Enter 重试 · Esc 关闭',
  'update.cancelled.title': '更新已安全取消',
  'update.cancelled.previousActive': '仍在运行上一个 MCode 安装版本。',
  'update.cancelled.tryAgain': '› 重新尝试',
  'update.failed.title': '× 更新失败',
  'update.failed.retry': '› 重试',
  'update.failed.hint': 'Enter 重试 · d 详情 · Esc 关闭',
  'update.success.title': '✓ MCode 已更新到 {version}',
  'update.success.restarting': '⠋ 正在重启 MCode…',
  'update.success.restartNow': '› 立即重启 MCode',
  'update.success.hint': 'Enter 重启 · Esc 稍后重启',
  'update.details.title': '详情',
  'update.details.pipeline': '签名 + 校验和 + 暂存 + 原子激活',
  'update.phase.checking': '正在检查',
  'update.phase.downloading': '正在下载',
  'update.phase.staging': '正在暂存',
  'update.phase.validating': '正在校验',
  'update.phase.activating': '正在激活',
  'update.phase.completed': '已完成',
  'update.phase.installing': '正在安装',
  'update.source.officialInstaller': '官方安装器',
} as const satisfies Readonly<Record<UpdateCopyKey, string>>;
