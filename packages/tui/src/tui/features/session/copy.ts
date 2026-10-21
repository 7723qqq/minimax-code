import { createCatalogSet, createCatalogText, resolveLocaleName } from '@mavis/shared/i18n';

import { EN_SESSION_COPY, type SessionCopyKey } from './copy.en.js';
import { ZH_HANS_SESSION_COPY } from './copy.zh-Hans.js';

const SESSION_CATALOG = createCatalogSet(EN_SESSION_COPY, {
  'zh-Hans': ZH_HANS_SESSION_COPY,
});

/**
 * Session manager copy lookup.
 *
 * Locale resolution lives in `@mavis/shared/i18n`, so the session manager
 * follows the same locale as the rest of the TUI instead of reading the host
 * itself.
 */
export const sessionText = createCatalogText(SESSION_CATALOG, resolveLocaleName);

/** Key type re-exported so callers import it from the catalog module. */
export type { SessionCopyKey };
