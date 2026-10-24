import type { CliCopyKey } from './copy.en.js';

/**
 * Simplified Chinese copy for the `mcode` command-line surfaces.
 *
 * The `satisfies` clause is the completeness check: a key present in the
 * English catalog but absent here fails `pnpm typecheck`.
 */
export const ZH_HANS_CLI_COPY = {
  'cli.provider.apiKeyMissing':
    '缺少 Provider API key。请设置 {envName}，或传入 --api-key-env <name>。',
  'cli.provider.modelRequired': '至少需要一个 --model <id>。',
  'cli.provider.connectionUnavailable': '连接不可用',
  'cli.provider.connectionTestFailed': 'Provider 连接测试失败，没有保存或选中任何配置。',
  'cli.provider.connectionTestNextStep':
    '请检查 URL、API key 和第一个模型 ID 后重试；如需不测试直接保存，请去掉 --use。',
  'cli.provider.addedAndSelected': '已添加并选中 Provider：{name}',
  'cli.provider.added': '已添加 Provider：{name}',
  'cli.provider.removeNeedsYes': '拒绝在没有 --yes 的情况下删除 Provider。',
  'cli.provider.removed': '已删除 Provider：{id}',
  'cli.provider.oauthManagedByLogin': 'MiniMax OAuth 登录与连接管理请使用 /login。',
  'cli.provider.oauthTestSkipped': '已跳过 MiniMax OAuth Provider 测试。',
  'cli.provider.oauthTestNextStep': '请运行 /login 管理 Token Plan 登录。',
  'cli.provider.available': 'Provider 可用：{provider}',
  'cli.provider.testFailed': 'Provider 测试失败。',
  'cli.provider.testNextStep': '请检查 URL、API key 和模型 ID 后重试。',
  'cli.provider.minimaxApiKeyMissing':
    '缺少 MiniMax API key。请设置 {envName}，或传入 --api-key-env <name>。',
  'cli.provider.apiKeySaved': '已保存并选中 MiniMax API Key。',
  'cli.provider.usingTokenPlan': '正在使用 MiniMax Token Plan。',
  'cli.provider.usingApiKey': '正在使用 MiniMax API Key。',
  'cli.plugin.sourcesRefreshed': '已刷新全部 Plugin 源。',
  'cli.telemetry.disabled': '使用遥测已关闭，不会发送任何业务遥测请求。',
  'cli.update.manual': 'MCode 无法识别当前安装的归属方。\n请手动更新：\n  {command}',
  'cli.update.updating': '正在更新 MCode',
  'cli.update.phase.checking': '正在检查更新',
  'cli.update.phase.downloading': '正在下载发布包',
  'cli.update.phase.staging': '正在准备隔离更新',
  'cli.update.phase.installing': '正在安装软件包',
  'cli.update.phase.validating': '正在校验已安装版本',
  'cli.update.phase.activating': '正在启用新版本',
  'cli.update.phase.completed': '正在完成更新',
  'cli.update.available': 'MCode {version} 已在 {channel} 上可用（当前 {currentVersion}）。',
  'cli.update.availablePackage':
    'MCode {version} 已在 @{packageTag} 上可用（当前 {currentVersion}，通过 {source} 安装）。',
  'cli.update.command': '命令：{command}',
  'cli.update.nonInteractiveCommand': '当前没有可用的交互确认。请运行：{command}',
  'cli.update.nonInteractive':
    '当前没有可用的交互确认。请在终端中运行 `mcode update` 完成安装。',
} as const satisfies Readonly<Record<CliCopyKey, string>>;
