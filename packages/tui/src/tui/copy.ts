import {
  createCatalogSet,
  createCatalogText,
  resolveLocaleName,
  type CatalogText,
} from '@mavis/shared/i18n';

import { EN_TUI_COPY, type TuiCopyKey } from './copy.en.js';
import { ZH_HANS_TUI_COPY } from './copy.zh-Hans.js';

const TUI_CATALOG = createCatalogSet(EN_TUI_COPY, {
  'zh-Hans': ZH_HANS_TUI_COPY,
});

/**
 * TUI copy lookup.
 *
 * The call shape matches every other catalog helper:
 *
 *   text(key)                    — host locale
 *   text(key, locale)            — explicit locale
 *   text(key, values)            — host locale with interpolation
 *   text(key, values, locale)    — both
 *
 * Lookup never throws: an unknown key falls back to English and finally to the
 * key itself.
 */
export const tuiText: CatalogText<TuiCopyKey> = createCatalogText(TUI_CATALOG, resolveLocaleName);

export { TUI_CATALOG };
export type { TuiCopyKey };
