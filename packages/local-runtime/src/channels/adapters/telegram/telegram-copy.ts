import { createCatalogSet, resolveLocaleName, translate } from '@mavis/shared/i18n';

import { resolveLocalRuntimeLocale } from '../../../runtime/locale.js';

/**
 * Telegram adapter copy.
 *
 * Callback answers, attachment placeholders and the submitted-summary body were
 * hard-coded Chinese. They now follow the runtime locale like the other channel
 * transports; callback data, keyboard layout and settle behavior are unchanged.
 */
const EN_TELEGRAM_COPY = {
  'questionnaire.submittedOrExpired': 'This questionnaire has already been submitted or expired',
  'questionnaire.expired': 'This questionnaire has expired',
  'questionnaire.submitting': 'Submitting, please wait',
  'questionnaire.answerCurrent': 'Answer the current question first',
  'questionnaire.optionUnavailable': 'This option is not available',
  'questionnaire.othersUnsupported':
    '{others} is not supported in Telegram yet. Pick an option above.',
  'questionnaire.selected': '✓ Selected {label}',
  'questionnaire.expiredBody': 'Questionnaire expired',
  'questionnaire.submittedTitle': '✅ Submitted',
  'questionnaire.titleLine': 'Questionnaire: {title}',
  'questionnaire.titleOnly': 'Questionnaire',
  'questionnaire.stepLine': 'Q{index}: {question}',
  'questionnaire.chooseMultiple': 'Choose one or more options below.',
  'questionnaire.selectionLine': 'Selected: {labels}',
  'questionnaire.noSelection': '—',
  'questionnaire.stepCounter': 'Question {index}/{total}',
  'questionnaire.multipleHint':
    '(Telegram handles one single choice per question for now; pick the option that fits best)',
  'attachment.image': '[Image]',
  'attachment.audio': '[Audio]',
  'attachment.video': '[Video]',
  'attachment.file': '[File] {name}',
  'attachment.sendFailed': '[Media send failed: {name}]',
  'questionnaire.othersButton': 'Others...',
  'permission.header': 'Permission request',
  'permission.tool': 'Tool: {tool}',
  'permission.alwaysAllowed': 'Always allowed',
  'permission.denied': 'Denied',
  'permission.allowed': 'Allowed',
  'permission.decision.deniedLine': '🚫 {label}',
  'permission.decision.allowedLine': '✅ {label}',
  'permission.allow': 'Allow',
  'permission.deny': 'Deny',
  'permission.always': 'Always allow',
} as const;

const ZH_HANS_TELEGRAM_COPY = {
  'questionnaire.submittedOrExpired': '这个问卷已提交或过期',
  'questionnaire.expired': '这个问卷已过期',
  'questionnaire.submitting': '正在提交，请稍候',
  'questionnaire.answerCurrent': '请按当前题目作答',
  'questionnaire.optionUnavailable': '这个选项不可用',
  'questionnaire.othersUnsupported': 'Telegram 暂不支持 {others}，请选择上方选项',
  'questionnaire.selected': '✓ 已选 {label}',
  'questionnaire.expiredBody': '问卷已过期',
  'questionnaire.submittedTitle': '✅ 已提交',
  'questionnaire.titleLine': '问卷：{title}',
  'questionnaire.titleOnly': '问卷',
  'questionnaire.stepLine': '问题 {index}：{question}',
  'questionnaire.chooseMultiple': '请选择一个或多个选项。',
  'questionnaire.selectionLine': '已选：{labels}',
  'questionnaire.noSelection': '—',
  'questionnaire.stepCounter': '问题 {index}/{total}',
  'questionnaire.multipleHint': '（Telegram 目前按单选逐题处理，请先选择一个最合适的选项）',
  'attachment.image': '[图片]',
  'attachment.audio': '[语音]',
  'attachment.video': '[视频]',
  'attachment.file': '[文件] {name}',
  'attachment.sendFailed': '[媒体发送失败: {name}]',
  'questionnaire.othersButton': '其他…',
  'permission.header': '权限请求',
  'permission.tool': '工具：{tool}',
  'permission.alwaysAllowed': '已始终允许',
  'permission.denied': '已拒绝',
  'permission.allowed': '已允许',
  'permission.decision.deniedLine': '🚫 {label}',
  'permission.decision.allowedLine': '✅ {label}',
  'permission.allow': '允许',
  'permission.deny': '拒绝',
  'permission.always': '始终允许',
} as const satisfies Readonly<Record<keyof typeof EN_TELEGRAM_COPY, string>>;

const TELEGRAM_CATALOG = createCatalogSet(EN_TELEGRAM_COPY, {
  'zh-Hans': ZH_HANS_TELEGRAM_COPY,
});

export type TelegramCopyKey = keyof typeof EN_TELEGRAM_COPY;

export function telegramText(
  key: TelegramCopyKey,
  values?: Readonly<Record<string, string | number>>,
  locale: string = resolveLocalRuntimeLocale(),
): string {
  return translate(TELEGRAM_CATALOG, resolveLocaleName(locale), key, values);
}
