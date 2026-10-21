/**
 * Provider copy for the `/provider` manager, its editor and the onboarding
 * flow.
 *
 * The English catalog is the only source of truth for the key shape; the
 * zh-Hans catalog is typed against it, so a missing translation is a compile
 * error rather than an `undefined` on screen.
 *
 * Keyboard names (`Enter`, `Esc`, `Space`, `Tab`, `e`, `r`) and command names
 * (`/provider`, `/login`, `/models`) stay in English in every locale; only the
 * words around them are translated.
 */
/**
 * English copy for the provider panels.
 *
 * The English object is the only source of truth for key shape: the zh-Hans
 * catalog is typed against it, so a missing translation is a compile error
 * rather than a blank line in the interface.
 */
export const EN_PROVIDER_COPY = {
  // Shared field values and messages.
  valueReplacementEntered: 'Replacement entered',
  valueSavedKeyUnchanged: 'Saved key (unchanged)',
  valueNotConfigured: 'Not configured',
  valueNoModels: 'No models',
  apiKeyRequired: 'API Key is required.',
  connectionTestFailed: 'Connection test failed.',
  baseUrlMustBeHttp: 'Base URL must use http or https.',
  staleConnectionDetails: 'Connection details are stale. Reopen /provider.',
  customProvider: 'Custom provider',
  testingAndSaving: 'Testing and saving…',

  // Provider editor.
  editorFieldTestAndSave: 'Test and save',
  editorChangesApplyHint:
    'Changes apply to all models in this connection after a successful test.',
  editorModelsHint: 'Model IDs separated by commas; remove an ID to remove that model.',
  editorEditingHint: 'Enter keep change · Esc cancel edit',
  editorNavigateHint: '↑↓ move · Enter edit / save · Esc cancel',
  editorValueRequired: 'A value is required. Press Esc to keep the saved value.',
  editorModelRequired: 'At least one model is required for the connection test.',
  editorAddModelFirst: 'Add a model before testing and saving.',
  editorChangesNotSaved: 'Changes were not saved. The previous connection remains in use.',
  editorCheckAndRetry:
    'Check the connection and retry. If it changed elsewhere, reopen /provider.',

  // Provider manager.
  managerModelSources: 'Model sources and credentials',
  managerChooseSource: 'Choose a source or edit a connection; keys stay masked.',
  managerRefreshModelsHint: 'Select a custom connection and press r to fetch its latest models.',
  managerKeyOverwritten: 'The saved key is overwritten once you submit.',
  managerKeySavedLocally: 'Saved locally and used instead of Token Plan.',
  managerSaveAndUseHint: 'Enter save and use · Esc cancel',
  managerNavigateHint:
    '↑↓ move · Space use · r refresh models · e edit · t test · Esc close',
  managerSelectCustomToRefresh: 'Select a custom connection to refresh its models.',
  managerModelsUpToDate: 'Models are already up to date.',
  managerModelsRefreshedButListFailed:
    'Models were refreshed, but the list could not be reloaded. Reopen /provider.',
  managerMiniMaxSignInUnavailable: 'MiniMax sign-in is unavailable in this host.',
  managerUseCodexRowToSignIn: 'Use Enter or Space on the Codex row to start sign-in.',
  managerConnectionNotEditable: 'This connection cannot be edited in this host.',
  managerConnectionSavedWithKey: 'Connection saved. All its models now use the new API Key.',
  managerConnectionChangesSaved: 'Connection changes saved.',
  managerConnectionSavedListFailed: 'Connection saved, but the list could not refresh.',
  managerReopenProvider: 'Reopen /provider.',
  managerCodexAlreadyConnected: 'OpenAI Codex is already connected.',
  managerCodexSignInUnavailable: 'Codex sign-in is unavailable in this host.',
  managerMiniMaxKeyReplaced: 'MiniMax API Key replaced and selected.',
  managerMiniMaxKeySaved: 'MiniMax API Key saved and selected.',
  managerCodexConnectivityBySignIn: 'Codex OAuth connectivity is managed by its sign-in flow.',
  managerMiniMaxOAuthByLogin: 'MiniMax OAuth sign-in and connectivity are managed by /login.',
  managerCheckUrlCredentialsModel: 'Check the URL, credentials, and model ID, then retry.',
  managerUsingMiniMaxTokenPlan: 'Using MiniMax Token Plan.',
  managerUsingMiniMaxApiKey: 'Using MiniMax API Key.',
  managerSourceUnchanged: 'The provider source was not changed.',
  managerRetryOrManageInSettings: 'Retry, or manage providers in Settings.',
  managerConnectedWithOpenAiOauth: 'Connected with OpenAI OAuth',
  managerSignInPending: 'Sign-in pending · Enter or Space to continue',
  managerSignInFailedRetry: '{error} · Enter or Space to retry',
  managerNotConnected: 'Not connected · Enter or Space to connect',
  managerSignInManagedByLogin: 'Sign-in managed by /login · Space to use · e to sign in again',
  managerKeySavedDetail: '{key} · Space to use · e to replace',
  managerNoApiKeySaved: 'No API key saved · Space or e to add one',
  managerWaitingForSignIn: 'Waiting for sign-in',
  managerSignInFailed: 'Sign-in failed',
  managerNotConnectedShort: 'Not connected',
  managerActiveTokenPlan: 'Active · Token Plan',
  managerActiveKeySaved: 'Active · Key saved',
  managerKeySaved: 'Key saved',
  managerMaskedKeyFallback: 'key saved',
  managerModelsAdded: 'Added {count} new model(s). Choose one with /model.',
  managerConnectionAvailable: '{name} connection is available.',
  managerConnectionTestFailed: '{name} connection test failed.',

  // Provider onboarding.
  onboardingBaseUrl: 'Base URL: {url}',
  onboardingReadyForTest: 'Ready for test',
  onboardingEnterToKeep: 'Enter to keep',
  onboardingEnterToEdit: 'Enter to edit',
  onboardingEnterToConfigure: 'Enter to configure',
  onboardingTabToEdit: 'Tab to edit',
  onboardingTabToConfigure: 'Tab to configure',
  onboardingApiKeyStatus: '{prefix}API Key: {state} · {action}',
  onboardingModelDetails: 'Model details',
  onboardingModelId: 'Model ID: {id}',
  onboardingLimits: 'Limits: {limits}',
  onboardingModalities: 'Modalities: {modalities}',
  onboardingCapabilities: 'Capabilities: {capabilities}',
  onboardingNotSpecified: 'Not specified',
  onboardingNoneListed: 'None listed',
  onboardingKnownProviders: 'Known providers',
  onboardingCustomProviderDescription: 'Enter URL and API key, then import or enter models',
  onboardingImportModels: 'Import models from /models',
  onboardingImportModelsDescription: 'Use this API key to fetch the available models',
  onboardingEnterModelIdManually: 'Enter a model ID manually',
  onboardingEnterModelIdManuallyDescription: 'Use when model discovery is unavailable',
  onboardingNoModelsReturned: 'No models returned. Retry or enter a model ID manually.',
  onboardingImportRetry: 'Retry, press Esc to edit the API key, or enter a model ID manually.',
  onboardingUseExistingConnection: 'Use existing connection: {name}',
  onboardingExistingConnectionDescription: '{id} · keep saved key · select or add models',
  onboardingAddAnotherAccount: 'Add another account',
  onboardingAddAnotherAccountDescription: 'Create a separate connection with an alias and API Key',
  onboardingChangesNotSaved: 'Changes were not saved. {reason}',
  onboardingSaveFailed: "Couldn't save the provider.",
  onboardingCheckUrlKeyModel: 'Check the URL, API key, and model, then retry.',
  onboardingAlreadyConfigured:
    'This provider is already configured. Use the saved connection or add another account.',
  onboardingConfirmEndpoint: 'Confirm the endpoint before testing with your API key',
  onboardingAccountName: 'Give the additional account a recognizable name',
  onboardingChooseKnownOrCustom: 'Choose a known provider or enter a custom endpoint',
  onboardingImportListOrEnterId: 'Import the model list or enter a model ID',
  onboardingImportModelsCount: 'Import {count} models · choose one to test and use',
  onboardingKeyStoredLocally: 'The key is stored locally and never shown in output',
  onboardingAccountAlias: 'Account alias',
  onboardingProviderName: 'Provider name',
  onboardingModelIdLabel: 'Model ID',
  onboardingImportingModels: 'Importing models…',
} as const;

/** Every key the provider panels catalog defines. */
export type ProviderCopyKey = keyof typeof EN_PROVIDER_COPY;
