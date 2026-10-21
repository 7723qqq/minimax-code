import { RUNTIME_CATALOG, resolveLocaleName, translate } from '@mavis/shared/i18n';

import { tuiUpdateText } from './copy.js';

export function mcodePrefixActivationScheduledMessage(
  _environment: NodeJS.ProcessEnv = process.env,
): string {
  return tuiUpdateText('update.prefix.activationScheduled');
}

export function mcodePrefixJournalScheduleFailedMessage(
  _environment: NodeJS.ProcessEnv = process.env,
): string {
  return tuiUpdateText('update.prefix.journalScheduleFailed');
}

export function mcodePrefixNonPrefixPlanMessage(_environment: NodeJS.ProcessEnv): string {
  return tuiUpdateText('update.prefix.nonPrefixPlan');
}

export function mcodePrefixOwnershipMissingMessage(_environment: NodeJS.ProcessEnv): string {
  return tuiUpdateText('update.prefix.ownershipMissing');
}

export function mcodePrefixPendingActivationMessage(
  version: string,
  options: {
    readonly blockingSessionCount?: number;
    readonly environment?: NodeJS.ProcessEnv;
  } = {},
): string {
  if (options.blockingSessionCount === undefined) {
    return tuiUpdateText('update.prefix.pendingActivation.default', { version });
  }
  const blockingSessionCount = Math.max(0, Math.trunc(options.blockingSessionCount));
  if (blockingSessionCount > 0) {
    return tuiUpdateText(
      blockingSessionCount === 1
        ? 'update.prefix.pendingActivation.blocking.one'
        : 'update.prefix.pendingActivation.blocking.many',
      { version, count: blockingSessionCount },
    );
  }
  return tuiUpdateText('update.prefix.pendingActivation.immediate', { version });
}

export function mcodePrefixPendingCleanupMessage(
  version: string,
  options: {
    readonly blockingSessionCount?: number;
    readonly environment?: NodeJS.ProcessEnv;
  } = {},
): string {
  if (options.blockingSessionCount === undefined) {
    return tuiUpdateText('update.prefix.pendingCleanup.default', { version });
  }
  const blockingSessionCount = Math.max(0, Math.trunc(options.blockingSessionCount));
  if (blockingSessionCount > 0) {
    return tuiUpdateText(
      blockingSessionCount === 1
        ? 'update.prefix.pendingCleanup.blocking.one'
        : 'update.prefix.pendingCleanup.blocking.many',
      { version, count: blockingSessionCount },
    );
  }
  return tuiUpdateText('update.prefix.pendingCleanup.immediate', { version });
}

export function mcodePrefixStagedVersionMismatchMessage(
  actualVersion: string,
  expectedVersion: string,
  _environment: NodeJS.ProcessEnv,
): string {
  return tuiUpdateText('update.prefix.stagedVersionMismatch', { actualVersion, expectedVersion });
}

export function mcodePrefixStagedMessage(
  version: string,
  options: {
    readonly blockingSessionCount?: number;
    readonly environment?: NodeJS.ProcessEnv;
  } = {},
): string {
  if (options.blockingSessionCount === undefined) {
    return tuiUpdateText('update.prefix.staged.default', { version });
  }
  const blockingSessionCount = Math.max(0, Math.trunc(options.blockingSessionCount));
  if (blockingSessionCount > 0) {
    return tuiUpdateText(
      blockingSessionCount === 1
        ? 'update.prefix.staged.blocking.one'
        : 'update.prefix.staged.blocking.many',
      { version, count: blockingSessionCount },
    );
  }
  return tuiUpdateText('update.prefix.staged.immediate', { version });
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
  return tuiUpdateText('update.prefix.notStaged', { version, reason });
}
