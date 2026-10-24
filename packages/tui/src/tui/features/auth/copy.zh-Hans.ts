import type { AuthCopyKey } from './copy.en.js';

/**
 * Simplified Chinese copy for the sign-in and account-region surfaces.
 *
 * The `satisfies` clause is the completeness check: a key present in the
 * English catalog but absent here fails `pnpm typecheck`.
 */
export const ZH_HANS_AUTH_COPY = {
  browserLoginLabel: '浏览器登录（默认）',
  browserLoginDescription: '在本机登录',
  deviceCodeLoginLabel: '设备码登录',
  deviceCodeLoginDescription: 'SSH / 远程开发机',
  selectContinueCancel: '↑↓ 选择 · Enter 继续 · Esc 取消',
  retryCancel: 'Enter 重试 · Esc 取消',
  cancel: 'Esc 取消',
  cancelling: '正在取消登录…',
  checking: '正在检查 Codex 登录…',
  starting: '正在启动 Codex 登录…',
  waitingForAuthorization: '正在等待授权…',
  enterCode: '输入验证码：{code}',
  openLinkInBrowser: '请在本机的浏览器中打开该链接，并输入验证码。',
  completeInBrowser: '请在浏览器中完成登录。',
  codeExpiresIn: '验证码将在 {n} 分钟内过期。',
  unavailableInBuild: '此版本不支持 Codex 登录。',
  openLinkManually: '请手动打开上方链接以继续。',
  signInFailed: 'Codex 登录失败。请重试以继续。',
  regionChinaLabel: '中国（CN）',
  regionChinaDescription: 'MiniMax 国内账号',
  regionGlobalLabel: '国际版',
  regionGlobalDescription: 'MiniMax 国际账号',
  singleRegionOnly: '同一时间只能登录一个 MiniMax 账号区域。',
  chooseRegion: '选择账号区域',
} as const satisfies Readonly<Record<AuthCopyKey, string>>;
