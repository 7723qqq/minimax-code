import { createCatalogSet, createCatalogText, resolveLocaleName } from '@mavis/shared/i18n';

import { EN_V2_TURN_SYSTEM_COPY, type V2TurnSystemCopyKey } from './copy.en.js';
import { ZH_HANS_V2_TURN_SYSTEM_COPY } from './copy.zh-Hans.js';

const V2_TURN_SYSTEM_CATALOG = createCatalogSet(EN_V2_TURN_SYSTEM_COPY, {
  'zh-Hans': ZH_HANS_V2_TURN_SYSTEM_COPY,
});

/**
 * v2 turn-system copy lookup.
 *
 * Locale resolution lives in `@mavis/shared/i18n`, so a locale pinned for the
 * process applies to the turn-system warnings the same way it applies to every
 * other surface.
 */
export const v2TurnSystemText = createCatalogText(V2_TURN_SYSTEM_CATALOG, resolveLocaleName);

/** Key type re-exported so callers import it from the catalog module. */
export type { V2TurnSystemCopyKey };
