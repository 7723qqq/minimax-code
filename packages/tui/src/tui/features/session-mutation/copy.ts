import {
  createCatalogSet,
  createCatalogText,
  resolveLocale,
  resolveLocaleName,
} from '@mavis/shared/i18n';

import {
  SESSION_HISTORY_COPY,
  SESSION_MUTATION_COPY,
  type SessionHistoryCopyKey,
  type SessionMutationCopyKey,
} from './copy.en.js';
import { ZH_HANS_SESSION_HISTORY_COPY, ZH_HANS_SESSION_MUTATION_COPY } from './copy.zh-Hans.js';

const SESSION_HISTORY_CATALOG = createCatalogSet(SESSION_HISTORY_COPY, {
  'zh-Hans': ZH_HANS_SESSION_HISTORY_COPY,
});

const SESSION_MUTATION_CATALOG = createCatalogSet(SESSION_MUTATION_COPY, {
  'zh-Hans': ZH_HANS_SESSION_MUTATION_COPY,
});

/**
 * Session history and mutation copy.
 *
 * The previous implementation resolved the locale with its own `Intl` read,
 * decided Chinese-ness with a local `isChineseLocale`, and interpolated with a
 * `replaceAll` loop over the values object. All three now come from
 * `@mavis/shared/i18n`, so a placeholder that appears in a supplied value is
 * no longer substituted a second time.
 */
export const sessionHistoryText = createCatalogText(SESSION_HISTORY_CATALOG, resolveLocaleName);

/**
 * Session mutation copy lookup.
 *
 * Reads the fork, edit and rewind catalog through the shared kernel, so a
 * missing translation falls back to English rather than rendering a gap.
 */
export const sessionMutationText = createCatalogText(SESSION_MUTATION_CATALOG, resolveLocaleName);

/**
 * Host locale for this feature, kept as a named export because the display
 * formatters in `format.ts` resolve it once and pass it down. It delegates to
 * the shared resolver instead of reading `Intl` itself.
 */
export function sessionMutationLocale(): string {
  return resolveLocale();
}

/**
 * Look up one Session mutation key and fill its placeholders.
 *
 * `locale` accepts a full BCP 47 tag, a bare language, or `null`/`undefined`
 * to use the host locale.
 */
export function sessionMutationTemplate(
  key: SessionMutationCopyKey,
  values: Readonly<Record<string, string | number>>,
  locale?: string | null,
): string {
  return sessionMutationText(key, values, locale);
}

/** Key types re-exported so callers import them from the catalog module. */
export type { SessionHistoryCopyKey, SessionMutationCopyKey };
