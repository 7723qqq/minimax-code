import type { CheckinCopyKey } from './copy.en.js';

/**
 * Simplified Chinese copy for the daily check-in surface.
 *
 * The `satisfies` clause is the completeness check: a key present in the
 * English catalog but absent here fails `pnpm typecheck`.
 */
export const ZH_HANS_CHECKIN_COPY = {
  'checkin.claimed': '签到成功：周期第 {dayNo} 天，+{points} 积分\n{progress}',
  'checkin.alreadyClaimed': '今天已签到。\n{progress}',
  'checkin.unavailable': '当前无法进行每日签到。\n{progress}',
  'checkin.streak': '本周期已连续签到 {streak} 天',
  'checkin.cycle': '本周期：{days}',
} as const satisfies Readonly<Record<CheckinCopyKey, string>>;
