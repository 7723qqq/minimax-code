/**
 * English copy for the v2 turn system.
 *
 * The English object is the only source of truth for key shape: the zh-Hans
 * catalog is typed against it, so a missing translation is a compile error
 * rather than a blank line in the interface.
 *
 * The strings here are warnings the runtime shows to the user about Plugin
 * Hook behaviour. The event name, the plugin name and the outcome sentence are
 * separate values, so the composite sentences carry them as placeholders
 * instead of being assembled at the call site.
 */
export const EN_V2_TURN_SYSTEM_COPY = {
  'pluginHook.terminalControlUnsupported':
    'A Plugin Hook requested terminal control output, but this runtime surface does not execute terminal control sequences.',
  'pluginHook.outcome.toolUnchanged': 'The tool execution and result were not changed by this Hook.',
  'pluginHook.outcome.conversationContinued': 'The conversation continued without this Hook.',
  'pluginHook.skippedCompatibility':
    'A compatibility-limited Hook from Plugin "{pluginName}" was skipped during {event}. {outcome}',
  'pluginHook.timedOut': 'Plugin "{pluginName}" Hook timed out and was skipped during {event}. {outcome}',
  'pluginHook.incomplete':
    'Plugin "{pluginName}" Hook could not complete and was skipped during {event}. {outcome}',
  'userInputControl.queuedPromptStopped': 'Queued prompt stopped by Plugin Hook.',
  'agentHost.automaticCompactionStopped': 'Automatic compaction stopped by Plugin Hook.',
} as const;

/** Every key the v2 turn-system catalog defines. */
export type V2TurnSystemCopyKey = keyof typeof EN_V2_TURN_SYSTEM_COPY;
