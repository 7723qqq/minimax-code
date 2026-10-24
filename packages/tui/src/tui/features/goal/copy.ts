import { createCatalogSet, createCatalogText, resolveLocaleName } from '@mavis/shared/i18n';

import { EN_GOAL_COPY, type GoalCopyKey } from './copy.en.js';
import { ZH_HANS_GOAL_COPY } from './copy.zh-Hans.js';

const GOAL_CATALOG = createCatalogSet(EN_GOAL_COPY, {
  'zh-Hans': ZH_HANS_GOAL_COPY,
});

/**
 * Goal banner copy lookup.
 *
 * Locale resolution lives in `@mavis/shared/i18n`, so the goal banner follows
 * the same locale as the rest of the TUI instead of reading the host itself.
 */
export const goalText = createCatalogText(GOAL_CATALOG, resolveLocaleName);

/** Key type re-exported so callers import it from the catalog module. */
export type { GoalCopyKey };
