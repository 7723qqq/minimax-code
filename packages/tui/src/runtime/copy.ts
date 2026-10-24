import { createCatalogSet, createCatalogText, resolveLocaleName } from '@mavis/shared/i18n';

import { EN_TUI_RUNTIME_COPY, type TuiRuntimeCopyKey } from './copy.en.js';
import { ZH_HANS_TUI_RUNTIME_COPY } from './copy.zh-Hans.js';

const TUI_RUNTIME_CATALOG = createCatalogSet(EN_TUI_RUNTIME_COPY, {
  'zh-Hans': ZH_HANS_TUI_RUNTIME_COPY,
});

/**
 * TUI runtime copy lookup.
 *
 * Locale resolution lives in `@mavis/shared/i18n`, so the `MCODE_LOCALE`
 * override applies to the runtime layer exactly as it does elsewhere.
 */
export const tuiRuntimeText = createCatalogText(TUI_RUNTIME_CATALOG, resolveLocaleName);

/** Key type re-exported so callers import it from the catalog module. */
export type { TuiRuntimeCopyKey };
