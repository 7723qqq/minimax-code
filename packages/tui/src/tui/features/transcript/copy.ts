import { createCatalogSet, createCatalogText, resolveLocaleName } from '@mavis/shared/i18n';

import { EN_TRANSCRIPT_COPY, type TranscriptCopyKey } from './copy.en.js';
import { ZH_HANS_TRANSCRIPT_COPY } from './copy.zh-Hans.js';

const TRANSCRIPT_CATALOG = createCatalogSet(EN_TRANSCRIPT_COPY, {
  'zh-Hans': ZH_HANS_TRANSCRIPT_COPY,
});

/**
 * Transcript copy lookup.
 *
 * Locale resolution lives in `@mavis/shared/i18n`, so a locale override applies
 * uniformly across every feature.
 */
export const transcriptText = createCatalogText(TRANSCRIPT_CATALOG, resolveLocaleName);

/** Key type re-exported so callers import it from the catalog module. */
export type { TranscriptCopyKey };
