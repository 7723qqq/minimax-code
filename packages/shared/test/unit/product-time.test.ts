import { describe, expect, it } from 'vitest';

import { formatProductTime } from '../../src/product-time.js';

/** Fixed clock so calendar boundaries and relative buckets are deterministic. */
const NOW = Date.UTC(2026, 9, 20, 12, 0, 0);
const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

function format(timestampMs: number, locale: string, preset = 'social-compact' as const): string {
  return formatProductTime(timestampMs, {
    preset,
    locale,
    nowMs: NOW,
    timeZone: 'UTC',
  });
}

describe('product time localization', () => {
  it('renders the "now" bucket in both languages', () => {
    expect(format(NOW - 10_000, 'en-US')).toBe('Now');
    expect(format(NOW - 10_000, 'zh-CN')).toBe('刚刚');
  });

  it('renders yesterday with a clock in both languages', () => {
    expect(format(NOW - DAY, 'en-US')).toBe('Yesterday 12:00');
    expect(format(NOW - DAY, 'zh-CN')).toBe('昨天 12:00');
  });

  it('renders weekday labels in both languages', () => {
    // Three days back (2026-10-17, a Saturday) is inside the recent window.
    expect(format(NOW - 3 * DAY, 'en-US')).toBe('Sat');
    expect(format(NOW - 3 * DAY, 'zh-CN')).toBe('周六');
  });

  it('renders relative minutes, hours and days in both languages', () => {
    const community = (timestampMs: number, locale: string) =>
      format(timestampMs, locale, 'community-relative');

    expect(community(NOW - 5 * MINUTE, 'en-US')).toBe('5m');
    expect(community(NOW - 5 * MINUTE, 'zh-CN')).toBe('5分钟前');
    expect(community(NOW - 3 * HOUR, 'en-US')).toBe('3h');
    expect(community(NOW - 3 * HOUR, 'zh-CN')).toBe('3小时前');
    expect(community(NOW - 2 * DAY, 'en-US')).toBe('2d');
    expect(community(NOW - 2 * DAY, 'zh-CN')).toBe('2天前');
  });

  it('switches date pattern and field order with the locale', () => {
    // Older than the recent window, so a calendar date is rendered.
    expect(format(NOW - 40 * DAY, 'en-US', 'audit-date')).toBe('09/10/2026');
    expect(format(NOW - 40 * DAY, 'zh-CN', 'audit-date')).toBe('2026-09-10');
  });

  it('keeps the month/day pattern locale-specific without a year', () => {
    expect(format(NOW - 40 * DAY, 'en-US')).toBe('09/10');
    expect(format(NOW - 40 * DAY, 'zh-CN')).toBe('09-10');
  });

  it('returns an empty string for unusable input', () => {
    expect(formatProductTime(null, { preset: 'social-compact', locale: 'en-US' })).toBe('');
    expect(formatProductTime(Number.NaN, { preset: 'social-compact', locale: 'en-US' })).toBe('');
  });
});
