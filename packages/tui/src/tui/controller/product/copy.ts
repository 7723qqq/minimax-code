import { createCatalogSet, createCatalogText, resolveLocaleName } from '@mavis/shared/i18n';

import { EN_CONTROLLER_PRODUCT_COPY, type ControllerProductCopyKey } from './copy.en.js';
import { ZH_HANS_CONTROLLER_PRODUCT_COPY } from './copy.zh-Hans.js';

const CONTROLLER_PRODUCT_CATALOG = createCatalogSet(EN_CONTROLLER_PRODUCT_COPY, {
  'zh-Hans': ZH_HANS_CONTROLLER_PRODUCT_COPY,
});

/**
 * TUI product copy lookup.
 *
 * Covers the feature, command, chrome, Goal, feedback, update, shell and
 * Session-mutation surfaces of the product controller.
 */
export const controllerProductText = createCatalogText(
  CONTROLLER_PRODUCT_CATALOG,
  resolveLocaleName,
);

/** Key type re-exported so callers import it from the catalog module. */
export type { ControllerProductCopyKey };
