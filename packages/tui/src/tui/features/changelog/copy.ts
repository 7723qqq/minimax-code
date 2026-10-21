import { createCatalogSet, createCatalogText, resolveLocaleName } from '@mavis/shared/i18n';

import { EN_CHANGELOG_COPY, type ChangelogCopyKey } from './copy.en.js';
import { ZH_HANS_CHANGELOG_COPY } from './copy.zh-Hans.js';

const CHANGELOG_CATALOG = createCatalogSet(EN_CHANGELOG_COPY, {
  'zh-Hans': ZH_HANS_CHANGELOG_COPY,
});

/**
 * Changelog panel copy lookup.
 *
 * Locale resolution lives in `@mavis/shared/i18n`; this module does not read
 * `Intl` itself, so an override applies uniformly across every feature.
 */
export const changelogText = createCatalogText(CHANGELOG_CATALOG, resolveLocaleName);

/** Key type re-exported so callers import it from the catalog module. */
export type { ChangelogCopyKey };
