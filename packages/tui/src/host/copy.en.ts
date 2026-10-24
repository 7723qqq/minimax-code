/**
 * English copy for the TUI host layer.
 *
 * The English object is the only source of truth for key shape: the zh-Hans
 * catalog is typed against it, so a missing translation is a compile error
 * rather than an empty line in the interface.
 */
export const EN_HOST_COPY = {
  'host.clipboard.readDenied':
    'Minimax Code cannot read the system clipboard. Allow clipboard access, then try again.',
  'host.clipboard.pasteCancelled':
    'Clipboard image paste was cancelled. The current draft was not changed.',
} as const;

/** Every key the TUI host catalog defines. */
export type HostCopyKey = keyof typeof EN_HOST_COPY;
