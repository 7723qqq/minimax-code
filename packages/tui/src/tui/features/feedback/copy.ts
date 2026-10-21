import { createCatalogSet, createCatalogText, resolveLocaleName } from '@mavis/shared/i18n';

import { EN_FEEDBACK_COPY, type FeedbackCopyKey } from './copy.en.js';
import { ZH_HANS_FEEDBACK_COPY } from './copy.zh-Hans.js';

const FEEDBACK_CATALOG = createCatalogSet(EN_FEEDBACK_COPY, {
  'zh-Hans': ZH_HANS_FEEDBACK_COPY,
});

/**
 * Feedback panel copy lookup.
 *
 * Locale resolution lives in `@mavis/shared/i18n`; this module does not read
 * `Intl` itself, so an override applies uniformly across every feature.
 */
export const feedbackText = createCatalogText(FEEDBACK_CATALOG, resolveLocaleName);

/** Key type re-exported so callers import it from the catalog module. */
export type { FeedbackCopyKey };
