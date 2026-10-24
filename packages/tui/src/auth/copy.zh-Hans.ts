import type { TuiAuthCopyKey } from './copy.en.js';

/**
 * Simplified Chinese copy for the TUI authentication surface.
 *
 * The `satisfies` clause is the completeness check: a key present in the
 * English catalog but absent here fails `pnpm typecheck`.
 */
export const ZH_HANS_TUI_AUTH_COPY = {
  'auth.alreadySignedIn': '已登录 MiniMax。',
  'auth.alreadySignedInRegion': '已登录 {region}。',
  'auth.signedIn': '已登录 MiniMax。',
  'auth.signedInRegion': '已登录 {region}。',
  'auth.alreadySignedOut': '已退出 MiniMax 登录。',
  'auth.signedOutLocally':
    '已在所有 MCode 中从 {region} 本地退出登录。服务端撤销将在网络恢复后完成。',
  'auth.signedOut': '已从 Desktop、CLI/TUI 和内置 mcode-tools 退出 {region} 登录。',
  'auth.signInExpired': 'MiniMax 登录已过期。请先运行 /login，然后重试。',
} as const satisfies Readonly<Record<TuiAuthCopyKey, string>>;
