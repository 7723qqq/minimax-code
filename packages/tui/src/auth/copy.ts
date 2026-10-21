import { createCatalogSet, createCatalogText, resolveLocaleName } from '@mavis/shared/i18n';

import { EN_TUI_AUTH_COPY, type TuiAuthCopyKey } from './copy.en.js';
import { ZH_HANS_TUI_AUTH_COPY } from './copy.zh-Hans.js';

const TUI_AUTH_CATALOG = createCatalogSet(EN_TUI_AUTH_COPY, {
  'zh-Hans': ZH_HANS_TUI_AUTH_COPY,
});

/**
 * TUI authentication copy lookup.
 *
 * Locale resolution lives in `@mavis/shared/i18n`, so the `MCODE_LOCALE`
 * override applies to the authentication surface exactly as it does elsewhere.
 */
export const tuiAuthText = createCatalogText(TUI_AUTH_CATALOG, resolveLocaleName);

/** Key type re-exported so callers import it from the catalog module. */
export type { TuiAuthCopyKey };
