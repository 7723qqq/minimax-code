/**
 * Runtime i18n: one locale resolver, one catalog contract, one lookup path.
 *
 * This module replaces five independent implementations:
 *
 *   - `@mavis/shared/runtime-i18n` (11 keys, its own catalog pair)
 *   - `packages/tui/src/tui/features/composer/copy.ts` (own locale fallback)
 *   - `packages/tui/src/tui/features/session-mutation/copy.ts` (own locale
 *     fallback plus a `replaceAll` interpolation loop)
 *   - `packages/tui/src/tui/features/settings/status-line-copy.ts` (inline
 *     `en`/`zh` objects and a parallel `descriptions` tuple table)
 *   - `packages/agent-modules/permission/src/reason-format.ts` (inline
 *     `lang === 'zh'` ternaries and `Record<'en'|'zh', …>` tables)
 *
 * Those modules keep their public export names; only their internals changed, so
 * TUI rendering and permission prompts are unaffected by the migration.
 *
 * Deliberately not translated here: bundled runtime prompts, skill assets,
 * IM channel card templates and other product strings whose language is a
 * product decision rather than a host-locale decision. Those keep their own
 * source language, as required by AGENTS.md and CONTRIBUTING.md.
 */

export {
  DEFAULT_LOCALE,
  ELECTRON_LOCALE_ENV,
  LOCALE_OVERRIDE_ENV,
  isChineseLocale,
  localeLanguage,
  resolveLocale,
  resolveLocaleName,
} from './locale.js';

export {
  createCatalogSet,
  createCatalogText,
  interpolate,
  lookupCatalog,
  translate,
  type Catalog,
  type CatalogSet,
  type CatalogText,
  type InterpolationValues,
} from './catalog.js';

export {
  EN_RUNTIME_TRANSLATIONS,
  RUNTIME_CATALOG,
  type RuntimeLocaleName,
  type RuntimeTranslationKey,
  type RuntimeTranslations,
  ZH_HANS_RUNTIME_TRANSLATIONS,
} from './runtime-catalog.js';
export { translateRuntimeText } from './runtime-catalog.js';
