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
 * Product copy lives in per-feature catalogs built with `createCatalogSet` and
 * read through `translate`: the runtime, composer, session-mutation, status-line,
 * permission-reason, product-time, shell, archive-title, IM receipt, queue,
 * outbound-failure, Feishu, WeChat, Telegram, tool-summary and code-review
 * strings. A module may keep its catalog local when the copy belongs to that
 * surface; the contract is the catalog, not the file location. Copy shared by
 * two packages (the archive-title prefix, the channel access-control notice)
 * lives in the runtime catalog here, because a package-local copy is what lets
 * the two definitions drift.
 *
 * Deliberately outside the catalog, and required to keep their own language:
 *
 *   - bundled runtime prompts and skill assets, including the archive-title
 *     system prompt and its `<excerpt>` wrapper;
 *   - model-facing instruction text, such as the review correction and XML
 *     escaping guidance and the system-reminder evolution blocks;
 *   - tool descriptions, tool errors and diagnostics that the model reads as
 *     input rather than the app rendering as UI;
 *   - conversation content, such as quoted-message transcripts and the
 *     attachment labels inside them, which must not change with the reader's UI
 *     language;
 *   - vendored `third_party/**` code;
 *   - CJK ranges inside regular expressions, which are data, not copy;
 *   - test fixtures and assertions.
 *
 * WeChat is a special case: it exposes no client-language signal, so its copy
 * still defaults to zh-Hans even though it is catalogued.
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
