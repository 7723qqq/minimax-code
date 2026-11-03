/**
 * Model picker copy.
 *
 * The English catalog is the only source of truth for the key shape; the
 * zh-Hans catalog is typed against it, so a missing translation is a compile
 * error rather than an `undefined` on screen.
 *
 * Keyboard names (`Esc`, `enter`, `ctrl+s`, `tab`) and the arrow glyphs stay
 * in English in every locale; only the words around them are translated.
 */
/**
 * English copy for the model picker.
 *
 * The English object is the only source of truth for key shape: the zh-Hans
 * catalog is typed against it, so a missing translation is a compile error
 * rather than a blank line in the interface.
 */
export const EN_MODEL_COPY = {
  noMatchingModels: 'No matching models',
  favoritesUpdateFailed: "Couldn't update favorites. Press ctrl+s to retry.",
  availableModels: 'Available models',
  higherContextUsage: 'Higher usage with this context window.',
  addProviderDescription: 'Configure an API Key provider and add its models',
  thinkEffort: 'Think effort',
  oauthCredentialsReady: 'OAuth credentials are ready',
  reopenBrowserSignIn: 'Open the browser sign-in again',
  previousSignInFailed: 'The previous sign-in failed',
  signInWithOpenAiOauth: 'Sign in with OpenAI OAuth',
  loginRequired: 'Login required',
  hintEffort: '↑↓ select · type to search · ←/→ effort · enter apply{context}{favorite} · esc cancel',
  hintThinking:
    '↑↓ select · type to search · ←/→ thinking · enter apply{context}{favorite} · esc cancel',
  hintPlain: '↑↓ select · type to search · enter apply{context}{favorite} · esc cancel',
  hintContext: ' · tab context',
  hintFavorite: ' · ctrl+s favorite',
  hintUnfavorite: ' · ctrl+s unfavorite',
} as const;

/** Every key the model picker catalog defines. */
export type ModelCopyKey = keyof typeof EN_MODEL_COPY;
