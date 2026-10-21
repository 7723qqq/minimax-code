import { createCatalogSet, translate, type CatalogSet } from './catalog.js';
import { resolveLocaleName, type LocaleName } from './locale.js';
import {
  EN_RUNTIME_TRANSLATIONS,
  type RuntimeTranslationKey,
  type RuntimeTranslations,
} from './runtime-catalog.en.js';
import { ZH_HANS_RUNTIME_TRANSLATIONS } from './runtime-catalog.zh-Hans.js';

/**
 * Catalog names this build can render.
 *
 * Aliased to the kernel's {@link LocaleName} so the resolver and the catalogs
 * can never disagree about which locale names exist.
 */
export type RuntimeLocaleName = LocaleName;

const RUNTIME_CATALOG: CatalogSet<typeof EN_RUNTIME_TRANSLATIONS> = createCatalogSet(
  EN_RUNTIME_TRANSLATIONS,
  { 'zh-Hans': ZH_HANS_RUNTIME_TRANSLATIONS },
);

/**
 * Translate one runtime key for a locale tag.
 *
 * `locale` accepts a full BCP 47 tag (`zh-CN`), a bare language (`zh`), or
 * `null`/`undefined` to use the host locale. `values` fills `{name}`
 * placeholders through the same interpolation every catalog uses, so callers
 * never concatenate sentences or replace tokens by hand. An unknown or missing
 * key falls back to English and finally to the key itself; this function never
 * throws.
 */
export function translateRuntimeText(
  locale: string | null | undefined,
  key: RuntimeTranslationKey,
  values?: Readonly<Record<string, string | number>>,
): string {
  return translate(RUNTIME_CATALOG, resolveLocaleName(locale), key, values);
}

export { RUNTIME_CATALOG, EN_RUNTIME_TRANSLATIONS, ZH_HANS_RUNTIME_TRANSLATIONS };
export type { RuntimeTranslationKey, RuntimeTranslations };
