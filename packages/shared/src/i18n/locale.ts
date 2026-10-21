/**
 * Runtime locale resolution.
 *
 * Before this module existed, ten call sites read the host locale themselves in
 * four slightly different orders. `Intl.DateTimeFormat().resolvedOptions()`
 * appeared verbatim in seven files, three of them wrapped in their own
 * `try`/`catch` fallback, and two subsystems compared `locale === 'zh'` directly
 * instead of reducing the tag to a language subtag. The differences were not
 * cosmetic: a caller that trusted `Intl` could not be pinned by tests, because
 * overriding `LANG`/`LC_ALL` does not change what `Intl` reports on most hosts.
 *
 * Resolution order is deliberate and is the single contract:
 *
 *   1. an explicitly supplied locale (config, request, or caller argument)
 *   2. a locale saved in this process's TUI settings ({@link setProcessLocale}),
 *      which is the user's explicit choice and therefore outranks the host
 *   3. `MAVIS_ELECTRON_LOCALE`, the Desktop host's own locale handshake
 *   4. `MCODE_LOCALE`, an explicit override usable from CLI and tests
 *   5. `Intl.DateTimeFormat().resolvedOptions().locale`
 *   6. `LANG` / `LC_ALL` with any `.codeset` suffix removed
 *   7. `'en'`
 *
 * Step 4 is what makes the locale pinnable from the outside: a process-wide
 * override that wins over `Intl`, so a test suite does not depend on the machine
 * it runs on. Step 2 exists because a setting the user picked in the interface
 * has to win over environment variables that the user did not set in this
 * terminal — including the Desktop handshake — while still being distinguishable
 * from a caller that passes a locale explicitly.
 *
 * Step 5 is read through {@link SystemLocaleReader}. The default reader asks
 * `Intl`; a test that wants to exercise steps 6–7 passes one returning
 * `undefined` instead of inheriting whatever the host reports. The order above
 * is unchanged by that seam: `Intl` still outranks `LANG`, so a caller setting
 * only `LANG` is answered by the host on any machine that has an opinion.
 */

/** Language subtag used when nothing usable is present. */
export const DEFAULT_LOCALE = 'en';

/** Environment variable that overrides every implicit source, including `Intl`. */
export const LOCALE_OVERRIDE_ENV = 'MCODE_LOCALE';

/** Desktop host handshake variable. Kept for compatibility with the app. */
export const ELECTRON_LOCALE_ENV = 'MAVIS_ELECTRON_LOCALE';

const LOCALE_ENV_KEYS = ['LC_ALL', 'LC_MESSAGES', 'LANG'] as const;

/**
 * Well-formed BCP 47 shape: a 2-8 letter language subtag, then optional 1-8
 * alphanumeric subtags separated by `-`.
 *
 * Deliberately a shape check rather than a registry lookup: the product only
 * needs to reject garbage that would otherwise reach `Intl` or a catalog lookup,
 * and a tag the runtime does not know must still degrade to English rather than
 * block startup.
 */
const LOCALE_TAG = /^[a-z]{2,8}(?:-[a-z0-9]{1,8})*$/iu;

/** Locale saved in this process's settings, or `undefined` when none is active. */
let processLocale: string | undefined;

/** True when `value` has the shape of a BCP 47 language tag. */
export function isValidLocaleTag(value: string): boolean {
  return LOCALE_TAG.test(value.trim().replace(/_/gu, '-'));
}

/**
 * Apply the locale saved in the user's settings for the rest of this process.
 *
 * Only a well-formed tag ever becomes active: an empty, missing or malformed
 * value clears the override and returns `false`, so a corrupt settings file
 * degrades to the environment chain instead of pinning the interface to a
 * broken tag. Clearing is also how a caller removes a previous override.
 */
export function setProcessLocale(locale?: string | null): boolean {
  const candidate = locale?.trim().replace(/_/gu, '-');
  if (!candidate || !LOCALE_TAG.test(candidate)) {
    processLocale = undefined;
    return false;
  }
  processLocale = candidate;
  return true;
}

/** The active settings-driven locale, if one was applied. */
export function processLocaleOverride(): string | undefined {
  return processLocale;
}

type EnvironmentLike = Readonly<Record<string, string | undefined>>;

function readEnvironment(): EnvironmentLike {
  const environment = (globalThis as { process?: { env?: EnvironmentLike } }).process?.env;
  return environment ?? {};
}

function usable(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

/** Strip a POSIX `.codeset` suffix and normalize `_` separators. */
function normalizeEnvironmentLocale(value: string): string {
  return value.split('.')[0]?.replace(/_/gu, '-') ?? value;
}

/** A valid BCP 47 language subtag: 2-8 ASCII letters. */
const LANGUAGE_SUBTAG = /^[a-z]{2,8}$/u;

/**
 * Reduce a BCP 47 tag to its lowercase language subtag.
 *
 * Invalid tags fall back to English rather than throwing or returning garbage:
 * locale strings reach this function from environment variables and user
 * configuration, and a malformed value must degrade predictably. `Intl.Locale`
 * is permissive about separators, so the result is validated instead of being
 * trusted.
 */
export function localeLanguage(locale?: string | null): string {
  const candidate = locale?.trim().replace(/_/gu, '-');
  if (!candidate) return DEFAULT_LOCALE;
  try {
    const language = new Intl.Locale(candidate).language?.toLowerCase();
    if (language && LANGUAGE_SUBTAG.test(language)) return language;
  } catch {
    // Fall through to the manual split below.
  }
  const head = candidate.split('-')[0]?.toLowerCase();
  return head && LANGUAGE_SUBTAG.test(head) ? head : DEFAULT_LOCALE;
}

/** True when the tag resolves to Chinese, including `zh-Hans` / `zh-CN` / `zh_TW`. */
export function isChineseLocale(locale?: string | null): boolean {
  return localeLanguage(locale) === 'zh';
}

/**
 * Read the locale the host reports through `Intl`, or `undefined` when the
 * platform refuses to answer.
 *
 * Exposed as a type because {@link resolveLocale} accepts one: a test that only
 * sets `LANG` would otherwise be decided by the machine it runs on, and the
 * answer would differ between the author's desktop and CI.
 */
export type SystemLocaleReader = () => string | undefined;

const readIntlLocale: SystemLocaleReader = () => {
  try {
    const resolved = new Intl.DateTimeFormat().resolvedOptions().locale;
    return usable(resolved);
  } catch {
    return undefined;
  }
};

/**
 * IANA timezone of the host, used for calendar day boundaries.
 *
 * Kept here rather than in the callers because it is another host-environment
 * fact read from the same `Intl` call, and because a partial or missing value
 * must degrade predictably.
 */
export function resolveTimeZone(fallback = 'UTC'): string {
  try {
    return new Intl.DateTimeFormat().resolvedOptions().timeZone || fallback;
  } catch {
    return fallback;
  }
}

/**
 * Raw host date options for diagnostic metadata.
 *
 * Returns `undefined` when the platform refuses to report them, so a caller can
 * distinguish "unknown" from "unset" instead of inventing a default.
 */
export function resolveHostDateOptions(): { timeZone?: string; locale?: string } | undefined {
  try {
    const options = new Intl.DateTimeFormat().resolvedOptions();
    return { timeZone: options.timeZone, locale: options.locale };
  } catch {
    return undefined;
  }
}

function readEnvironmentLocale(environment: EnvironmentLike): string | undefined {
  for (const key of LOCALE_ENV_KEYS) {
    const value = usable(environment[key]);
    if (value) return normalizeEnvironmentLocale(value);
  }
  return undefined;
}

/**
 * Resolve the active locale, honoring an explicit argument first.
 *
 * Returns a full tag when one is available (`zh-CN`) and a bare language when
 * only one is present (`zh`). Callers that need a language must pass the result
 * through {@link localeLanguage}.
 *
 * `readSystemLocale` is the step-5 source and is injectable so a test can assert
 * the environment chain below it without depending on the host's `Intl` answer;
 * production callers leave it at the default.
 */
export function resolveLocale(
  explicit?: string | null,
  environment = readEnvironment(),
  readSystemLocale: SystemLocaleReader = readIntlLocale,
): string {
  const requested = usable(explicit ?? undefined);
  if (requested) return requested;

  // A locale the user saved in the interface outranks every environment source,
  // including the Desktop handshake: it is a deliberate choice, not a default.
  if (processLocale) return processLocale;

  const electron = usable(environment[ELECTRON_LOCALE_ENV]);
  if (electron) return electron;

  const override = usable(environment[LOCALE_OVERRIDE_ENV]);
  if (override) return override;

  return readSystemLocale() ?? readEnvironmentLocale(environment) ?? DEFAULT_LOCALE;
}

/**
 * Canonical locale names this build can render.
 *
 * The set is declared once, here, because both the resolver and the catalogs
 * have to agree on one spelling. A new language adds one member and one branch
 * in {@link resolveLocaleName}, rather than a comparison at every call site.
 */
export type LocaleName = 'en' | 'zh-Hans';

/**
 * Resolve the canonical locale *name* this product renders in.
 *
 * Today that is `'en'` or `'zh-Hans'`; a future language adds one branch here
 * rather than at every call site.
 */
export function resolveLocaleName(
  explicit?: string | null,
  environment?: EnvironmentLike,
): LocaleName {
  const locale = resolveLocale(explicit, environment);
  return isChineseLocale(locale) ? 'zh-Hans' : DEFAULT_LOCALE;
}
