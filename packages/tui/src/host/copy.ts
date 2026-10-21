import { createCatalogSet, createCatalogText, resolveLocaleName } from '@mavis/shared/i18n';

import { EN_HOST_COPY, type HostCopyKey } from './copy.en.js';
import { ZH_HANS_HOST_COPY } from './copy.zh-Hans.js';

const HOST_CATALOG = createCatalogSet(EN_HOST_COPY, {
  'zh-Hans': ZH_HANS_HOST_COPY,
});

/**
 * TUI host copy lookup.
 *
 * Locale resolution lives in `@mavis/shared/i18n`, so the `MCODE_LOCALE`
 * override applies to the host layer exactly as it does elsewhere.
 */
export const hostText = createCatalogText(HOST_CATALOG, resolveLocaleName);

/** Key type re-exported so callers import it from the catalog module. */
export type { HostCopyKey };
