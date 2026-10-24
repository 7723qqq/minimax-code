/**
 * English copy for the shared TUI controller surfaces.
 *
 * The English object is the only source of truth for key shape: the zh-Hans
 * catalog is typed against it, so a missing translation is a compile error
 * rather than a blank line in the interface.
 *
 * This catalog owns the strings used by more than one controller directory
 * group — the run, runtime, session, projection and command surfaces — plus
 * the short sentences that several groups repeat, such as `Retry.` or
 * `Your draft is preserved.`. Feature-specific groups keep their own copy in
 * `controller/product/copy.en.ts` and `controller/interaction/copy.en.ts`.
 */
export const EN_CONTROLLER_COPY = {
  'common.retry': 'Retry.',
  'common.retryEsc': 'Retry Esc.',
  'common.noActiveSession': 'No active session.',
  'common.draftPreserved': 'Your draft is preserved.',
  'common.promptPreserved': 'Your prompt is preserved.',
  'common.stoppingDraftPreserved': 'Stopping the current response. Your draft is preserved.',
  'common.stopBeforeCommand': 'Stop the running turn before using {command}.',
  'common.sendMessageFailed': "Couldn't send this message.",
  'common.prepareMessageFailed': "Couldn't prepare this message.",
  'run.abort.delegatedStopFailed': "Couldn't stop delegated agents.",
  'run.abort.delegatedNotStopped': 'Some delegated agents did not stop cleanly: {sessions}',
  'run.abort.runtimeNotConfirmed':
    'Runtime did not confirm that the active response stopped.',
  'run.abort.stopFailed': "Couldn't stop the current response.",
  'run.abort.mayStillBeRunning': 'It may still be running.',
  'run.abort.restoreFailed': "Couldn't return the aborted prompt to the composer.",
  'run.abort.retryEscOrRecall': 'Retry Esc, or recall the prompt with Up.',
  'run.abort.transcriptUnchanged': 'The session transcript is unchanged.',
  'run.context.title': 'Context',
  'run.context.loading': 'Loading context details…',
  'run.context.unsupported': 'Context inspection is not supported by this Runtime.',
  'run.context.loadFailed': "Couldn't load context details.",
  'run.context.retryCommand': 'Retry /context.',
  'run.steer.usage': 'Usage: /steer <message>',
  'run.steer.decisionBlocked': 'Resolve the pending Runtime decision first.',
  'run.steer.unavailable': 'Steer is not available for the current work.',
  'run.steer.failed': "Couldn't steer current work.",
  'run.steer.retryCommand': 'Retry /steer.',
  'run.steer.notApplied': 'Your message was not applied.',
  'run.steer.refreshFailed': 'Steer was accepted, but this view could not refresh.',
  'run.steer.reopenToSync': 'Reopen the session to sync it.',
  'run.queue.sessionChanged':
    'The active Session changed before this message could enter the queue.',
  'run.queue.noWaitingMessage': 'No waiting message to remove.',
  'run.queue.steerTextOnly': 'Steer accepts text only. Attachments will run next.',
  'run.queue.reviewNotEditable': 'Review commands cannot be edited in the Queue.',
  'run.queue.restoredToComposer': 'Message restored to Composer.',
  'run.queue.missingItemId': 'Runtime did not return a queue item id.',
  'run.settlement.turnFailed': 'Runtime turn failed.',
  'run.settlement.publishFailed': 'Could not publish the TUI automation result.',
  'runtime.error.reasonDetail': '\nReason: {reason}',
  'runtime.error.codeDetail': '\nCode: {code}',
  'runtime.error.providerDetail': '\nProvider: {provider}',
  'runtime.error.providerConfigured': 'configured',
  'runtime.error.accessDenied':
    'Access denied.{diagnostics}{code}\nCheck account and model permissions before sending again. Your prompt is preserved.',
  'runtime.error.credentialsRejected':
    'The model provider rejected its credentials.{diagnostics}{code}\nCheck the selected provider API key and endpoint, then resend the message. Your prompt is preserved.',
  'runtime.error.authRejected':
    'The service rejected request authentication.{diagnostics}{code}\nIf the problem persists, report this error and its code. Your prompt is preserved.',
  'runtime.error.imageLimit':
    'The model provider rejected the request: the conversation carries too many images.{reason}{provider}{code}\nResending fails the same way. Run /compact to summarize earlier history, or /new to start a fresh Session. Your prompt is preserved.',
  'runtime.error.invalidRequest':
    'The model provider rejected the request as invalid.{reason}{provider}{code}\nResending the same conversation fails the same way. Run /compact to summarize earlier history, or /new to start a fresh Session. Your prompt is preserved.',
  'runtime.error.rateLimitedRetryable':
    'The model provider is rate limiting requests.{diagnostics}{code}\nWait a moment, then run /retry. Your prompt is preserved.',
  'runtime.error.rateLimitedFinal':
    'The model provider is rate limiting requests.{diagnostics}{code}\nWait a moment, then resend the message. Your prompt is preserved.',
  'runtime.error.usageLimit':
    'Usage limit reached.{diagnostics}{code}\nCheck /usage or switch provider, then resend the message. Your prompt is preserved.',
  'runtime.error.providerUnavailableRetryable':
    'The model provider is temporarily unavailable.{diagnostics}{code}\nRun /retry to resend your last message. Your prompt is preserved.',
  'runtime.error.providerUnavailableFinal':
    'The model provider is temporarily unavailable.{diagnostics}{code}\nCheck the selected provider settings before sending again. Your prompt is preserved.',
  'runtime.error.connectionEndedRetryable':
    'The model connection ended before the response was completed.{diagnostics}{code}\nRun /retry to resend your last message. Your prompt is preserved.',
  'runtime.error.connectionEndedFinal':
    'The model connection ended before the response was completed.{diagnostics}{code}\nCheck the connection before sending the message again. Your prompt is preserved.',
  'runtime.error.contentSafety':
    'The response was stopped by content safety checks.{diagnostics}{code}\nRevise the message before sending it again. Your prompt is preserved.',
  'runtime.error.modelTimeout':
    'The model did not respond for too long.{diagnostics}{code}\nWait a moment, then resend the message. Your prompt is preserved.',
  'runtime.error.responseFailedWithReasonRetryable':
    'The response failed.\nReason: {reason}{provider}{code}\nRun /retry to resend your last message. Your prompt is preserved.',
  'runtime.error.responseFailedWithReasonFinal':
    'The response failed.\nReason: {reason}{provider}{code}\nCheck the error details or selected provider settings before sending again. Your prompt is preserved.',
  'runtime.error.responseFailedRetryable':
    'The response failed.{provider}{code}\nRun /retry to resend your last message. Your prompt is preserved.',
  'runtime.error.responseFailedFinal':
    'The response failed.{provider}{code}\nCheck the selected provider settings before sending again. Your prompt is preserved.',
  'runtime.retirement.timeout':
    'Runtime is taking too long to stop the previous response. New messages remain blocked until Runtime releases the Session.',
  'runtime.retirement.notConfirmed': 'Runtime could not confirm that the previous turn stopped.',
  'runtime.retirement.confirmFailed': "Couldn't confirm that the previous response stopped.",
  'runtime.retirement.messagesBlocked': 'New messages remain blocked.',
  'runtime.event.streamEnded': 'Runtime event stream ended.',
  'runtime.event.streamEndedEarly': 'Runtime event stream ended before the CLI stopped.',
  'runtime.event.connectionLost': 'Connection lost.',
  'runtime.event.reconnecting': 'Reconnecting…',
  'runtime.event.contentReviewAuthExpired':
    'Content review authentication expired. Run /login, then retry.',
  'runtime.event.contentReviewNoResult':
    'Content review did not return a usable result, so this response stopped. Unreviewed output was withheld. Retry; if this persists, use /feedback to report the review failure.',
  'runtime.event.contentReviewWithdrew':
    'Content review withdrew this response. Rephrase your request, then retry.',
  'runtime.event.recoverFailed': "Couldn't recover the live response view.",
  'runtime.event.reopenToLoadMessages': 'Reopen the session to load its saved messages.',
  'runtime.event.queueNotAdded': 'Message was not added to the Queue. Retry.',
  'runtime.event.refreshTimedOut':
    'Runtime state refresh timed out after the response stopped. Reopen the Session to retry synchronization.',
  'runtime.event.historyReconcileFailed':
    '{message} Reopen the Session to retry synchronization.',
  'runtime.event.refreshFailed': "Couldn't refresh the saved response state.",
  'runtime.event.reopenToRetry': 'Reopen the session to retry.',
  'runtime.event.historyPart': 'History: {reason}',
  'runtime.event.queuePart': 'Queue: {reason}',
  'runtime.event.sessionMetadataPart': 'Session metadata: {reason}',
  'runtime.event.sessionRefreshFailed': 'Runtime session refresh failed for {parts}.',
  'runtime.event.partialRefreshFailed':
    "Couldn't fully refresh this session ({parts}). Reopen the session to retry.",
  'runtime.event.queueFailureSummary': 'Message was not added to the Queue',
  'runtime.event.queueFailureNextStep': 'Wait for the current response or retry.',
  'runtime.event.messageFailedSummary': 'Message failed before it could start',
  'runtime.event.messageFailedNextStep': 'Retry from the Queue.',
  'session.subAgentInternal':
    'Sub-agent Sessions are internal. Opened the parent Session instead.',
  'session.numericReferenceDeprecated':
    'Numeric Session references are deprecated; use /sessions or a Session ID.',
  'session.referenceAmbiguous': 'Session not found or reference is ambiguous: {reference}',
  'session.noParentSession': 'The active session has no parent session.',
  'session.sideAlreadyOpen':
    'A side conversation is already open. Press Ctrl+C to return before starting another.',
  'session.sideUnsupported':
    'This Runtime does not support side sessions; update Runtime to use /btw.',
  'session.sideOpenFailed': "Couldn't open a side conversation. Try again.",
  'session.sideCloseUnconfirmed':
    "Couldn't close the side conversation because Runtime did not confirm that its response stopped. Press Esc and retry.",
  'session.sideCleanupFailed':
    'Returned to the main Session, but temporary side-session cleanup failed. Runtime will keep it hidden; retry after reconnecting.',
  'session.noSavedSession': 'No saved Session exists in the current workspace.',
  'session.fork.alreadyInProgress': 'A Session fork is already in progress.',
  'session.fork.needsSession': 'Start or resume a Session before forking.',
  'session.fork.waitForTurn': 'Wait for the active turn to finish before forking.',
  'session.fork.unavailable': 'Session fork is unavailable in this Runtime.',
  'session.fork.cannotFork': 'This prompt cannot be forked.',
  'session.fork.cannotForkWithReason': 'This prompt cannot be forked: {reason}',
  'session.fork.promptGone': 'The selected prompt is no longer present in Runtime history.',
  'session.fork.noAssistantBoundary':
    'The selected prompt has no completed Assistant boundary to fork from.',
  'session.fork.uiClosed': 'The TUI closed before the fork completed.',
  'session.fork.sessionChanged': 'The active Session changed before the fork completed.',
  'chat.sessionsLoadFailed': "Couldn't load sessions.",
  'chat.openSessionFailed': "Couldn't open this session.",
  'chat.messagesUnchanged': 'Its saved messages are unchanged.',
  'chat.refreshSessionFailed': "Couldn't refresh this session.",
  'chat.reopenToRetry': 'Reopen it to retry.',
  'chat.titleEmpty': 'Session title cannot be empty.',
  'chat.turnAlreadyRunning': 'A turn is already running in this or another Session.',
  'chat.previousRunStopping': 'The previous run is still stopping.',
  'chat.runFailed': 'Run failed.',
  'chat.stopBeforeNewSession': 'Stop the running turn before starting a new session.',
  'chat.stopBeforeAction': 'Stop the running turn before {action}.',
  'chat.action.refreshHistory': 'refreshing session history',
  'chat.action.renameSession': 'renaming a session',
  'chat.action.archiveSession': 'archiving a session',
  'chat.action.restoreSession': 'restoring a session',
  'delegation.waitingForApproval': 'Waiting for approval',
  'delegation.waitingForAnswers': 'Waiting for answers',
  'projection.attachmentLabelOne': '{count} attachment',
  'projection.attachmentLabelMany': '{count} attachments',
  'projection.queueDraftLabel': '{keybinding} queue',
  'projection.retryAttempt': 'Retrying model request · {attempt}/{max}',
  'projection.retryNextIn': ' · next in {delay}',
  'projection.retryReason': ' · {reason}',
  'projection.retryCode': ' · code {code}',
  'projection.stoppingDraftPreserved': 'Stopping · draft preserved',
  'projection.messageSendHint': 'Message · {keybinding} send',
  'projection.sideQuestionPlaceholder': 'Ask a side question…',
  'projection.planNextMessageEnters': 'Plan Mode · next message enters Plan',
  'projection.defaultNextMessageExits': 'Default Mode · next message exits Plan',
  'projection.modeChangeSubmitting': '{mode} Mode change submitting…',
  'projection.accountChecking': 'Checking account',
  'projection.accountSignIn': 'Sign in with /login',
  'projection.accountReady': 'Account ready',
  'projection.accountWarnings': 'Connected with warnings',
  'projection.accountUnavailable': 'Account unavailable',
  'command.category.session': 'Session',
  'command.category.runtime': 'Runtime',
  'command.category.capability': 'Capability',
  'command.category.input': 'Input',
  'command.category.transcript': 'Transcript',
  'command.category.decision': 'Decision',
  'command.category.application': 'Application',
  'command.description.update': 'Check for and install an MCode update',
  'command.description.changelog': 'Show the packaged MCode update history',
  'command.description.sessions': 'Search, resume, and manage sessions',
  'command.description.goal': 'Start or manage the current Session Goal',
  'command.description.plan': 'Switch Plan Mode or view the latest Plan',
  'command.description.review': 'Review staged, unstaged, and untracked local changes',
  'command.description.parent': 'Return from a sub-agent session to its parent',
  'command.description.btw': 'Ask a side question without interrupting the running task',
  'command.description.retry': 'Resend the last message after a failed response',
  'command.description.rename': 'Rename the active session',
  'command.description.archive': 'Archive the active session',
  'command.description.tasks': 'Inspect background agents and Runtime tasks',
  'command.description.permission': 'Choose or inspect the Runtime permission mode',
  'command.description.login': 'Sign in to use MiniMax Code Agent features',
  'command.description.logout': 'Sign out of the shared Desktop account',
  'command.description.config': 'Show the effective read-only configuration',
  'command.description.steer': 'Steer current work without interrupting it',
  'command.description.feedback': 'Review and submit redacted product feedback',
  'command.description.checkin': 'Claim the daily MiniMax account reward',
  'command.description.settings': 'Configure the MCode terminal interface',
  'command.description.statusline': 'Choose, reorder, and preview status line items',
  'command.description.theme': 'Choose the MCode color theme and terminal appearance',
  'command.description.hotkeys': 'View and customize TUI keyboard shortcuts',
  'command.description.reload': 'Reload TUI configuration and Plugins',
  'command.description.provider': 'View providers and edit MiniMax credentials',
  'command.description.plugins': 'Browse, install, enable, and remove Plugins',
  'command.description.addDir': 'Add a readable and writable workspace directory',
  'command.description.decision': 'Reopen the pending action panel',
  'command.description.transcript': 'Browse, search, and inspect the full conversation',
  'command.description.copy': 'Copy last response as Markdown',
  'command.description.allow': 'Allow the pending tool once',
  'command.description.always': 'Always allow this action class',
  'command.description.deny': 'Deny the pending tool',
  'command.description.permissions': 'Show pending Runtime-owned permission requests',
  'command.description.stop': 'Interrupt the running turn',
  'command.description.queue': 'Manage messages that run after the current response',
  'command.description.quit': 'Exit Minimax Code',
  'command.argument.goal.pause': 'Pause Goal auto-continuation',
  'command.argument.goal.resume': 'Resume a paused or blocked Goal',
  'command.argument.goal.edit': 'Edit the current Goal objective',
  'command.argument.goal.clear': 'Remove the current Goal',
  'command.argument.goal.help': 'Show Goal syntax and budget examples',
  'command.argument.goal.budget': 'Set token budget; enter a value such as 50K',
  'command.argument.goal.budgetClear': 'Remove the Goal token budget',
  'command.argument.plan.on': 'Enable Plan Mode',
  'command.argument.plan.off': 'Return to default mode',
  'command.argument.plan.status': 'Show the current Plan Mode',
  'command.argument.plan.view': 'View the latest Plan',
  'command.argument.permission.status': 'Show the current permission mode',
  'command.argument.permission.ask': 'Use Ask mode',
  'command.argument.permission.auto': 'Use Auto mode',
  'command.argument.permission.full': 'Use Full Access mode',
  'command.unavailable.noParent': 'The current Session has no parent.',
  'command.unavailable.sideNeedsSession': 'Open a Session before starting a side conversation.',
  'command.unavailable.nothingToRetry': 'There is no failed response to retry in this Session.',
  'command.unavailable.renameNeedsSession': 'Start or resume a Session before renaming it.',
  'command.unavailable.compactNeedsSession':
    'Start or resume a Session before compacting it.',
  'command.unavailable.tasksNeedsSession': 'Start or resume a Session before opening background tasks.',
  'command.unavailable.noManagedAccount': 'No managed MiniMax account is signed in.',
  'command.unavailable.contextNeedsSession': 'Start or resume a Session before viewing context.',
  'command.unavailable.statusLineNeedsInteraction':
    'Finish the pending interaction before configuring the status line.',
  'command.unavailable.hotkeysNeedsIdle': 'Stop the active Turn before opening TUI keyboard shortcuts.',
  'command.unavailable.reloadNeedsIdle': 'Stop the active Turn before reloading TUI configuration.',
  'command.unavailable.exportNeedsSession': 'Start or resume a Session before exporting it.',
  'command.unavailable.transcriptNeedsSession':
    'Start or resume a Session before opening the Transcript.',
  'command.unavailable.copyNeedsSession': 'Start or resume a Session before copying a response.',
  'command.unavailable.queueEmpty': 'No messages are waiting and no response is currently running.',
  'command.unavailable.stopBeforeUsage': 'Stop the running turn before using {usage}.',
  'command.unavailable.notAvailableNow': '{usage} is unavailable right now.',
  'command.unavailable.sideRename': 'Side conversations are ephemeral and cannot be renamed.',
  'command.unavailable.sideCommand':
    '{usage} is unavailable in side conversations. Press Ctrl+C to return to the main session first.',
  'command.preparing.accountStatus': 'Loading account status…',
  'command.preparing.configurationCheck': 'Loading configuration check…',
  'command.preparing.dailyReward': 'Checking daily reward…',
  'session.defaultTitle': 'New session',
} as const;

/** Every key the shared controller catalog defines. */
export type ControllerCopyKey = keyof typeof EN_CONTROLLER_COPY;
