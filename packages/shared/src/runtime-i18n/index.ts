/**
 * Compatibility entry point for `@mavis/shared/runtime-i18n`.
 *
 * The implementation moved to `src/i18n/` when the five per-feature
 * localization modules were consolidated. This file stays so existing
 * specifiers keep resolving, and it re-exports only; it holds no logic and no
 * catalog, so there is one implementation rather than two.
 *
 * New code should import `@mavis/shared/i18n`.
 */

export {
  isChineseLocale as isChineseLocaleName,
  localeLanguage as getRuntimeLocaleLanguage,
  resolveLocaleName,
} from '../i18n/locale.js';
export {
  translateRuntimeText,
  type RuntimeLocaleName,
  type RuntimeTranslationKey,
  type RuntimeTranslations,
} from '../i18n/runtime-catalog.js';
export { EN_RUNTIME_TRANSLATIONS } from '../i18n/runtime-catalog.en.js';
export { ZH_HANS_RUNTIME_TRANSLATIONS } from '../i18n/runtime-catalog.zh-Hans.js';
