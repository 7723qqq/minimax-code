import { createCatalogSet, resolveLocaleName, translate } from '@mavis/shared/i18n';

import {
  EN_WEBSITE_DEPLOY_CLIENT_COPY,
  type WebsiteDeployClientCopyKey,
} from './copy.en.js';
import { ZH_HANS_WEBSITE_DEPLOY_CLIENT_COPY } from './copy.zh-Hans.js';

const WEBSITE_DEPLOY_CLIENT_CATALOG = createCatalogSet(EN_WEBSITE_DEPLOY_CLIENT_COPY, {
  'zh-Hans': ZH_HANS_WEBSITE_DEPLOY_CLIENT_COPY,
});

/**
 * Look up one deploy failure message for the client's fallback path.
 *
 * Only reached when the backend supplies no usable `status_msg`; a backend
 * message is always shown as-is because it is authoritative about its own
 * failure.
 */
export function websiteDeployClientText(
  key: WebsiteDeployClientCopyKey,
  locale?: string | null,
): string {
  return translate(WEBSITE_DEPLOY_CLIENT_CATALOG, resolveLocaleName(locale), key);
}

export type { WebsiteDeployClientCopyKey };
