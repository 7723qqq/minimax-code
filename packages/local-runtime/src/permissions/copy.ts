import { createCatalogSet, resolveLocaleName, translate } from '@mavis/shared/i18n';

import { EN_PERMISSION_COPY, type PermissionCopyKey } from './copy.en.js';
import { ZH_HANS_PERMISSION_COPY } from './copy.zh-Hans.js';

const PERMISSION_CATALOG = createCatalogSet(EN_PERMISSION_COPY, {
  'zh-Hans': ZH_HANS_PERMISSION_COPY,
});

/**
 * Look up one local-runtime permission-reason string.
 *
 * `locale` is the caller's user-language hint (the facade resolves it from the
 * recent user messages); when it is omitted the runtime locale decides, so a
 * caller without a hint still renders the host language.
 */
export function permissionReasonText(
  key: PermissionCopyKey,
  values?: Readonly<Record<string, string | number>>,
  locale?: string | null,
): string {
  return translate(PERMISSION_CATALOG, resolveLocaleName(locale), key, values);
}

export type { PermissionCopyKey };
