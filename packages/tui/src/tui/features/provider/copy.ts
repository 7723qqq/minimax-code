import { createCatalogSet, createCatalogText, resolveLocaleName } from '@mavis/shared/i18n';

import { EN_PROVIDER_COPY, type ProviderCopyKey } from './copy.en.js';
import { ZH_HANS_PROVIDER_COPY } from './copy.zh-Hans.js';

const PROVIDER_CATALOG = createCatalogSet(EN_PROVIDER_COPY, {
  'zh-Hans': ZH_HANS_PROVIDER_COPY,
});

/**
 * Provider copy lookup for the `/provider` manager, its editor and the
 * onboarding flow.
 *
 * Locale resolution lives in `@mavis/shared/i18n`; this module no longer reads
 * `Intl` itself, so an override applies uniformly across every feature.
 */
export const providerText = createCatalogText(PROVIDER_CATALOG, resolveLocaleName);

/** Key type re-exported so callers import it from the catalog module. */
export type { ProviderCopyKey };
