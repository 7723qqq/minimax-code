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
    'Others is not supported in Telegram yet. Pick an option above.',
  'questionnaire.selected': '✓ Selected {label}',
  'questionnaire.expiredBody': 'Questionnaire expired',
  'questionnaire.submittedTitle': '✅ Submitted',
  'questionnaire.titleLine': 'Questionnaire: {title}',
  'questionnaire.selectionLine': 'Selected: {labels}',
  'questionnaire.noSelection': '—',
  'attachment.image': '[Image]',
  'attachment.audio': '[Audio]',
  'attachment.video': '[Video]',
  'attachment.file': '[File] {name}',
} as const;

const ZH_HANS_TELEGRAM_COPY = {
  'questionnaire.submittedOrExpired': '这个问卷已提交或过期',
  'questionnaire.expired': '这个问卷已过期',
  'questionnaire.submitting': '正在提交，请稍候',
  'questionnaire.answerCurrent': '请按当前题目作答',
  'questionnaire.optionUnavailable': '这个选项不可用',
  'questionnaire.othersUnsupported': 'Telegram 暂不支持 Others，请选择上方选项',
  'questionnaire.selected': '✓ 已选 {label}',
  'questionnaire.expiredBody': '问卷已过期',
  'questionnaire.submittedTitle': '✅ 已提交',
  'questionnaire.titleLine': '问卷：{title}',
  'questionnaire.selectionLine': '已选：{labels}',
  'questionnaire.noSelection': '—',
  'attachment.image': '[图片]',
  'attachment.audio': '[语音]',
  'attachment.video': '[视频]',
  'attachment.file': '[文件] {name}',
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
