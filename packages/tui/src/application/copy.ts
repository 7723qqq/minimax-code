import { createCatalogSet, createCatalogText, resolveLocaleName } from '@mavis/shared/i18n';

import { EN_APPLICATION_COPY, type ApplicationCopyKey } from './copy.en.js';
import { ZH_HANS_APPLICATION_COPY } from './copy.zh-Hans.js';

const APPLICATION_CATALOG = createCatalogSet(EN_APPLICATION_COPY, {
  'zh-Hans': ZH_HANS_APPLICATION_COPY,
});

/**
 * TUI application copy lookup.
 *
 * Locale resolution lives in `@mavis/shared/i18n`, so the `MCODE_LOCALE`
 * override applies to the application layer exactly as it does elsewhere.
 */
export const applicationText = createCatalogText(APPLICATION_CATALOG, resolveLocaleName);

/** Key type re-exported so callers import it from the catalog module. */
export type { ApplicationCopyKey };
