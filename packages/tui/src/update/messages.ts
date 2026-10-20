import { RUNTIME_CATALOG, resolveLocaleName, translate } from '@mavis/shared/i18n';

export function mcodePrefixActivationScheduledMessage(
  _environment: NodeJS.ProcessEnv = process.env,
): string {
  return 'A staged MCode update will activate after this process exits.';
}

export function mcodePrefixJournalScheduleFailedMessage(
  _environment: NodeJS.ProcessEnv = process.env,
): string {
  return 'MCode update was staged, but its activation journal could not be scheduled.';
}

export function mcodePrefixNonPrefixPlanMessage(_environment: NodeJS.ProcessEnv): string {
  return 'MCode npm prefix updater received a non-prefix plan.';
}

export function mcodePrefixOwnershipMissingMessage(_environment: NodeJS.ProcessEnv): string {
  return 'MCode npm prefix ownership metadata is missing.';
}

export function mcodePrefixPendingActivationMessage(
  version: string,
  options: {
    readonly blockingSessionCount?: number;
    readonly environment?: NodeJS.ProcessEnv;
  } = {},
): string {
  if (options.blockingSessionCount === undefined) {
    return `MCode ${version} is already staged. Restarting will resume activation after running MCode sessions exit.`;
  }
  const blockingSessionCount = Math.max(0, Math.trunc(options.blockingSessionCount));
  if (blockingSessionCount > 0) {
    return `MCode ${version} is already staged. Activation will wait for ${String(blockingSessionCount)} other MCode ${blockingSessionCount === 1 ? 'session' : 'sessions'} to exit.`;
  }
  return `MCode ${version} is already staged. It will activate after this process exits.`;
}

export function mcodePrefixPendingCleanupMessage(
  version: string,
  options: {
    readonly blockingSessionCount?: number;
    readonly environment?: NodeJS.ProcessEnv;
  } = {},
): string {
  if (options.blockingSessionCount === undefined) {
    return `MCode ${version} is already active. Restarting will finish update cleanup after running MCode sessions exit.`;
  }
  const blockingSessionCount = Math.max(0, Math.trunc(options.blockingSessionCount));
  if (blockingSessionCount > 0) {
    return `MCode ${version} is already active. Update cleanup will wait for ${String(blockingSessionCount)} other MCode ${blockingSessionCount === 1 ? 'session' : 'sessions'} to exit.`;
  }
  return `MCode ${version} is already active. Restarting will finish update cleanup.`;
}

export function mcodePrefixStagedVersionMismatchMessage(
  actualVersion: string,
  expectedVersion: string,
  _environment: NodeJS.ProcessEnv,
): string {
  return `MCode update staged ${actualVersion}; expected ${expectedVersion}.`;
}

export function mcodePrefixStagedMessage(
  version: string,
  options: {
    readonly blockingSessionCount?: number;
    readonly environment?: NodeJS.ProcessEnv;
  } = {},
): string {
  if (options.blockingSessionCount === undefined) {
    return `MCode ${version} is downloaded and staged safely. Waiting for running MCode sessions to exit before activation.`;
  }
  const blockingSessionCount = Math.max(0, Math.trunc(options.blockingSessionCount));
  if (blockingSessionCount > 0) {
    return `MCode ${version} is downloaded and staged safely. Waiting for ${String(blockingSessionCount)} other MCode ${blockingSessionCount === 1 ? 'session' : 'sessions'} to exit before activation.`;
  }
  return `MCode ${version} is downloaded and staged safely. It will activate after this process exits.`;
}

export function mcodePrefixVersionedInstalledMessage(
  version: string,
  environment: NodeJS.ProcessEnv = process.env,
): string {
  // Locale resolution and `{version}` interpolation both come from the shared
  // module; the previous version read LC_ALL/LC_MESSAGES/LANG by hand and then
  // patched the template with a single `.replace`.
  return translate(
    RUNTIME_CATALOG,
    resolveLocaleName(undefined, environment),
    'update.versionedInstalled',
    { version },
  );
}

export function mcodePrefixNotStagedMessage(
  version: string,
  reason: string,
  _environment: NodeJS.ProcessEnv,
): string {
  return `MCode ${version} was not staged; the active installation is unchanged: ${reason}`;
}
