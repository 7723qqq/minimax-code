/**
 * Conversation stop policy.
 *
 * `conversation.stopSubAgent` / `conversation.stopAsyncBash` control whether an
 * explicit user stop also cancels background subagents and background bash.
 */
export interface ConversationStopConfig {
  readonly stopSubAgent: boolean;
  readonly stopAsyncBash: boolean;
}

export const CONVERSATION_STOP_CONFIG_DEFAULTS: ConversationStopConfig = {
  stopSubAgent: true,
  stopAsyncBash: true,
};

export function parseConversationStopConfig(value: unknown): ConversationStopConfig {
  const source = isRecord(value) ? value : {};
  return {
    stopSubAgent:
      typeof source.stopSubAgent === 'boolean'
        ? source.stopSubAgent
        : CONVERSATION_STOP_CONFIG_DEFAULTS.stopSubAgent,
    stopAsyncBash:
      typeof source.stopAsyncBash === 'boolean'
        ? source.stopAsyncBash
        : CONVERSATION_STOP_CONFIG_DEFAULTS.stopAsyncBash,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
