import { createCatalogSet, createCatalogText, resolveLocaleName } from '@mavis/shared/i18n';

import { EN_INTERACTION_COPY, type InteractionCopyKey } from './copy.en.js';
import { ZH_HANS_INTERACTION_COPY } from './copy.zh-Hans.js';

const INTERACTION_CATALOG = createCatalogSet(EN_INTERACTION_COPY, {
  'zh-Hans': ZH_HANS_INTERACTION_COPY,
});

/**
 * Interaction copy lookup.
 *
 * Locale resolution lives in `@mavis/shared/i18n`, so an override applies
 * uniformly across every feature and the panels never read `Intl` themselves.
 */
export const interactionText = createCatalogText(INTERACTION_CATALOG, resolveLocaleName);

/** Key type re-exported so callers import it from the catalog module. */
export type { InteractionCopyKey };
