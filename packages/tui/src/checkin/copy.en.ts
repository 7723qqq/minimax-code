/**
 * English copy for the daily check-in surface.
 *
 * The English object is the only source of truth for key shape: the zh-Hans
 * catalog is typed against it, so a missing translation is a compile error
 * rather than an empty line in the interface.
 */
export const EN_CHECKIN_COPY = {
  'checkin.claimed': 'Checked in: Cycle day {dayNo}, +{points} Credits\n{progress}',
  'checkin.alreadyClaimed': 'Already checked in today.\n{progress}',
  'checkin.unavailable': 'Daily check-in is unavailable right now.\n{progress}',
  'checkin.streak': '{streak}-day streak this cycle',
  'checkin.cycle': 'This cycle: {days}',
} as const;

/** Every key the daily check-in catalog defines. */
export type CheckinCopyKey = keyof typeof EN_CHECKIN_COPY;
