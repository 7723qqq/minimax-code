/**
 * English copy for the website deploy client's fallback failure text.
 *
 * The backend normally supplies its own `status_msg`, which is shown verbatim.
 * These strings are only used when it does not: the client has to say something
 * about why the publish failed, and that something is read by the user. They
 * therefore follow the interface language like every other product surface.
 *
 * The English object defines the key shape; the zh-Hans catalog is typed against
 * it, so a missing translation is a compile error rather than English text in a
 * localized interface.
 */
export const EN_WEBSITE_DEPLOY_CLIENT_COPY = {
  'publish.contentRejected': 'The site content did not pass review, so it was not published.',
  'publish.failed': 'Website publication failed.',
} as const;

/** Key type of the website deploy client copy catalog. */
export type WebsiteDeployClientCopyKey = keyof typeof EN_WEBSITE_DEPLOY_CLIENT_COPY;
