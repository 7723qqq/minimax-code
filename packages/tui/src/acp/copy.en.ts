/**
 * English copy for the ACP (Agent Client Protocol) surface.
 *
 * The English object is the only source of truth for key shape: the zh-Hans
 * catalog is typed against it, so a missing translation is a compile error
 * rather than an empty line in the chat reply.
 */
export const EN_ACP_COPY = {
  'acp.command.requiresNoArguments': 'Use `/{command}` without arguments.',
  'acp.command.newThread':
    'Start a new thread in your ACP client to begin a fresh session.',
  'acp.command.noCompactionNeeded': 'No compaction is needed for this conversation yet.',
  'acp.command.modelSelected': 'Model selected: {selection}',
  'acp.command.contextLoading': 'Context is still loading. Retry /context shortly.',
  'acp.command.noContextSnapshot':
    'No Runtime context snapshot is available for this session yet.',
  'acp.command.noSkills': 'No Skills matched the current Agent configuration.',
  'acp.command.noMcpServers': 'No configured MCP servers matched the filter.',
  'acp.command.noUsage': 'No usage has been recorded for this session.',
  'acp.command.noModels': 'No models are available for this session.',
  'acp.availableModels': 'Available models:',
  'acp.agent.sessionCreationFailed': 'Failed to create a new ACP Session.',
  'acp.agent.invalidModelSelection': 'Invalid model selection.',
  'acp.agent.runtimeFailed': 'MiniMax Code Runtime failed: {reason}',
  'acp.agent.runtimeFailedWithoutReason': 'MiniMax Code Runtime failed.',
  'acp.agent.continuationFailed': 'MiniMax Code Runtime continuation failed: {reason}',
  'acp.agent.continuationFailedWithoutReason': 'MiniMax Code Runtime continuation failed.',
} as const;

/** Every key the ACP catalog defines. */
export type AcpCopyKey = keyof typeof EN_ACP_COPY;
