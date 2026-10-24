import { createCatalogSet, resolveLocaleName, translate } from '@mavis/shared/i18n';

import { EN_BACKGROUND_TASK_COPY, type BackgroundTaskCopyKey } from './copy.en.js';
import { ZH_HANS_BACKGROUND_TASK_COPY } from './copy.zh-Hans.js';

const BACKGROUND_TASK_CATALOG = createCatalogSet(EN_BACKGROUND_TASK_COPY, {
  'zh-Hans': ZH_HANS_BACKGROUND_TASK_COPY,
});

/**
 * Look up one background-task lifecycle string.
 *
 * The runtime locale decides when `locale` is omitted, so task output follows
 * the user's interface language instead of the build language.
 */
export function backgroundTaskText(
  key: BackgroundTaskCopyKey,
  values?: Readonly<Record<string, string | number>>,
  locale?: string | null,
): string {
  return translate(BACKGROUND_TASK_CATALOG, resolveLocaleName(locale), key, values);
}

export type { BackgroundTaskCopyKey };
