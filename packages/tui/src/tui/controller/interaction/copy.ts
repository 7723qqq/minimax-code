import { createCatalogSet, createCatalogText, resolveLocaleName } from '@mavis/shared/i18n';

import {
  EN_CONTROLLER_INTERACTION_COPY,
  type ControllerInteractionCopyKey,
} from './copy.en.js';
import { ZH_HANS_CONTROLLER_INTERACTION_COPY } from './copy.zh-Hans.js';

const CONTROLLER_INTERACTION_CATALOG = createCatalogSet(EN_CONTROLLER_INTERACTION_COPY, {
  'zh-Hans': ZH_HANS_CONTROLLER_INTERACTION_COPY,
});

/**
 * TUI interaction copy lookup.
 *
 * Covers the Agent question, permission decision, Composer input, external
 * editor, Plan Mode, permission mode and questionnaire continuation surfaces.
 */
export const controllerInteractionText = createCatalogText(
  CONTROLLER_INTERACTION_CATALOG,
  resolveLocaleName,
);

/** Key type re-exported so callers import it from the catalog module. */
export type { ControllerInteractionCopyKey };
