/**
 * Locale helpers for local-runtime.
 *
 * Both helpers are re-exports of `@mavis/shared/i18n`: this module used to
 * define its own `isChineseLocale`, and the two implementations were free to
 * drift apart. Re-exporting keeps the module path and the export names that
 * existing callers import while leaving exactly one implementation, in the
 * shared package.
 */
export { isChineseLocale, localeLanguage as getLocaleLanguage } from '@mavis/shared/i18n';
