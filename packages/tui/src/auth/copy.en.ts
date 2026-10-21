/**
 * English copy for the TUI authentication surface.
 *
 * The English object is the only source of truth for key shape: the zh-Hans
 * catalog is typed against it, so a missing translation is a compile error
 * rather than an empty line in the interface.
 */
export const EN_TUI_AUTH_COPY = {
  'auth.alreadySignedIn': 'Already signed in with MiniMax.',
  'auth.alreadySignedInRegion': 'Already signed in with {region}.',
  'auth.signedIn': 'Signed in with MiniMax.',
  'auth.signedInRegion': 'Signed in with {region}.',
  'auth.alreadySignedOut': 'Already signed out of MiniMax.',
  'auth.signedOutLocally':
    'Signed out locally from {region} across MCode. Server revocation is pending until the network recovers.',
  'auth.signedOut':
    'Signed out of {region} on Desktop, CLI/TUI, and embedded mcode-tools.',
  'auth.signInExpired': 'MiniMax sign-in expired. Run /login, then retry.',
} as const;

/** Every key the TUI authentication catalog defines. */
export type TuiAuthCopyKey = keyof typeof EN_TUI_AUTH_COPY;
