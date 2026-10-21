/**
 * English copy for the `mcode` command-line surfaces.
 *
 * The English object is the only source of truth for key shape: the zh-Hans
 * catalog is typed against it, so a missing translation is a compile error
 * rather than an empty line in the terminal.
 */
export const EN_CLI_COPY = {
  'cli.provider.apiKeyMissing':
    'Provider API key is missing. Set {envName} or pass --api-key-env <name>.',
  'cli.provider.modelRequired': 'At least one --model <id> is required.',
  'cli.provider.connectionUnavailable': 'Connection unavailable',
  'cli.provider.connectionTestFailed':
    'Provider connection test failed. Nothing was saved or selected.',
  'cli.provider.connectionTestNextStep':
    'Check the URL, API key, and first model ID, then retry; omit --use to save without testing.',
  'cli.provider.addedAndSelected': 'Provider added and selected: {name}',
  'cli.provider.added': 'Provider added: {name}',
  'cli.provider.removeNeedsYes': 'Refusing to remove a provider without --yes.',
  'cli.provider.removed': 'Provider removed: {id}',
  'cli.provider.oauthManagedByLogin':
    'MiniMax OAuth sign-in and connectivity are managed by /login.',
  'cli.provider.oauthTestSkipped': 'MiniMax OAuth provider test skipped.',
  'cli.provider.oauthTestNextStep': 'Run /login to manage Token Plan sign-in.',
  'cli.provider.available': 'Provider available: {provider}',
  'cli.provider.testFailed': 'Provider test failed.',
  'cli.provider.testNextStep': 'Check the URL, API key, and model ID, then retry.',
  'cli.provider.minimaxApiKeyMissing':
    'MiniMax API key is missing. Set {envName} or pass --api-key-env <name>.',
  'cli.provider.apiKeySaved': 'MiniMax API Key saved and selected.',
  'cli.provider.usingTokenPlan': 'Using MiniMax Token Plan.',
  'cli.provider.usingApiKey': 'Using MiniMax API Key.',
  'cli.plugin.sourcesRefreshed': 'Refreshed all Plugin sources.',
  'cli.telemetry.disabled':
    'Usage telemetry is disabled. No business telemetry request will be sent.',
  'cli.update.manual':
    'MCode could not identify the owner of this installation. Update manually with:\n  {command}',
  'cli.update.updating': 'Updating MCode',
  'cli.update.phase.checking': 'Checking for updates',
  'cli.update.phase.downloading': 'Downloading release',
  'cli.update.phase.staging': 'Preparing isolated update',
  'cli.update.phase.installing': 'Installing package',
  'cli.update.phase.validating': 'Validating installed version',
  'cli.update.phase.activating': 'Activating new version',
  'cli.update.phase.completed': 'Completing update',
  'cli.update.available': 'MCode {version} is available on {channel} (current {currentVersion}).',
  'cli.update.availablePackage':
    'MCode {version} is available on @{packageTag} (current {currentVersion}, installed through {source}).',
  'cli.update.command': 'Command: {command}',
  'cli.update.nonInteractiveCommand':
    'No interactive confirmation is available. Run: {command}',
  'cli.update.nonInteractive':
    'No interactive confirmation is available. Run `mcode update` from a terminal to install it.',
} as const;

/** Every key the command-line catalog defines. */
export type CliCopyKey = keyof typeof EN_CLI_COPY;
