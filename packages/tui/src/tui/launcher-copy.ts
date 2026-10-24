import { createCatalogSet, createCatalogText, resolveLocaleName } from '@mavis/shared/i18n';

import { EN_LAUNCHER_COPY, type LauncherCopyKey } from './launcher-copy.en.js';
import { ZH_HANS_LAUNCHER_COPY } from './launcher-copy.zh-Hans.js';

const LAUNCHER_CATALOG = createCatalogSet(EN_LAUNCHER_COPY, {
  'zh-Hans': ZH_HANS_LAUNCHER_COPY,
});

/**
 * Launcher copy lookup.
 *
 * Locale resolution lives in `@mavis/shared/i18n`, so the `MCODE_LOCALE`
 * override applies to the launcher exactly as it does elsewhere.
 */
export const launcherText = createCatalogText(LAUNCHER_CATALOG, resolveLocaleName);

/** Key type re-exported so callers import it from the catalog module. */
export type { LauncherCopyKey };
