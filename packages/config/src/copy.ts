import {
  createCatalogSet,
  createCatalogText,
  resolveLocaleName,
  type CatalogText,
} from '@mavis/shared/i18n';

import { EN_CONFIG_COPY, type ConfigCopyKey } from './copy.en.js';
import { ZH_HANS_CONFIG_COPY } from './copy.zh-Hans.js';

const CONFIG_CATALOG = createCatalogSet(EN_CONFIG_COPY, {
  'zh-Hans': ZH_HANS_CONFIG_COPY,
});

/**
 * Configuration copy lookup.
 *
 * The call shape matches every other catalog helper:
 *
 *   text(key)                    — host locale
 *   text(key, locale)            — explicit locale
 *   text(key, values)            — host locale with interpolation
 *   text(key, values, locale)    — both
 *
 * Lookup never throws: an unknown key falls back to English and finally to the
 * key itself.
 */
export const configText: CatalogText<ConfigCopyKey> = createCatalogText(
  CONFIG_CATALOG,
  resolveLocaleName,
);

export { CONFIG_CATALOG };
export type { ConfigCopyKey };
