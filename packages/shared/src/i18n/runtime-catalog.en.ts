/**
 * English catalog: the single source of truth for runtime message keys.
 *
 * Every other catalog is typed against this object, so adding a key here makes
 * a missing translation a compile error rather than a blank string at runtime.
 * Insertion order is the review order; it has no runtime meaning.
 */
export const EN_RUNTIME_TRANSLATIONS = {
  'plan.entry.title': 'Enter Plan Mode',
  'plan.entry.question': 'Enter Plan Mode for this task?',
  'plan.entry.confirm.label': 'Confirm',
  'plan.entry.confirm.description': 'Investigate and prepare a plan before implementation.',
  'plan.entry.decline.label': 'Decline',
  'plan.entry.decline.description': 'Continue without entering Plan Mode.',
  'plan.implementation.display': 'Implement this plan',
  'questionnaire.noAnswer': 'No answer',
  'questionnaire.others': 'Others',
  // Cross-package runtime copy: the prefix is read by local-runtime's
  // synchronous archive title and by local-runtime-v2's model-generated one, so
  // it lives here instead of in either package's own catalog.
  'archiveTitle.prefix': 'Memory archive: ',
  'channel.accessControlDenied':
    "You don't have permission to chat with this Agent. Please contact the owner to grant access.",
  'channel.accessControlGuide': 'Configuration guide: {url}',
  'update.versionedInstalled':
    'MCode {version} is installed. New MCode sessions will use it; running sessions can continue normally.',
} as const;

export type RuntimeTranslationKey = keyof typeof EN_RUNTIME_TRANSLATIONS;
export type RuntimeTranslations = Readonly<Record<RuntimeTranslationKey, string>>;
