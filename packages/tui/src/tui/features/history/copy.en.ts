/**
 * English copy for the prompt-history search panel.
 *
 * The English object is the only source of truth for key shape: the zh-Hans
 * catalog is typed against it, so a missing translation is a compile error
 * rather than a blank line in the interface.
 */
export const EN_HISTORY_COPY = {
  searchTitle: 'Search prompt history',
  noMatches: 'No matching prompts',
} as const;

/** Every key the prompt-history search panel catalog defines. */
export type HistoryCopyKey = keyof typeof EN_HISTORY_COPY;
