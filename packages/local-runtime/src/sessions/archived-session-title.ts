import { translateRuntimeText } from '@mavis/shared/i18n';

/** The default title given to newly created or promoted root sessions. */
export const DEFAULT_ROOT_SESSION_TITLE = 'Main';

/**
 * Build the synchronous archive fallback; V2 owns model-generated titles.
 *
 * The prefix lives in the shared runtime catalog because local-runtime-v2
 * composes the same title for model-generated summaries. Keeping a copy here
 * meant the two packages could drift — the Chinese form uses a full-width colon
 * and no trailing space, while the English form uses an ASCII colon and one
 * space, so the separator is part of the catalog value rather than something a
 * caller appends.
 */
export function buildArchivedRootSessionTitle(opts: {
  oldTitle?: string | null;
  fallbackName: string;
  locale?: string;
}): string {
  const oldTitle = opts.oldTitle?.trim() ?? '';
  const label =
    !oldTitle || oldTitle.toLowerCase() === DEFAULT_ROOT_SESSION_TITLE.toLowerCase()
      ? opts.fallbackName
      : oldTitle;
  // The catalog keys off the language subtag, so `zh_CN`-style separators are
  // normalized by the shared resolver instead of by a local parse.
  const prefix = translateRuntimeText(opts.locale, 'archiveTitle.prefix');
  return `${prefix}${label}`;
}
