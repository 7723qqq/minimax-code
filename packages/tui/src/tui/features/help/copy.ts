import { createCatalogSet, createCatalogText, resolveLocaleName } from '@mavis/shared/i18n';

import { EN_HELP_COPY, type HelpCopyKey } from './copy.en.js';
import { ZH_HANS_HELP_COPY } from './copy.zh-Hans.js';

const HELP_CATALOG = createCatalogSet(EN_HELP_COPY, {
  'zh-Hans': ZH_HANS_HELP_COPY,
});

/**
 * Help panel copy lookup.
 *
 * Locale resolution lives in `@mavis/shared/i18n`; this module does not read
 * `Intl` itself, so an override applies uniformly across every feature.
 */
export const helpText = createCatalogText(HELP_CATALOG, resolveLocaleName);

/** Key type re-exported so callers import it from the catalog module. */
export type { HelpCopyKey };
