import {
  createCatalogSet,
  createCatalogText,
  resolveLocaleName,
  type CatalogText,
} from '@mavis/shared/i18n';

import { EN_SHELL_COPY, type ShellCopyKey } from './copy.en.js';
import { ZH_HANS_SHELL_COPY } from './copy.zh-Hans.js';

const SHELL_CATALOG = createCatalogSet(EN_SHELL_COPY, {
  'zh-Hans': ZH_HANS_SHELL_COPY,
});

/**
 * Shell copy lookup.
 *
 * The call shape matches every other catalog helper:
 *
 *   text(key)                    — host locale
 *   text(key, locale)            — explicit locale
 *   text(key, values)            — host locale with interpolation
 *   text(key, values, locale)    — both
 *
 * `locale` accepts a full BCP 47 tag (`zh-CN`), a bare language (`zh`), or
 * `null`/`undefined` to use the host locale. Lookup never throws: an unknown
 * key falls back to English and finally to the key itself.
 */
export const shellText: CatalogText<ShellCopyKey> = createCatalogText(
  SHELL_CATALOG,
  resolveLocaleName,
);

export { SHELL_CATALOG };
export type { ShellCopyKey };
