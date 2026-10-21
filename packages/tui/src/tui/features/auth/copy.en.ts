/**
 * English copy for the sign-in and account-region surfaces.
 *
 * The English object is the only source of truth for key shape: the zh-Hans
 * catalog is typed against it, so a missing translation is a compile error
 * rather than a blank line in the interface.
 */
export const EN_AUTH_COPY = {
  browserLoginLabel: 'Browser login (default)',
  browserLoginDescription: 'Sign in on this computer',
  deviceCodeLoginLabel: 'Device code login',
  deviceCodeLoginDescription: 'SSH / remote development machine',
  selectContinueCancel: '↑↓ select · Enter continue · Esc cancel',
  retryCancel: 'Enter retry · Esc cancel',
  cancel: 'Esc cancel',
  cancelling: 'Cancelling sign-in…',
  checking: 'Checking Codex sign-in…',
  starting: 'Starting Codex sign-in…',
  waitingForAuthorization: 'Waiting for authorization…',
  enterCode: 'Enter code: {code}',
  openLinkInBrowser: 'Open this link in a browser on your computer and enter the code.',
  completeInBrowser: 'Complete sign-in in your browser.',
  codeExpiresIn: 'Code expires in {n} min.',
  unavailableInBuild: 'Codex sign-in is unavailable in this build.',
  openLinkManually: 'Open the link above manually to continue.',
  signInFailed: 'Codex sign-in failed. Retry to continue.',
  regionChinaLabel: 'China (CN)',
  regionChinaDescription: 'MiniMax China account',
  regionGlobalLabel: 'Global',
  regionGlobalDescription: 'MiniMax international account',
  singleRegionOnly: 'Only one MiniMax account region can be signed in at a time.',
  chooseRegion: 'Choose account region',
} as const;

/** Every key the sign-in and account-region surfaces catalog defines. */
export type AuthCopyKey = keyof typeof EN_AUTH_COPY;
