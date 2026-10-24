import { createCatalogSet, resolveLocaleName, translate } from '@mavis/shared/i18n';

import { EN_WEBSITE_DEPLOY_COPY, type WebsiteDeployCopyKey } from './copy.en.js';
import { ZH_HANS_WEBSITE_DEPLOY_COPY } from './copy.zh-Hans.js';

const WEBSITE_DEPLOY_CATALOG = createCatalogSet(EN_WEBSITE_DEPLOY_COPY, {
  'zh-Hans': ZH_HANS_WEBSITE_DEPLOY_COPY,
});

/**
 * Look up one website deploy failure message.
 *
 * The runtime locale decides when `locale` is omitted, so a deploy failure reads
 * in the user's interface language instead of always English.
 */
export function websiteDeployText(
  key: WebsiteDeployCopyKey,
  values?: Readonly<Record<string, string | number>>,
  locale?: string | null,
): string {
  return translate(WEBSITE_DEPLOY_CATALOG, resolveLocaleName(locale), key, values);
}

export type { WebsiteDeployCopyKey };
