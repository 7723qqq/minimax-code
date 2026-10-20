import { createCatalogSet, translate, type CatalogSet } from './catalog.js';
import { resolveLocaleName } from './locale.js';
import {
  EN_RUNTIME_TRANSLATIONS,
  type RuntimeTranslationKey,
  type RuntimeTranslations,
} from './runtime-catalog.en.js';
import { ZH_HANS_RUNTIME_TRANSLATIONS } from './runtime-catalog.zh-Hans.js';

/** Catalog names this build can render. A new language adds one member here. */
export type RuntimeLocaleName = 'en' | 'zh-Hans';

const RUNTIME_CATALOG: CatalogSet<typeof EN_RUNTIME_TRANSLATIONS> = createCatalogSet(
  EN_RUNTIME_TRANSLATIONS,
  { 'zh-Hans': ZH_HANS_RUNTIME_TRANSLATIONS },
);

/**
 * Translate one runtime key for a locale tag.
 *
 * `locale` accepts a full BCP 47 tag (`zh-CN`), a bare language (`zh`), or
 * `null`/`undefined` to use the host locale. An unknown or missing key falls
 * back to English and finally to the key itself; this function never throws.
 */
export function translateRuntimeText(
  locale: string | null | undefined,
  key: RuntimeTranslationKey,
): string {
  return translate(RUNTIME_CATALOG, resolveLocaleName(locale), key);
}

export { RUNTIME_CATALOG, EN_RUNTIME_TRANSLATIONS, ZH_HANS_RUNTIME_TRANSLATIONS };
export type { RuntimeTranslationKey, RuntimeTranslations };
