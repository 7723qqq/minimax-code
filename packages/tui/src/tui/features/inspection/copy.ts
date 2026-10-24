import { createCatalogSet, createCatalogText, resolveLocaleName } from '@mavis/shared/i18n';

import { EN_INSPECTION_COPY, type InspectionCopyKey } from './copy.en.js';
import { ZH_HANS_INSPECTION_COPY } from './copy.zh-Hans.js';

const INSPECTION_CATALOG = createCatalogSet(EN_INSPECTION_COPY, {
  'zh-Hans': ZH_HANS_INSPECTION_COPY,
});

/**
 * Inspection copy lookup.
 *
 * Locale resolution lives in `@mavis/shared/i18n`, so a locale override applies
 * uniformly across every feature.
 */
export const inspectionText = createCatalogText(INSPECTION_CATALOG, resolveLocaleName);

/**
 * Report labels are stored in the report data as stable English identifiers:
 * `transcript/status-visualization.ts` looks rows up by those exact strings, so
 * they must not change with the reader's language. `inspectionLabelId` produces
 * the identifier that goes into the data, and `inspectionReportLabel` turns it
 * back into display text on the render side.
 */
const REPORT_LABEL_KEYS: ReadonlyMap<string, InspectionCopyKey> = new Map(
  Object.entries(EN_INSPECTION_COPY)
    .filter(([key]) => key.startsWith('label.'))
    .map(([key, value]) => [value, key as InspectionCopyKey] as const),
);

/** The locale-independent identifier stored in report data for one label. */
export function inspectionLabelId(key: InspectionCopyKey): string {
  return EN_INSPECTION_COPY[key];
}

/** The localized display text for a report label identifier. */
export function inspectionReportLabel(label: string): string {
  const key = REPORT_LABEL_KEYS.get(label);
  return key ? inspectionText(key) : label;
}

/** Key type re-exported so callers import it from the catalog module. */
export type { InspectionCopyKey };
