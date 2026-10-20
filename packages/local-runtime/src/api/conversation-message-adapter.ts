import type { AgentMessage } from '@mavis/agent-core/protocol/agent-message';
import { isTurnLifecycleKind } from '@mavis/shared/turn-message-class';
import type { ConversationCommittedMessage } from '@mavis/conversation-contract';

export function toAgentMessages(messages: readonly ConversationCommittedMessage[]): AgentMessage[] {
  return messages.flatMap((message) => {
    if (isAgentMessage(message.raw)) return [message.raw];
    const msgId = message.msgId;
    if (!msgId) return [];
    return [
      {
        msg_id: msgId,
        ...(message.role === 'user' || message.role === 'assistant' ? { role: message.role } : {}),
        ...(message.text ? { msg_content: message.text } : {}),
        ...(message.thinking ? { thinking_content: message.thinking } : {}),
        ...(message.toolCalls ? { tool_calls: [...message.toolCalls] } : {}),
        // Preserve every lifecycle classification, not just the compaction
        // subset; dropping a review frame here re-labels it as model output
        // for every downstream consumer that reads `AgentMessage.kind`.
        ...(isTurnLifecycleKind(message.kind) ? { kind: message.kind } : {}),
      },
    ];
  });
}

function isAgentMessage(value: unknown): value is AgentMessage {
  return (
    typeof value === 'object' && value !== null && typeof Reflect.get(value, 'msg_id') === 'string'
  );
}
