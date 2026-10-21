import { createCatalogSet, createCatalogText, resolveLocaleName } from '@mavis/shared/i18n';

import { EN_AUTH_COPY, type AuthCopyKey } from './copy.en.js';
import { ZH_HANS_AUTH_COPY } from './copy.zh-Hans.js';

const AUTH_CATALOG = createCatalogSet(EN_AUTH_COPY, {
  'zh-Hans': ZH_HANS_AUTH_COPY,
});

/**
 * Authentication copy lookup.
 *
 * Locale resolution lives in `@mavis/shared/i18n`; this module does not read
 * `Intl` itself, so an override applies uniformly across every feature.
 */
export const authText = createCatalogText(AUTH_CATALOG, resolveLocaleName);

/** Key type re-exported so callers import it from the catalog module. */
export type { AuthCopyKey };
