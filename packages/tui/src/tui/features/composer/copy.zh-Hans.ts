import type { ComposerCopyKey } from './copy.en.js';

/**
 * Simplified Chinese copy for the composer.
 *
 * The `satisfies` clause is the completeness check: a key present in the
 * English catalog but absent here fails `pnpm typecheck`.
 */
export const ZH_HANS_COMPOSER_COPY = {
  imagePreviewLoading: '正在加载预览…',
  imagePreviewUnavailable: '无法预览 · 附件仍可发送',
  imagePreviewTextOnly: '当前终端不支持显示图片预览',
  imagePreviewHint: 'Esc 收起 · Enter 发送',
  placeholder: '让 MCode 做任何事',
  draftSaveFailed: '无法保存草稿恢复备份。',
  draftCleanupFailed: '无法清理草稿恢复备份。',
  draftMigrationFailed: '无法将草稿恢复备份迁移到当前会话。',
  draftRestoreFailed: '无法读取草稿恢复备份。',
  draftRecoveryUnavailable: '可继续正常使用 MCode，重启后可能无法恢复未发送内容。',
  draftCleanupNextStep: '磁盘上可能仍保留旧草稿或附件备份。',
  attachmentPathRequired: '必须提供附件路径。',
  attachmentFailed: '无法附加 {reference}：{reason}',
  attachmentNotAFile: '无法附加 {reference}：该路径不是文件。',
  attachmentEmptyPath: '无法添加空的附件路径。',
  attachmentAlreadyAttached: '已为下一条消息附加：{fileName}',
  attachmentLimitFiles: '最多可附加 {count} 个文件。请先移除一个再添加。',
  attachmentLimitSize: '附件总大小最多 {limit}。请移除一个附件或选择更小的文件。',
  clipboardUnavailable: '当前环境不支持剪贴板粘贴。请保存媒体文件后用 @ 引用。',
  clipboardReading: '正在读取剪贴板…',
  clipboardFailed: '请重新复制图片或视频文件，或用 @ 附加已保存的文件。',
  clipboardPasteFailed: '无法从剪贴板粘贴媒体。',
  draftRestored: '草稿已恢复 · {parts}',
  draftPartText: '文本',
  draftPartAttachmentOne: '{count} 个附件',
  draftPartAttachmentMany: '{count} 个附件',
  draftAdmissionStopped: 'MCode 在 Runtime 准入完成前停止。',
  draftAbortedReturned: '已中止的提交已退回输入框。',
} as const satisfies Readonly<Record<ComposerCopyKey, string>>;
