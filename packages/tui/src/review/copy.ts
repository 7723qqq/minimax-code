import { createCatalogSet, createCatalogText, resolveLocaleName } from '@mavis/shared/i18n';

import { EN_TUI_REVIEW_COPY, type TuiReviewCopyKey } from './copy.en.js';
import { ZH_HANS_TUI_REVIEW_COPY } from './copy.zh-Hans.js';

const TUI_REVIEW_CATALOG = createCatalogSet(EN_TUI_REVIEW_COPY, {
  'zh-Hans': ZH_HANS_TUI_REVIEW_COPY,
});

/**
 * Code review copy lookup.
 *
 * Locale resolution lives in `@mavis/shared/i18n`, so the `MCODE_LOCALE`
 * override applies to the review surface exactly as it does elsewhere.
 */
export const tuiReviewText = createCatalogText(TUI_REVIEW_CATALOG, resolveLocaleName);

/** Key type re-exported so callers import it from the catalog module. */
export type { TuiReviewCopyKey };
