import { createCatalogSet, translate } from './i18n/catalog.js';
import { resolveLocaleName, resolveTimeZone } from './i18n/locale.js';

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;
const FOUR_DAYS_MS = 4 * DAY_MS;
const RECENT_CALENDAR_DAYS = 7;

/**
 * Product-time copy.
 *
 * Date patterns, weekday names and relative-time phrases are user-visible text,
 * so they live in a catalog instead of inline `isChineseLocale(...)` ternaries.
 * Patterns carry placeholders rather than concatenated separators: the Chinese
 * date form is year-first and hyphenated, which is a different arrangement, not
 * a different separator.
 */
const EN_PRODUCT_TIME_COPY = {
  'date.monthDay': '{month}/{day}',
  'date.yearMonthDay': '{month}/{day}/{year}',
  'weekday.sun': 'Sun',
  'weekday.mon': 'Mon',
  'weekday.tue': 'Tue',
  'weekday.wed': 'Wed',
  'weekday.thu': 'Thu',
  'weekday.fri': 'Fri',
  'weekday.sat': 'Sat',
  'time.now': 'Now',
  'time.yesterday': 'Yesterday',
  'time.minutesAgo': '{minutes}m',
  'time.hoursAgo': '{hours}h',
  'time.daysAgo': '{days}d',
  'time.withClock': '{label} {clock}',
} as const;

const ZH_HANS_PRODUCT_TIME_COPY = {
  'date.monthDay': '{month}-{day}',
  'date.yearMonthDay': '{year}-{month}-{day}',
  'weekday.sun': '周日',
  'weekday.mon': '周一',
  'weekday.tue': '周二',
  'weekday.wed': '周三',
  'weekday.thu': '周四',
  'weekday.fri': '周五',
  'weekday.sat': '周六',
  'time.now': '刚刚',
  'time.yesterday': '昨天',
  'time.minutesAgo': '{minutes}分钟前',
  'time.hoursAgo': '{hours}小时前',
  'time.daysAgo': '{days}天前',
  'time.withClock': '{label} {clock}',
} as const satisfies Readonly<Record<keyof typeof EN_PRODUCT_TIME_COPY, string>>;

const PRODUCT_TIME_CATALOG = createCatalogSet(EN_PRODUCT_TIME_COPY, {
  'zh-Hans': ZH_HANS_PRODUCT_TIME_COPY,
});

type ProductTimeCopyKey = keyof typeof EN_PRODUCT_TIME_COPY;

/** Weekday label keys indexed by `Date#getUTCDay()`. */
const WEEKDAY_KEYS = [
  'weekday.sun',
  'weekday.mon',
  'weekday.tue',
  'weekday.wed',
  'weekday.thu',
  'weekday.fri',
  'weekday.sat',
] as const satisfies readonly ProductTimeCopyKey[];

const DEFAULT_TIME_ZONE = resolveTimeZone();

const formatterCache = new Map<string, Intl.DateTimeFormat>();

export type ProductTimePreset =
  | 'social-precise'
  | 'social-compact'
  | 'community-relative'
  | 'common-precise'
  | 'common-date'
  | 'audit-datetime'
  | 'audit-date';

export interface ProductTimeOptions {
  preset: ProductTimePreset;
  /** Runtime locale. Chinese locales use year-first hyphenated dates; others use English rules. */
  locale?: string;
  /** Injectable clock for deterministic rendering and tests. Defaults to Date.now(). */
  nowMs?: number;
  /** IANA timezone used for calendar boundaries. Defaults to the user's local timezone. */
  timeZone?: string;
}

type ProductTimeLocale = 'en' | 'zh-Hans';

function text(
  locale: ProductTimeLocale,
  key: ProductTimeCopyKey,
  values?: Readonly<Record<string, string | number>>,
): string {
  return translate(PRODUCT_TIME_CATALOG, locale, key, values);
}

interface ZonedDateParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}

function getFormatter(timeZone: string): Intl.DateTimeFormat {
  const cached = formatterCache.get(timeZone);
  if (cached) return cached;

  const formatter = new Intl.DateTimeFormat('en-US-u-ca-gregory-nu-latn', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });
  formatterCache.set(timeZone, formatter);
  return formatter;
}

function getZonedDateParts(timestampMs: number, timeZone: string): ZonedDateParts {
  const values: Partial<Record<Intl.DateTimeFormatPartTypes, string>> = {};
  for (const part of getFormatter(timeZone).formatToParts(timestampMs)) {
    if (part.type !== 'literal') values[part.type] = part.value;
  }

  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    hour: Number(values.hour),
    minute: Number(values.minute),
  };
}

function resolveLocale(locale?: string): ProductTimeLocale {
  return resolveLocaleName(locale) === 'zh-Hans' ? 'zh-Hans' : 'en';
}

function padTwo(value: number): string {
  return String(value).padStart(2, '0');
}

function formatTime(parts: ZonedDateParts): string {
  return `${padTwo(parts.hour)}:${padTwo(parts.minute)}`;
}

function isSameDay(left: ZonedDateParts, right: ZonedDateParts): boolean {
  return left.year === right.year && left.month === right.month && left.day === right.day;
}

function formatDate(
  parts: ZonedDateParts,
  locale: ProductTimeLocale,
  includeYear: boolean,
): string {
  const month = padTwo(parts.month);
  const day = padTwo(parts.day);
  if (!includeYear) return text(locale, 'date.monthDay', { month, day });
  return text(locale, 'date.yearMonthDay', { year: parts.year, month, day });
}

function formatDateTime(
  parts: ZonedDateParts,
  locale: ProductTimeLocale,
  includeYear: boolean,
): string {
  return `${formatDate(parts, locale, includeYear)} ${formatTime(parts)}`;
}

function calendarDayIndex(parts: ZonedDateParts): number {
  return Date.UTC(parts.year, parts.month - 1, parts.day) / DAY_MS;
}

function formatWeekday(parts: ZonedDateParts, locale: ProductTimeLocale): string {
  const weekday = new Date(Date.UTC(parts.year, parts.month - 1, parts.day)).getUTCDay();
  const key = WEEKDAY_KEYS[weekday] ?? WEEKDAY_KEYS[0];
  return text(locale, key);
}

function formatSocialTime(
  timestampMs: number,
  nowMs: number,
  timestamp: ZonedDateParts,
  now: ZonedDateParts,
  locale: ProductTimeLocale,
  precise: boolean,
): string {
  const sameYear = timestamp.year === now.year;
  if (timestampMs > nowMs) {
    return precise
      ? formatDateTime(timestamp, locale, !sameYear)
      : formatDate(timestamp, locale, !sameYear);
  }

  const elapsedMs = nowMs - timestampMs;
  if (elapsedMs < MINUTE_MS) return text(locale, 'time.now');
  if (isSameDay(timestamp, now)) return formatTime(timestamp);

  const dayDelta = calendarDayIndex(now) - calendarDayIndex(timestamp);
  if (dayDelta === 1) {
    return text(locale, 'time.withClock', {
      label: text(locale, 'time.yesterday'),
      clock: formatTime(timestamp),
    });
  }
  if (dayDelta > 1 && dayDelta < RECENT_CALENDAR_DAYS) {
    const weekday = formatWeekday(timestamp, locale);
    return precise
      ? text(locale, 'time.withClock', { label: weekday, clock: formatTime(timestamp) })
      : weekday;
  }

  return precise
    ? formatDateTime(timestamp, locale, !sameYear)
    : formatDate(timestamp, locale, !sameYear);
}

function formatCommunityTime(
  timestampMs: number,
  nowMs: number,
  timestamp: ZonedDateParts,
  now: ZonedDateParts,
  locale: ProductTimeLocale,
): string {
  const sameYear = timestamp.year === now.year;
  if (timestampMs > nowMs) return formatDate(timestamp, locale, !sameYear);

  const elapsedMs = nowMs - timestampMs;
  if (elapsedMs < MINUTE_MS) return text(locale, 'time.now');
  if (elapsedMs < HOUR_MS) {
    return text(locale, 'time.minutesAgo', { minutes: Math.floor(elapsedMs / MINUTE_MS) });
  }
  if (elapsedMs < DAY_MS) {
    return text(locale, 'time.hoursAgo', { hours: Math.floor(elapsedMs / HOUR_MS) });
  }
  if (elapsedMs < FOUR_DAYS_MS) {
    return text(locale, 'time.daysAgo', { days: Math.floor(elapsedMs / DAY_MS) });
  }

  return formatDate(timestamp, locale, !sameYear);
}

/**
 * Project-wide UI timestamp calculator.
 *
 * Input must be Unix milliseconds. Choose a semantic preset instead of assembling date patterns
 * at a call site. See `.harness/docs/design/time-display.md` for preset selection and exclusions.
 */
export function formatProductTime(
  timestampMs: number | null | undefined,
  options: ProductTimeOptions,
): string {
  if (typeof timestampMs !== 'number' || !Number.isFinite(timestampMs)) return '';

  const nowMs = options.nowMs ?? Date.now();
  if (!Number.isFinite(nowMs)) return '';

  const locale = resolveLocale(options.locale);
  const timeZone = options.timeZone ?? DEFAULT_TIME_ZONE;
  const timestamp = getZonedDateParts(timestampMs, timeZone);
  const now = getZonedDateParts(nowMs, timeZone);
  const sameYear = timestamp.year === now.year;

  switch (options.preset) {
    case 'social-precise':
      return formatSocialTime(timestampMs, nowMs, timestamp, now, locale, true);
    case 'social-compact':
      return formatSocialTime(timestampMs, nowMs, timestamp, now, locale, false);
    case 'community-relative':
      return formatCommunityTime(timestampMs, nowMs, timestamp, now, locale);
    case 'common-precise':
      return isSameDay(timestamp, now)
        ? formatTime(timestamp)
        : formatDateTime(timestamp, locale, !sameYear);
    case 'common-date':
      return isSameDay(timestamp, now)
        ? formatTime(timestamp)
        : formatDate(timestamp, locale, !sameYear);
    case 'audit-datetime':
      return formatDateTime(timestamp, locale, true);
    case 'audit-date':
      return formatDate(timestamp, locale, true);
  }
}
