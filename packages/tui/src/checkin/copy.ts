import { createCatalogSet, createCatalogText, resolveLocaleName } from '@mavis/shared/i18n';

import { EN_CHECKIN_COPY, type CheckinCopyKey } from './copy.en.js';
import { ZH_HANS_CHECKIN_COPY } from './copy.zh-Hans.js';

const CHECKIN_CATALOG = createCatalogSet(EN_CHECKIN_COPY, {
  'zh-Hans': ZH_HANS_CHECKIN_COPY,
});

/**
 * Daily check-in copy lookup.
 *
 * Locale resolution lives in `@mavis/shared/i18n`, so the `MCODE_LOCALE`
 * override applies to the check-in surface exactly as it does elsewhere.
 */
export const checkinText = createCatalogText(CHECKIN_CATALOG, resolveLocaleName);

/** Key type re-exported so callers import it from the catalog module. */
export type { CheckinCopyKey };
