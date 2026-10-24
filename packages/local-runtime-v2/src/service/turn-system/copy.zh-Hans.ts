import type { V2TurnSystemCopyKey } from './copy.en.js';

/**
 * Simplified Chinese copy for the v2 turn system.
 *
 * The `satisfies` clause is the completeness check: a key present in the
 * English catalog but absent here fails `pnpm typecheck`.
 *
 * `Hook`, `Plugin` and the event name stay in their English form: they name
 * runtime APIs and hooks rather than prose, and the surrounding sentence is
 * translated.
 */
export const ZH_HANS_V2_TURN_SYSTEM_COPY = {
  'pluginHook.terminalControlUnsupported':
    'Plugin Hook 请求了终端控制输出，但当前 Runtime 界面不执行终端控制序列。',
  'pluginHook.outcome.toolUnchanged': '本次 Hook 未改变工具执行与结果。',
  'pluginHook.outcome.conversationContinued': '对话已继续，未应用本次 Hook。',
  'pluginHook.skippedCompatibility':
    '来自 Plugin "{pluginName}" 的兼容性受限 Hook 在 {event} 期间被跳过。{outcome}',
  'pluginHook.timedOut': 'Plugin "{pluginName}" 的 Hook 在 {event} 期间超时并被跳过。{outcome}',
  'pluginHook.incomplete':
    'Plugin "{pluginName}" 的 Hook 在 {event} 期间无法完成并被跳过。{outcome}',
  'userInputControl.queuedPromptStopped': '排队中的提示词已被 Plugin Hook 停止。',
  'agentHost.automaticCompactionStopped': '自动压缩已被 Plugin Hook 停止。',
} as const satisfies Readonly<Record<V2TurnSystemCopyKey, string>>;
