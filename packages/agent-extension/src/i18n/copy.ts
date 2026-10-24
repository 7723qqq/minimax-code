import { createCatalogSet, resolveLocaleName, translate } from '@mavis/shared/i18n';

import {
  EN_SOURCE_REFERENCE_COPY,
  type SourceReferenceCopyKey,
} from './copy.en.js';
import { ZH_HANS_SOURCE_REFERENCE_COPY } from './copy.zh-Hans.js';

const SOURCE_REFERENCE_CATALOG = createCatalogSet(EN_SOURCE_REFERENCE_COPY, {
  'zh-Hans': ZH_HANS_SOURCE_REFERENCE_COPY,
});

/**
 * Read one source-reference label.
 *
 * `locale` accepts a full BCP 47 tag (`zh-CN`), a bare language (`zh`), or
 * `null`/`undefined` to use the host locale. Lookup never throws: an unknown
 * key falls back to English and finally to the key itself.
 *
 * These labels are part of the assistant's message body, but they are authored
 * by the product rather than by the model, so they follow the interface
 * language. Choosing them by sniffing the answer for Han characters made the
 * label flip on a single Chinese character in an unrelated citation, and let
 * two call sites disagree about the English wording.
 */
export function sourceReferenceText(
  key: SourceReferenceCopyKey,
  locale?: string | null,
): string {
  return translate(SOURCE_REFERENCE_CATALOG, resolveLocaleName(locale), key);
}

export { SOURCE_REFERENCE_CATALOG };
/** Key type re-exported so callers import it from the catalog module. */
export type { SourceReferenceCopyKey };
