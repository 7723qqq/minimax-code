/**
 * Catalog typing, interpolation and deterministic fallback.
 *
 * The English catalog is the only source of truth for key shape. Every other
 * catalog is typed as `Catalog<typeof EN>`, so a missing key is a compile error
 * in `pnpm typecheck` instead of a runtime `undefined` on a user's screen. This
 * replaces the previous arrangement, where two of the five catalogs asserted
 * completeness with `satisfies` and three relied on a hand-maintained key type
 * that could silently drift.
 *
 * Lookup never throws and never returns `undefined`. Resolution order is:
 *
 *   1. the requested catalog
 *   2. the English catalog
 *   3. the key itself
 *
 * Step 3 matters for diagnostics: a missing key surfaces as a visible token
 * instead of an empty string or a crash inside a terminal renderer.
 */

/** A catalog is a flat record of message key to template string. */
export type Catalog<Source extends Readonly<Record<string, string>>> = {
  readonly [Key in keyof Source]: string;
};

/** Named placeholders use `{name}`; values are stringified, never evaluated. */
export type InterpolationValues = Readonly<Record<string, string | number>>;

const PLACEHOLDER = /\{([A-Za-z0-9_.-]+)\}/gu;

/**
 * Replace `{name}` placeholders with the supplied values.
 *
 * A placeholder with no supplied value is left untouched so a partially
 * provided template stays readable instead of collapsing to an empty gap. A
 * single pass is made, which means a value that itself contains `{other}` is
 * not re-interpolated — the previous implementation used `replaceAll` in a
 * loop over entries, so a value containing a later placeholder could be
 * substituted by accident.
 */
export function interpolate(template: string, values?: InterpolationValues): string {
  if (!values) return template;
  return template.replace(PLACEHOLDER, (match, name: string) => {
    if (!Object.prototype.hasOwnProperty.call(values, name)) return match;
    const value = values[name];
    return value === undefined ? match : String(value);
  });
}

/** A catalog set ready for lookup: the reference catalog plus its translations. */
export interface CatalogSet<Source extends Readonly<Record<string, string>>> {
  readonly reference: Catalog<Source>;
  readonly translations: Readonly<Record<string, Catalog<Source>>>;
}

/** Build a catalog set. The reference catalog doubles as the English fallback. */
export function createCatalogSet<Source extends Readonly<Record<string, string>>>(
  reference: Source,
  translations: Readonly<Record<string, Catalog<Source>>> = {},
): CatalogSet<Source> {
  return { reference: reference as Catalog<Source>, translations };
}

/**
 * Look up one key without throwing.
 *
 * `localeName` is a catalog name such as `'zh-Hans'`, not a BCP 47 tag: the
 * caller resolves the tag once, so lookup stays a plain map access.
 */
export function lookupCatalog<Source extends Readonly<Record<string, string>>>(
  set: CatalogSet<Source>,
  localeName: string,
  key: keyof Source & string,
): string {
  const translated = set.translations[localeName]?.[key];
  if (typeof translated === 'string') return translated;
  const reference = set.reference[key];
  if (typeof reference === 'string') return reference;
  return key;
}

/**
 * Look up and interpolate in one step.
 */
export function translate<Source extends Readonly<Record<string, string>>>(
  set: CatalogSet<Source>,
  localeName: string,
  key: keyof Source & string,
  values?: InterpolationValues,
): string {
  return interpolate(lookupCatalog(set, localeName, key), values);
}

/**
 * Shape of the per-feature text helpers this module replaces.
 *
 * Two call conventions exist in the tree and both are preserved:
 *
 *   text(key)                        — host locale
 *   text(key, locale)                — explicit locale
 *   text(key, values)                — host locale with interpolation
 *   text(key, values, locale)        — both
 *
 * Keeping the locale-only form matters because the migrated modules
 * (`composerText`, `sessionHistoryText`, `sessionMutationText`) already had it.
 */
export type CatalogText<Key extends string> = {
  (key: Key, locale?: string | null): string;
  (key: Key, values: InterpolationValues, locale?: string | null): string;
};

/**
 * Bind a catalog set into the text helper a feature module re-exports.
 *
 * `resolveLocaleName` is injected rather than imported so this file stays free
 * of environment reads and remains trivially testable.
 */
export function createCatalogText<Source extends Readonly<Record<string, string>>>(
  set: CatalogSet<Source>,
  resolveLocaleName: (explicit?: string | null) => string,
): CatalogText<keyof Source & string> {
  const text = (
    key: keyof Source & string,
    valuesOrLocale?: InterpolationValues | string | null,
    locale?: string | null,
  ): string => {
    const values =
      typeof valuesOrLocale === 'object' && valuesOrLocale !== null ? valuesOrLocale : undefined;
    const explicit =
      typeof valuesOrLocale === 'string' || valuesOrLocale === null ? valuesOrLocale : locale;
    return translate(set, resolveLocaleName(explicit), key, values);
  };
  return text as CatalogText<keyof Source & string>;
}
