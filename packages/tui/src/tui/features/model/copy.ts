import { createCatalogSet, createCatalogText, resolveLocaleName } from '@mavis/shared/i18n';

import { EN_MODEL_COPY, type ModelCopyKey } from './copy.en.js';
import { ZH_HANS_MODEL_COPY } from './copy.zh-Hans.js';

const MODEL_CATALOG = createCatalogSet(EN_MODEL_COPY, {
  'zh-Hans': ZH_HANS_MODEL_COPY,
});

/**
 * Model picker copy lookup.
 *
 * Locale resolution lives in `@mavis/shared/i18n`; this module no longer reads
 * `Intl` itself, so an override applies uniformly across every feature.
 */
export const modelText = createCatalogText(MODEL_CATALOG, resolveLocaleName);

/** Key type re-exported so callers import it from the catalog module. */
export type { ModelCopyKey };
