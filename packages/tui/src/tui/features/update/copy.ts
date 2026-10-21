import { createCatalogSet, createCatalogText, resolveLocaleName } from '@mavis/shared/i18n';

import { EN_UPDATE_COPY, type UpdateCopyKey } from './copy.en.js';
import { ZH_HANS_UPDATE_COPY } from './copy.zh-Hans.js';

const UPDATE_CATALOG = createCatalogSet(EN_UPDATE_COPY, {
  'zh-Hans': ZH_HANS_UPDATE_COPY,
});

/**
 * Update panel copy lookup.
 *
 * Locale resolution lives in `@mavis/shared/i18n`, so the update panel follows
 * the same locale as the rest of the TUI instead of reading the host itself.
 */
export const updateText = createCatalogText(UPDATE_CATALOG, resolveLocaleName);

/** Key type re-exported so callers import it from the catalog module. */
export type { UpdateCopyKey };
