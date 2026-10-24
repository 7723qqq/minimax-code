import type { FeedbackCopyKey } from './copy.en.js';

/**
 * Simplified Chinese copy for the feedback panel.
 *
 * The `satisfies` clause is the completeness check: a key present in the
 * English catalog but absent here fails `pnpm typecheck`.
 */
export const ZH_HANS_FEEDBACK_COPY = {
  failureSummary: '无法发送反馈。',
  failureNextStep: '请重试，或关闭此面板后稍后再试。',
  failurePreservation: '已审阅的草稿仍然保留。',
  reviewTitle: '审阅反馈',
  whatWillBeSent: '将发送的内容',
  reviewScope: '反馈正文、受限的设备与 Runtime 详情。',
  reviewScopeWithDiagnostics: '反馈正文、受限的设备与 Runtime 详情，以及省略原始内容的诊断计数。',
  reviewNoRawData:
    '不会上传原始附件、对话内容、提示词、工具输出、路径或自由文本日志。发送前请审阅反馈正文。',
  reviewHint: 'Enter 发送 · d 详情 · Esc 取消',
  cancellingSafely: '{frame} 正在安全取消',
  cancellingSafelyBody: '正在停止当前上传，并等待 Runtime 确认取消。',
  cancellingSafelyHint: '请稍候 · d 详情',
  sendingFeedback: '{frame} 正在发送反馈',
  sendingHint: 'Esc 安全取消 · d 详情',
  uploadStopped: '上传已停止。若取消发生得较晚，请在重试前查看 My Feedback。',
  cancelledHint: 'Enter/Esc 关闭',
  failedHint: 'Enter 重试 · d 详情 · Esc 关闭',
  retryAction: '› 重试',
  succeededHint: 'Enter/Esc 关闭 · d 详情',
  ticket: '工单 {id}',
  successBody: '反馈已成功创建。',
  preparingDetails: '正在准备详情',
  uploadingDiagnostics: '正在上传诊断信息',
  creatingTicket: '正在创建工单',
  uploadId: '上传 ID  {id}',
  phasePreparing: '正在检查待上传的数据与账号。',
  phaseUploadingDiagnostics: '正在上传已审阅并脱敏的诊断信息包。',
  phaseCreatingTicket: '正在创建反馈工单并等待回执。',
} as const satisfies Readonly<Record<FeedbackCopyKey, string>>;
