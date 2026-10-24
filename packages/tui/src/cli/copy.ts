import { createCatalogSet, createCatalogText, resolveLocaleName } from '@mavis/shared/i18n';

import { EN_CLI_COPY, type CliCopyKey } from './copy.en.js';
import { ZH_HANS_CLI_COPY } from './copy.zh-Hans.js';

const CLI_CATALOG = createCatalogSet(EN_CLI_COPY, {
  'zh-Hans': ZH_HANS_CLI_COPY,
});

/**
 * Command-line copy lookup.
 *
 * Locale resolution lives in `@mavis/shared/i18n`, so the `MCODE_LOCALE`
 * override and the host locale resolve the same way here as in every other
 * surface.
 */
export const cliText = createCatalogText(CLI_CATALOG, resolveLocaleName);

/** Key type re-exported so callers import it from the catalog module. */
export type { CliCopyKey };
