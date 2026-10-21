import { createCatalogSet, resolveLocaleName, translate } from '@mavis/shared/i18n';

import { resolveLocalRuntimeLocale } from '../../../runtime/locale.js';

/**
 * Feishu card copy.
 *
 * Card text, button labels and status tags were hard-coded Chinese, so an
 * English-locale deployment produced Chinese cards. The copy now comes from a
 * catalog selected by the runtime locale; card structure, button actions,
 * callback values and tag semantics are unchanged.
 */
const EN_FEISHU_COPY = {
  'image.alt': 'Image',
  'card.subtitle.ask': 'ask',
  'card.subtitle.permission': 'permission',
  'option.emptyLabel': '(empty)',
  'attachment.image': '[Image]',
  'attachment.audio': '[Audio]',
  'attachment.video': '[Video]',
  'attachment.file': '[File] {name}',
  'questionnaire.multiple': 'Multiple choices',
  'questionnaire.select': 'Select',
  'questionnaire.submit': 'Submit',
  'tag.questionnaire': 'Questionnaire',
  'tag.submitted': 'Submitted',
  'tag.expired': 'Expired',
  'body.submitted': '✅ **Submitted**',
  'body.expired': '⌛ **This questionnaire has expired**',
  'permission.allowedOnce': 'Allowed (this time)',
  'permission.allowedAlways': 'Always allowed',
  'permission.denied': 'Denied',
  'permission.handled': 'Handled',
  'permission.title': '**🔐 Tool authorization request**',
  'permission.tool': '**Tool**: `{tool}`',
  'permission.reason': '**Reason**: {reason}',
  'permission.grant': '**Will grant**:',
  'permission.tag': 'Authorization',
  'permission.allowOnce': 'Allow once',
  'permission.always': 'Always allow',
  'permission.deny': 'Deny',
  'permission.actor': "<font color='grey'>Actor <at id={id}></at></font>",
  'permission.tagAuthorized': 'Authorized',
  'permission.tagDenied': 'Denied',
  'reply.processing': 'Processing',
  'reply.thinking': '🤔 Thinking…',
  'reply.tag': 'Reply',
  'media.sent': '[Media sent]',
  'toast.handled': 'Handled',
  'toast.questionnaireTerminal': 'This questionnaire was already handled or expired',
  'toast.questionnaireSubmitted': 'Submitted',
  'toast.submitFailed': 'Submission failed. Please try again later.',
  'resource.receiveFailed':
    'Sorry, this file could not be received. Please rename it to use English letters or digits, keep the extension, and send it again.',
} as const;

const ZH_HANS_FEISHU_COPY = {
  'image.alt': '配图',
  'card.subtitle.ask': '提问',
  'card.subtitle.permission': '权限',
  'option.emptyLabel': '（空）',
  'attachment.image': '[图片]',
  'attachment.audio': '[语音]',
  'attachment.video': '[视频]',
  'attachment.file': '[文件] {name}',
  'questionnaire.multiple': '可多选',
  'questionnaire.select': '请选择',
  'questionnaire.submit': '提交',
  'tag.questionnaire': '问卷',
  'tag.submitted': '已提交',
  'tag.expired': '已过期',
  'body.submitted': '✅ **已提交**',
  'body.expired': '⌛ **该问卷已过期**',
  'permission.allowedOnce': '已允许(本次)',
  'permission.allowedAlways': '已始终允许',
  'permission.denied': '已拒绝',
  'permission.handled': '已处理',
  'permission.title': '**🔐 工具授权请求**',
  'permission.tool': '**工具**: `{tool}`',
  'permission.reason': '**原因**: {reason}',
  'permission.grant': '**将授予**:',
  'permission.tag': '授权',
  'permission.allowOnce': '仅本次允许',
  'permission.always': '始终允许',
  'permission.deny': '拒绝',
  'permission.actor': "<font color='grey'>操作人 <at id={id}></at></font>",
  'permission.tagAuthorized': '已授权',
  'permission.tagDenied': '已拒绝',
  'reply.processing': '处理中',
  'reply.thinking': '🤔 思考中…',
  'reply.tag': '回复',
  'media.sent': '[已发送媒体]',
  'toast.handled': '已处理',
  'toast.questionnaireTerminal': '该问卷已处理或已过期',
  'toast.questionnaireSubmitted': '已提交',
  'toast.submitFailed': '提交失败，请稍后再试',
  'resource.receiveFailed':
    '抱歉，这个文件暂时没能接收成功。请尝试将文件名中的中文改为英文或数字，保留扩展名后重新发送。',
} as const satisfies Readonly<Record<keyof typeof EN_FEISHU_COPY, string>>;

const FEISHU_CATALOG = createCatalogSet(EN_FEISHU_COPY, { 'zh-Hans': ZH_HANS_FEISHU_COPY });

export type FeishuCopyKey = keyof typeof EN_FEISHU_COPY;

export function feishuText(
  key: FeishuCopyKey,
  values?: Readonly<Record<string, string | number>>,
  locale: string = resolveLocalRuntimeLocale(),
): string {
  return translate(FEISHU_CATALOG, resolveLocaleName(locale), key, values);
}
