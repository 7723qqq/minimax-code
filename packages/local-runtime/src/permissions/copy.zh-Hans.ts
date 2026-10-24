import type { PermissionCopyKey } from './copy.en.js';

/**
 * Simplified Chinese copy for the local-runtime permission reasons.
 *
 * The `satisfies` clause is the completeness check: a key present in the
 * English catalog but absent here fails `pnpm typecheck`.
 *
 * The `{reason}` and `{instruction}` placeholders carry text that is not
 * product copy — a diagnostic code from the trash probe and the agent-facing
 * deletion instruction — so they stay in their original language inside the
 * translated sentence.
 */
export const ZH_HANS_PERMISSION_COPY = {
  'bypassImmune.networkShare':
    '本地硬安全策略已阻止 {tool}：内置工具和 bash 工具不支持直接访问网络共享"{share}"。请先把文件复制到本地工作区。',
  'bypassImmune.rootRecursiveDelete':
    '本地硬安全策略已阻止 {tool}：递归删除的目标是根目录或用户主目录，删除后无法恢复。请改为指定具体子路径，不要使用"/"、磁盘根目录或用户主目录。',
  'policy.webFetchApproval':
    '本地权限检查需要确认：web_fetch 将从本设备的本地网络环境请求 {url}。',
  'policy.webFetchApprovalNoUrl':
    '本地权限检查需要确认：web_fetch 将从本设备的本地网络环境请求一个 URL。',
  'policy.websiteDeployApproval':
    '本地权限检查需要确认：website_deploy 会在本设备的网络环境下把文件发布到公网端点。',
  'policy.sensitiveCredentialPath': '本地硬安全策略已阻止 {tool}：{path} 中包含敏感凭据路径',
  'ask.curlPipeShell': '本地权限检查需要确认：curl-pipe-shell 命令。',
  'ask.shellSubstitution': '本地权限检查需要确认：bash 命令中存在 shell 变量替换。',
  'ask.slowUnboundedScan': '本地权限检查需要确认：存在耗时的无边界文件系统扫描。',
  'ask.recursiveRm': '本地权限检查需要确认：递归 rm 命令。',
  'ask.workspaceEscape': '本地权限检查需要确认：{tool} 的路径超出工作区范围（{target}）。',
  'deletion.trashUnavailable':
    '本地硬安全策略已阻止删除：Windows mavis-trash 启动器不可用（{reason}）。智能体不得改用永久删除命令。{instruction}',
  'deletion.untrustedTrashLauncher':
    '本地硬安全策略已阻止删除：不带路径或路径不规范的 mavis-trash 不可信，因为 PATH/CWD 可能选中其他可执行文件。目标未被删除。请用一条顶层 rm 命令重试，运行时将使用位于"{launcherPath}"的可信启动器。请勿用永久删除命令、包装脚本或文件系统接口绕过这一限制。',
  'pluginHook.planModeUnsupported':
    'Plugin Hook setMode(plan) 不受支持，因为 MiniMax {mode}拥有独立的 Turn 生命周期。',
} as const satisfies Readonly<Record<PermissionCopyKey, string>>;
