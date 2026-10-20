import { createCatalogSet, resolveLocaleName, translate } from '@mavis/shared/i18n';

/**
 * WeChat adapter copy.
 *
 * WeChat exposes no client-language signal, so the historical implementation
 * sent zh-Hans unconditionally. That decision is preserved: `wechatText`
 * defaults to zh-Hans, and an explicit locale exists so localization and tests
 * can render the other catalog without changing production behavior.
 */
const EN_WECHAT_COPY = {
  'questionnaire.header': '[Additional information needed] {title}',
  'attachment.image': '[Image]',
  'attachment.audio': '[Audio]',
  'attachment.video': '[Video]',
  'attachment.file': '[File] {name}',
  'questionnaire.freeTextHint': '(Reply with free text to answer)',
  'questionnaire.replyHint':
    'Reply with option numbers to select (separate multiple choices or questions with commas, e.g. 1,3). If no option fits, reply with free text.',
  'permission.header': '[Permission request]',
  'permission.tool': 'Tool: {tool}',
  'permission.actions': 'Reply /allow to allow once · /always to always allow · /deny to deny',
} as const;

const ZH_HANS_WECHAT_COPY = {
  'questionnaire.header': '【请补充信息】{title}',
  'attachment.image': '[图片]',
  'attachment.audio': '[语音]',
  'attachment.video': '[视频]',
  'attachment.file': '[文件] {name}',
  'questionnaire.freeTextHint': '（请直接输入文字作答）',
  'questionnaire.replyHint':
    '请回复编号选择（多选/多题用逗号分隔，中英文逗号均可，如 1,3 或 1，3）；无合适项可直接输入文字作答。',
  'permission.header': '【权限请求】',
  'permission.tool': '工具：{tool}',
  'permission.actions': '回复 /allow 允许本次 · /always 始终允许 · /deny 拒绝',
} as const satisfies Readonly<Record<keyof typeof EN_WECHAT_COPY, string>>;

const WECHAT_CATALOG = createCatalogSet(EN_WECHAT_COPY, { 'zh-Hans': ZH_HANS_WECHAT_COPY });

export type WechatCopyKey = keyof typeof EN_WECHAT_COPY;

/** WeChat has no client-language signal, so zh-Hans remains the default. */
export const WECHAT_DEFAULT_LOCALE = 'zh-Hans';

export function wechatText(
  key: WechatCopyKey,
  values?: Readonly<Record<string, string | number>>,
  locale: string = WECHAT_DEFAULT_LOCALE,
): string {
  return translate(WECHAT_CATALOG, resolveLocaleName(locale), key, values);
}
