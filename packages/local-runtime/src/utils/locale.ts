import { isChineseLocale as isChineseLocaleName, localeLanguage } from '@mavis/shared/i18n';

/**
 * Locale helpers for local-runtime.
 *
 * Both functions delegate to `@mavis/shared/i18n`; the export names are kept
 * because they are imported across the runtime, and re-deriving the language
 * subtag here was how the two implementations drifted apart.
 */

/** Extract the canonical language subtag from a BCP 47 locale. */
export function getLocaleLanguage(locale?: string | null): string {
  return localeLanguage(locale);
}

export function isChineseLocale(locale?: string | null): boolean {
  return isChineseLocaleName(locale);
}
