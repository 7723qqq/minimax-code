import { createCatalogSet, createCatalogText, resolveLocaleName } from '@mavis/shared/i18n';

import { EN_TUI_UPDATE_COPY, type TuiUpdateCopyKey } from './copy.en.js';
import { ZH_HANS_TUI_UPDATE_COPY } from './copy.zh-Hans.js';

const TUI_UPDATE_CATALOG = createCatalogSet(EN_TUI_UPDATE_COPY, {
  'zh-Hans': ZH_HANS_TUI_UPDATE_COPY,
});

/**
 * TUI update copy lookup.
 *
 * Locale resolution lives in `@mavis/shared/i18n`, so the `MCODE_LOCALE`
 * override applies to the update surface exactly as it does elsewhere.
 */
export const tuiUpdateText = createCatalogText(TUI_UPDATE_CATALOG, resolveLocaleName);

/** Key type re-exported so callers import it from the catalog module. */
export type { TuiUpdateCopyKey };
