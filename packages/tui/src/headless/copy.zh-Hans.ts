import type { HeadlessCopyKey } from './copy.en.js';

/**
 * Simplified Chinese copy for the headless `mcode exec` surface.
 *
 * The `satisfies` clause is the completeness check: a key present in the
 * English catalog but absent here fails `pnpm typecheck`.
 */
export const ZH_HANS_HEADLESS_COPY = {
  'headless.error.runFailed': '本次运行失败：{reason}。请在连接恢复后重试。',
  'headless.error.runFailedWithReason': '本次运行失败{reason}。请在连接恢复后重试。',
  'headless.error.internalError':
    'MCode 遇到内部错误：{reason}。请重试；若问题持续存在，请通过可用的支持渠道反馈。',
  'headless.error.internalErrorWithReason':
    'MCode 遇到内部错误{reason}。请重试；若问题持续存在，请通过可用的支持渠道反馈。',
  'headless.error.timedOut': '本次运行已超时。请增大 --timeout 或重试。',
  'headless.error.stepLimit': '本次运行已达到步数上限。请增大 --max-steps 或缩小任务范围。',
  'headless.error.cancelled': '本次运行已取消。',
  'headless.error.configuration':
    '当前配置无法启动本次运行{reason}。请打开 MCode 并运行 /doctor。',
  'headless.contract.outputEmpty': '结构化输出为空。',
  'headless.contract.outputInvalidJson': '结构化输出不是合法的 JSON。',
  'headless.contract.outputSchemaMismatch': '结构化输出与 --output-schema 不匹配：{errors}',
  'headless.contract.interactionUnavailable': 'Runtime 在非交互式 Exec 宿主上请求了交互。',
  'headless.runner.shutdownIncomplete': 'Runtime 未干净地完成关闭。',
  'headless.runner.shutdownFailed': 'mcode exec 关闭失败。',
  'headless.runner.shutdownNextStep': '请确认没有仍在运行的进程。',
  'headless.runner.reviewResultMissing': 'Runtime 完成后没有可校验的代码评审结果。',
  'headless.runner.reviewResultInvalid': 'Runtime 返回了无效的代码评审结果。',
  'headless.output.pipeClosed': 'stdout 管道已关闭。',
  'headless.output.writerFailed': 'stdout 写入失败。',
} as const satisfies Readonly<Record<HeadlessCopyKey, string>>;
