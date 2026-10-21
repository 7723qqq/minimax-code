import type { ChannelOutboundMessageInput } from './adapter.js';
import { resolveLocalRuntimeLocale } from '../runtime/locale.js';
import { createCatalogSet, resolveLocaleName, translate } from '@mavis/shared/i18n';

const ELECTRON_NET_FETCH_BYTESTRING_CODE = 'ELECTRON_NET_FETCH_BYTESTRING';
const ELECTRON_NET_FETCH_BYTESTRING_MESSAGE = 'Electron network response header is not supported';

/**
 * Outbound failure copy. Only these strings may reach an IM transport, so they
 * are catalog entries rather than inline locale ternaries.
 */
const EN_OUTBOUND_COPY = {
  'failure.execution':
    'This request could not be completed. Please try again later. If the issue persists, check the task details in the client or submit logs.',
  'failure.unsupportedUpstream':
    'The upstream service returned an incompatible response. This request could not be completed. Please try again later. If the issue persists, check the task details in the client or submit logs.',
} as const;

const ZH_HANS_OUTBOUND_COPY = {
  'failure.execution': '本次请求处理失败，请稍后重试。若持续失败，请在客户端查看任务详情或提交日志。',
  'failure.unsupportedUpstream':
    '上游服务返回了不兼容的响应，本次请求未完成，请稍后重试。若持续失败，请在客户端查看任务详情或提交日志。',
} as const satisfies Readonly<Record<keyof typeof EN_OUTBOUND_COPY, string>>;

const OUTBOUND_CATALOG = createCatalogSet(EN_OUTBOUND_COPY, {
  'zh-Hans': ZH_HANS_OUTBOUND_COPY,
});

/**
 * Converts an internal execution failure into the only form that may reach an
 * IM transport. The original text, media, questionnaire, and error detail can
 * contain partial output or sensitive upstream data, so none are retained.
 * Route metadata remains unchanged and the regular delivery path records only
 * the actual transport outcome.
 */
export function prepareChannelOutboundMessage(
  input: ChannelOutboundMessageInput,
): ChannelOutboundMessageInput {
  if (!input.error) return input;
  return {
    ctx: input.ctx,
    text: executionFailureReplyText(input.error),
    ...(input.sessionId ? { sessionId: input.sessionId } : {}),
    ...(input.queueItemId ? { queueItemId: input.queueItemId } : {}),
  };
}

function executionFailureReplyText(error: string): string {
  const localeName = resolveLocaleName(resolveLocalRuntimeLocale());
  if (
    error.includes(ELECTRON_NET_FETCH_BYTESTRING_CODE) ||
    error.includes(ELECTRON_NET_FETCH_BYTESTRING_MESSAGE)
  ) {
    return translate(OUTBOUND_CATALOG, localeName, 'failure.unsupportedUpstream');
  }
  return translate(OUTBOUND_CATALOG, localeName, 'failure.execution');
}
