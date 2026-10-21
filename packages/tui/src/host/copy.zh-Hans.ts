import type { HostCopyKey } from './copy.en.js';

/**
 * Simplified Chinese copy for the TUI host layer.
 *
 * The `satisfies` clause is the completeness check: a key present in the
 * English catalog but absent here fails `pnpm typecheck`.
 */
export const ZH_HANS_HOST_COPY = {
  'host.clipboard.readDenied':
    'Minimax Code 无法读取系统剪贴板。请允许剪贴板访问权限，然后重试。',
  'host.clipboard.pasteCancelled': '剪贴板图片粘贴已取消，当前草稿未被修改。',
} as const satisfies Readonly<Record<HostCopyKey, string>>;
