import type { WebsiteDeployClientCopyKey } from './copy.en.js';

/**
 * Simplified Chinese copy for the website deploy client's fallback failure text.
 *
 * The `satisfies` clause is the completeness check: a key present in the English
 * catalog but absent here fails `pnpm typecheck`.
 */
export const ZH_HANS_WEBSITE_DEPLOY_CLIENT_COPY = {
  'publish.contentRejected': '站点内容未通过审核，因此未发布。',
  'publish.failed': '站点发布失败。',
} satisfies Record<WebsiteDeployClientCopyKey, string>;
