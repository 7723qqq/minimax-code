import { createCatalogSet, createCatalogText, resolveLocaleName } from '@mavis/shared/i18n';

import { COMPOSER_COPY, type ComposerCopyKey } from './copy.en.js';
import { ZH_HANS_COMPOSER_COPY } from './copy.zh-Hans.js';

const COMPOSER_CATALOG = createCatalogSet(COMPOSER_COPY, {
  'zh-Hans': ZH_HANS_COMPOSER_COPY,
});

/**
 * Composer copy lookup.
 *
 * Locale resolution lives in `@mavis/shared/i18n`; this module no longer reads
 * `Intl` itself, so an override applies uniformly across every feature.
 */
export const composerText = createCatalogText(COMPOSER_CATALOG, resolveLocaleName);

/** Key type re-exported so callers import it from the catalog module. */
export type { ComposerCopyKey };
