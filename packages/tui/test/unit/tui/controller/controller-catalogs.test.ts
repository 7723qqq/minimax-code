import { describe, expect, it } from 'vitest';

import { EN_CONTROLLER_COPY } from '../../../../src/tui/controller/copy.en.js';
import { ZH_HANS_CONTROLLER_COPY } from '../../../../src/tui/controller/copy.zh-Hans.js';
import { EN_CONTROLLER_INTERACTION_COPY } from '../../../../src/tui/controller/interaction/copy.en.js';
import { ZH_HANS_CONTROLLER_INTERACTION_COPY } from '../../../../src/tui/controller/interaction/copy.zh-Hans.js';
import { EN_CONTROLLER_PRODUCT_COPY } from '../../../../src/tui/controller/product/copy.en.js';
import { ZH_HANS_CONTROLLER_PRODUCT_COPY } from '../../../../src/tui/controller/product/copy.zh-Hans.js';

/**
 * The three TUI controller catalogs, paired with their translation.
 *
 * The `satisfies` clause in each translation already makes a missing key a
 * compile error. This suite keeps the guarantees the type system cannot
 * express: a non-empty template on both sides, and the same set of `{name}`
 * placeholders in both, so an English template and a Chinese one can never
 * end up filling different arguments.
 */
const CATALOGS: ReadonlyArray<
  readonly [name: string, english: Readonly<Record<string, string>>, chinese: Readonly<Record<string, string>>]
> = [
  ['controller', EN_CONTROLLER_COPY, ZH_HANS_CONTROLLER_COPY],
  ['controller-interaction', EN_CONTROLLER_INTERACTION_COPY, ZH_HANS_CONTROLLER_INTERACTION_COPY],
  ['controller-product', EN_CONTROLLER_PRODUCT_COPY, ZH_HANS_CONTROLLER_PRODUCT_COPY],
];

function placeholders(value: string): string[] {
  return [...value.matchAll(/\{([A-Za-z0-9_.-]+)\}/gu)].map((match) => match[1]);
}

describe('TUI controller catalogs', () => {
  it('covers every controller surface', () => {
    expect(CATALOGS.length).toBeGreaterThanOrEqual(3);
  });

  it.each(CATALOGS)('%s translates every English key into Chinese', (_name, english, chinese) => {
    expect(Object.keys(chinese).sort()).toEqual(Object.keys(english).sort());
  });

  it.each(CATALOGS)('%s keeps every template non-empty in both languages', (_name, english, chinese) => {
    for (const [key, value] of Object.entries(english)) {
      expect(value.trim(), `en ${key}`).not.toBe('');
    }
    for (const [key, value] of Object.entries(chinese)) {
      expect(value.trim(), `zh ${key}`).not.toBe('');
    }
  });

  it.each(CATALOGS)(
    '%s preserves the same placeholders in both languages',
    (_name, english, chinese) => {
      for (const [key, value] of Object.entries(english)) {
        expect(placeholders(chinese[key] ?? ''), `zh ${key}`).toEqual(placeholders(value));
      }
    },
  );
});
