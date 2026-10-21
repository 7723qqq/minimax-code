import { createCatalogSet, createCatalogText, resolveLocaleName } from '@mavis/shared/i18n';

import { EN_HEADLESS_COPY, type HeadlessCopyKey } from './copy.en.js';
import { ZH_HANS_HEADLESS_COPY } from './copy.zh-Hans.js';

const HEADLESS_CATALOG = createCatalogSet(EN_HEADLESS_COPY, {
  'zh-Hans': ZH_HANS_HEADLESS_COPY,
});

/**
 * Headless `mcode exec` copy lookup.
 *
 * Locale resolution lives in `@mavis/shared/i18n`, so the `MCODE_LOCALE`
 * override applies to the headless surface exactly as it does to the TUI.
 */
export const headlessText = createCatalogText(HEADLESS_CATALOG, resolveLocaleName);

/** Key type re-exported so callers import it from the catalog module. */
export type { HeadlessCopyKey };
