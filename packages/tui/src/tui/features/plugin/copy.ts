import { createCatalogSet, createCatalogText, resolveLocaleName } from '@mavis/shared/i18n';

import { EN_PLUGIN_COPY, type PluginCopyKey } from './copy.en.js';
import { ZH_HANS_PLUGIN_COPY } from './copy.zh-Hans.js';

const PLUGIN_CATALOG = createCatalogSet(EN_PLUGIN_COPY, {
  'zh-Hans': ZH_HANS_PLUGIN_COPY,
});

/**
 * Plugin manager copy lookup.
 *
 * Locale resolution lives in `@mavis/shared/i18n`; this module no longer reads
 * `Intl` itself, so an override applies uniformly across every feature.
 */
export const pluginText = createCatalogText(PLUGIN_CATALOG, resolveLocaleName);

/** Key type re-exported so callers import it from the catalog module. */
export type { PluginCopyKey };
