import { createCatalogSet, createCatalogText, resolveLocaleName } from '@mavis/shared/i18n';

import { EN_CONTROLLER_COPY, type ControllerCopyKey } from './copy.en.js';
import { ZH_HANS_CONTROLLER_COPY } from './copy.zh-Hans.js';

const CONTROLLER_CATALOG = createCatalogSet(EN_CONTROLLER_COPY, {
  'zh-Hans': ZH_HANS_CONTROLLER_COPY,
});

/**
 * Shared controller copy lookup.
 *
 * The catalog holds the strings used by more than one controller directory
 * group, so the run, runtime, session, projection and command surfaces read
 * them through one helper instead of each keeping its own table.
 */
export const controllerText = createCatalogText(CONTROLLER_CATALOG, resolveLocaleName);

/** Key type re-exported so callers import it from the catalog module. */
export type { ControllerCopyKey };
