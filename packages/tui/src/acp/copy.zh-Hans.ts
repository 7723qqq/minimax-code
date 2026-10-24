import type { AcpCopyKey } from './copy.en.js';

/**
 * Simplified Chinese copy for the ACP (Agent Client Protocol) surface.
 *
 * The `satisfies` clause is the completeness check: a key present in the
 * English catalog but absent here fails `pnpm typecheck`.
 */
export const ZH_HANS_ACP_COPY = {
  'acp.command.requiresNoArguments': '请使用 `/{command}`，不要带参数。',
  'acp.command.newThread': '请在 ACP 客户端中新建会话，以开始一次全新的 Session。',
  'acp.command.noCompactionNeeded': '当前对话还不需要压缩。',
  'acp.command.modelSelected': '已选择模型：{selection}',
  'acp.command.contextLoading': '上下文仍在加载中，请稍后重试 /context。',
  'acp.command.noContextSnapshot': '当前 Session 还没有可用的 Runtime 上下文快照。',
  'acp.command.noSkills': '没有 Skills 与当前 Agent 配置匹配。',
  'acp.command.noMcpServers': '没有符合筛选条件的已配置 MCP 服务器。',
  'acp.command.noUsage': '当前 Session 尚未记录任何用量。',
  'acp.command.noModels': '当前 Session 没有可用的模型。',
  'acp.availableModels': '可用模型：',
  'acp.agent.sessionCreationFailed': '无法创建新的 ACP Session。',
  'acp.agent.invalidModelSelection': '模型选择无效。',
  'acp.agent.runtimeFailed': 'MiniMax Code Runtime 运行失败：{reason}',
  'acp.agent.runtimeFailedWithoutReason': 'MiniMax Code Runtime 运行失败。',
  'acp.agent.continuationFailed': 'MiniMax Code Runtime 续跑失败：{reason}',
  'acp.agent.continuationFailedWithoutReason': 'MiniMax Code Runtime 续跑失败。',
} as const satisfies Readonly<Record<AcpCopyKey, string>>;
