/**
 * English copy for the configuration package.
 *
 * The configuration errors a user can act on are catalogued here so they can
 * be translated with the rest of the product copy. The English object is the
 * only source of truth for key shape: the zh-Hans catalog is typed against it,
 * so a missing translation is a compile error rather than a blank line in the
 * interface.
 */
export const EN_CONFIG_COPY = {
  'skillEvolve.lifecycle.invalid':
    'Invalid skillEvolve.lifecycle config: staleThresholdDays ({staleThresholdDays}) must be strictly less than archiveThresholdDays ({archiveThresholdDays}).',
  'config.statusLine.saveFailed':
    'Unable to save status line settings. Check config.yaml syntax and permissions.',
  'provider.authMode.unknown':
    'Unknown provider authMode "{value}"; falling back to compatibility resolution.',
} as const;

/** Every key the configuration catalog defines. */
export type ConfigCopyKey = keyof typeof EN_CONFIG_COPY;

/** Shape every translation of the configuration catalog must satisfy. */
export type ConfigTranslations = Readonly<Record<ConfigCopyKey, string>>;
