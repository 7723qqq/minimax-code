import { createCatalogSet, createCatalogText, resolveLocaleName } from '@mavis/shared/i18n';

import { EN_QUEUE_COPY, type QueueCopyKey } from './copy.en.js';
import { ZH_HANS_QUEUE_COPY } from './copy.zh-Hans.js';

const QUEUE_CATALOG = createCatalogSet(EN_QUEUE_COPY, {
  'zh-Hans': ZH_HANS_QUEUE_COPY,
});

/**
 * Queue copy lookup.
 *
 * Locale resolution lives in `@mavis/shared/i18n`, so the queue panel follows
 * the same locale as the rest of the TUI instead of reading the host itself.
 */
export const queueText = createCatalogText(QUEUE_CATALOG, resolveLocaleName);

/** Key type re-exported so callers import it from the catalog module. */
export type { QueueCopyKey };
