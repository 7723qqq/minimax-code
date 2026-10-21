import {
  SigninDayStatus,
  getCurrentSigninStreak,
  type SigninPanel,
} from '@mavis/shared/daily-signin';
import type { TuiDailyCheckinOutcome } from './application.js';
import { checkinText } from './copy.js';

export function formatTuiDailyCheckinOutcome(outcome: TuiDailyCheckinOutcome): string {
  const progress = formatProgress(outcome.panel);
  if (outcome.status === 'claimed') {
    return checkinText('checkin.claimed', {
      dayNo: outcome.dayNo,
      points: outcome.points,
      progress,
    });
  }
  if (outcome.status === 'already-claimed') {
    return checkinText('checkin.alreadyClaimed', { progress });
  }
  return checkinText('checkin.unavailable', { progress });
}

function formatProgress(panel: SigninPanel): string {
  const streak = getCurrentSigninStreak(panel.days);
  const days = [...panel.days]
    .sort((left, right) => left.day_no - right.day_no)
    .map((day) => (day.status === SigninDayStatus.Claimed ? '✓' : '·'))
    .join(' ');
  return [
    streak > 0 ? checkinText('checkin.streak', { streak }) : undefined,
    checkinText('checkin.cycle', { days }),
  ]
    .filter((line): line is string => Boolean(line))
    .join('\n');
}
