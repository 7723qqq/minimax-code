/**
 * Compatibility entry point for `@mavis/shared/runtime-i18n`.
 *
 * The implementation moved to `src/i18n/` when the five per-feature
 * localization modules were consolidated. This file stays so existing
 * specifiers keep resolving; it re-exports only, holds no logic and no catalog,
 * so there is one implementation rather than two.
 *
 * New code should import `@mavis/shared/i18n`.
 */

export { localeLanguage as getRuntimeLocaleLanguage } from '../i18n/locale.js';
export { translateRuntimeText, type RuntimeTranslationKey } from '../i18n/runtime-catalog.js';
