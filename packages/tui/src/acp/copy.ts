import { createCatalogSet, createCatalogText, resolveLocaleName } from '@mavis/shared/i18n';

import { EN_ACP_COPY, type AcpCopyKey } from './copy.en.js';
import { ZH_HANS_ACP_COPY } from './copy.zh-Hans.js';

const ACP_CATALOG = createCatalogSet(EN_ACP_COPY, {
  'zh-Hans': ZH_HANS_ACP_COPY,
});

/**
 * ACP chat reply and error copy lookup.
 *
 * Locale resolution lives in `@mavis/shared/i18n`, so the `MCODE_LOCALE`
 * override applies to the ACP surface exactly as it does to the TUI.
 */
export const acpText = createCatalogText(ACP_CATALOG, resolveLocaleName);

/** Key type re-exported so callers import it from the catalog module. */
export type { AcpCopyKey };
