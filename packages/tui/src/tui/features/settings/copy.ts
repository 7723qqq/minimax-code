import { createCatalogSet, createCatalogText, resolveLocaleName } from '@mavis/shared/i18n';

import { EN_SETTINGS_ITEM_COPY, type SettingsItemCopyKey } from './copy.en.js';
import { ZH_HANS_SETTINGS_ITEM_COPY } from './copy.zh-Hans.js';

const SETTINGS_ITEM_CATALOG = createCatalogSet(EN_SETTINGS_ITEM_COPY, {
  'zh-Hans': ZH_HANS_SETTINGS_ITEM_COPY,
});

/**
 * Settings picker copy lookup.
 *
 * Locale resolution lives in `@mavis/shared/i18n`, so the pickers follow the
 * same override chain as every other feature.
 */
export const settingsItemText = createCatalogText(SETTINGS_ITEM_CATALOG, resolveLocaleName);

/** Key type re-exported so callers import it from the catalog module. */
export type { SettingsItemCopyKey };
