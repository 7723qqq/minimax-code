import { createCatalogSet, createCatalogText, resolveLocaleName } from '@mavis/shared/i18n';

import { EN_V2_CONVERSATION_COPY, type V2ConversationCopyKey } from './copy.en.js';
import { ZH_HANS_V2_CONVERSATION_COPY } from './copy.zh-Hans.js';

const V2_CONVERSATION_CATALOG = createCatalogSet(EN_V2_CONVERSATION_COPY, {
  'zh-Hans': ZH_HANS_V2_CONVERSATION_COPY,
});

/**
 * v2 conversation copy lookup.
 *
 * Locale resolution lives in `@mavis/shared/i18n`, so a locale pinned for the
 * process applies to the admission failures the same way it applies to every
 * other surface.
 */
export const v2ConversationText = createCatalogText(V2_CONVERSATION_CATALOG, resolveLocaleName);

/** Key type re-exported so callers import it from the catalog module. */
export type { V2ConversationCopyKey };
