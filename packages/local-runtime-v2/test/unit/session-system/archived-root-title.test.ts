import { describe, expect, it } from 'bun:test';

import {
  archivedRootPrefix,
  buildArchivedRootTitle,
} from '../../../src/service/session-system/sessions/root/archived-root-title.js';

describe('archived root session title', () => {
  it('renders the prefix in both languages', () => {
    // The Chinese form uses a full-width colon and no trailing space, so the
    // prefix is a catalog value rather than a label plus a shared separator.
    expect(archivedRootPrefix('en-US')).toBe('Memory archive: ');
    expect(archivedRootPrefix('zh-CN')).toBe('记忆归档：');
  });

  it('builds the full title from the fallback name', () => {
    expect(buildArchivedRootTitle({ fallbackName: 'Release', locale: 'en-US' })).toBe(
      'Memory archive: Release',
    );
    expect(buildArchivedRootTitle({ fallbackName: '发布', locale: 'zh-CN' })).toBe(
      '记忆归档：发布',
    );
  });

  it('keeps a real title instead of the fallback name', () => {
    expect(buildArchivedRootTitle({ oldTitle: 'Shipping', fallbackName: 'x', locale: 'en-US' })).toBe(
      'Memory archive: Shipping',
    );
    expect(buildArchivedRootTitle({ oldTitle: 'Main', fallbackName: 'x', locale: 'en-US' })).toBe(
      'Memory archive: x',
    );
  });
});
