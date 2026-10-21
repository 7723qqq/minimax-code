import { createCatalogSet, createCatalogText, resolveLocaleName } from '@mavis/shared/i18n';

import { EN_HISTORY_COPY, type HistoryCopyKey } from './copy.en.js';
import { ZH_HANS_HISTORY_COPY } from './copy.zh-Hans.js';

const HISTORY_CATALOG = createCatalogSet(EN_HISTORY_COPY, {
  'zh-Hans': ZH_HANS_HISTORY_COPY,
});

/**
 * Prompt history copy lookup.
 *
 * Locale resolution lives in `@mavis/shared/i18n`; this module does not read
 * `Intl` itself, so an override applies uniformly across every feature.
 */
export const historyText = createCatalogText(HISTORY_CATALOG, resolveLocaleName);

/** Key type re-exported so callers import it from the catalog module. */
export type { HistoryCopyKey };
