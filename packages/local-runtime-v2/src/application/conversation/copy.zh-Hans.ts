import type { V2ConversationCopyKey } from './copy.en.js';

/**
 * Simplified Chinese copy for the v2 conversation application.
 *
 * The `satisfies` clause is the completeness check: a key present in the
 * English catalog but absent here fails `pnpm typecheck`.
 *
 * `Cloud` and `turn` stay in their English form: they name the remote service
 * and the runtime unit, and the surrounding sentence is translated.
 */
export const ZH_HANS_V2_CONVERSATION_COPY = {
  'handoff.previousTurnRunning': '上一个 turn 尚未停止，未开始 Cloud 交接。',
  'turnStoppedBeforeExecution': '该 turn 在执行前已被停止。',
  'handoff.proposalPending': '当前会话已有一个待审批的交接提案。',
  'handoff.inProgress': '当前会话正在交接到 Cloud。',
  'handoff.alreadyHandedOff': '当前会话已完成交接。请在已有的 Cloud 会话中继续。',
  'handoff.cleanupPending': '上一次 Cloud 交接正在等待清理。',
  'handoff.notAllowed': '不允许进行 Cloud 交接。',
  'handoff.preparationFailed': '无法准备 Cloud 交接，请稍后重试。',
} as const satisfies Readonly<Record<V2ConversationCopyKey, string>>;
