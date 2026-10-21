import { describe, expect, it } from 'vitest';

import { EN_AUTH_COPY } from '../../src/tui/features/auth/copy.en.js';
import { ZH_HANS_AUTH_COPY } from '../../src/tui/features/auth/copy.zh-Hans.js';
import { EN_CHANGELOG_COPY } from '../../src/tui/features/changelog/copy.en.js';
import { ZH_HANS_CHANGELOG_COPY } from '../../src/tui/features/changelog/copy.zh-Hans.js';
import { COMPOSER_COPY } from '../../src/tui/features/composer/copy.en.js';
import { ZH_HANS_COMPOSER_COPY } from '../../src/tui/features/composer/copy.zh-Hans.js';
import { EN_FEEDBACK_COPY } from '../../src/tui/features/feedback/copy.en.js';
import { ZH_HANS_FEEDBACK_COPY } from '../../src/tui/features/feedback/copy.zh-Hans.js';
import { EN_GOAL_COPY } from '../../src/tui/features/goal/copy.en.js';
import { ZH_HANS_GOAL_COPY } from '../../src/tui/features/goal/copy.zh-Hans.js';
import { EN_HELP_COPY } from '../../src/tui/features/help/copy.en.js';
import { ZH_HANS_HELP_COPY } from '../../src/tui/features/help/copy.zh-Hans.js';
import { EN_HISTORY_COPY } from '../../src/tui/features/history/copy.en.js';
import { ZH_HANS_HISTORY_COPY } from '../../src/tui/features/history/copy.zh-Hans.js';
import { EN_INSPECTION_COPY } from '../../src/tui/features/inspection/copy.en.js';
import { ZH_HANS_INSPECTION_COPY } from '../../src/tui/features/inspection/copy.zh-Hans.js';
import { EN_INTERACTION_COPY } from '../../src/tui/features/interaction/copy.en.js';
import { ZH_HANS_INTERACTION_COPY } from '../../src/tui/features/interaction/copy.zh-Hans.js';
import { EN_MODEL_COPY } from '../../src/tui/features/model/copy.en.js';
import { ZH_HANS_MODEL_COPY } from '../../src/tui/features/model/copy.zh-Hans.js';
import { EN_PLUGIN_COPY } from '../../src/tui/features/plugin/copy.en.js';
import { ZH_HANS_PLUGIN_COPY } from '../../src/tui/features/plugin/copy.zh-Hans.js';
import { EN_PROVIDER_COPY } from '../../src/tui/features/provider/copy.en.js';
import { ZH_HANS_PROVIDER_COPY } from '../../src/tui/features/provider/copy.zh-Hans.js';
import { EN_QUEUE_COPY } from '../../src/tui/features/queue/copy.en.js';
import { ZH_HANS_QUEUE_COPY } from '../../src/tui/features/queue/copy.zh-Hans.js';
import { EN_SESSION_COPY } from '../../src/tui/features/session/copy.en.js';
import { ZH_HANS_SESSION_COPY } from '../../src/tui/features/session/copy.zh-Hans.js';
import {
  SESSION_HISTORY_COPY,
  SESSION_MUTATION_COPY,
} from '../../src/tui/features/session-mutation/copy.en.js';
import {
  ZH_HANS_SESSION_HISTORY_COPY,
  ZH_HANS_SESSION_MUTATION_COPY,
} from '../../src/tui/features/session-mutation/copy.zh-Hans.js';
import { EN_SETTINGS_ITEM_COPY } from '../../src/tui/features/settings/copy.en.js';
import { ZH_HANS_SETTINGS_ITEM_COPY } from '../../src/tui/features/settings/copy.zh-Hans.js';
import { EN_TRANSCRIPT_COPY } from '../../src/tui/features/transcript/copy.en.js';
import { ZH_HANS_TRANSCRIPT_COPY } from '../../src/tui/features/transcript/copy.zh-Hans.js';
import { EN_UPDATE_COPY } from '../../src/tui/features/update/copy.en.js';
import { ZH_HANS_UPDATE_COPY } from '../../src/tui/features/update/copy.zh-Hans.js';

/**
 * Every TUI feature catalog, paired with its translation.
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
  ['auth', EN_AUTH_COPY, ZH_HANS_AUTH_COPY],
  ['changelog', EN_CHANGELOG_COPY, ZH_HANS_CHANGELOG_COPY],
  ['composer', COMPOSER_COPY, ZH_HANS_COMPOSER_COPY],
  ['feedback', EN_FEEDBACK_COPY, ZH_HANS_FEEDBACK_COPY],
  ['goal', EN_GOAL_COPY, ZH_HANS_GOAL_COPY],
  ['help', EN_HELP_COPY, ZH_HANS_HELP_COPY],
  ['history', EN_HISTORY_COPY, ZH_HANS_HISTORY_COPY],
  ['inspection', EN_INSPECTION_COPY, ZH_HANS_INSPECTION_COPY],
  ['interaction', EN_INTERACTION_COPY, ZH_HANS_INTERACTION_COPY],
  ['model', EN_MODEL_COPY, ZH_HANS_MODEL_COPY],
  ['plugin', EN_PLUGIN_COPY, ZH_HANS_PLUGIN_COPY],
  ['provider', EN_PROVIDER_COPY, ZH_HANS_PROVIDER_COPY],
  ['queue', EN_QUEUE_COPY, ZH_HANS_QUEUE_COPY],
  ['session', EN_SESSION_COPY, ZH_HANS_SESSION_COPY],
  ['session-history', SESSION_HISTORY_COPY, ZH_HANS_SESSION_HISTORY_COPY],
  ['session-mutation', SESSION_MUTATION_COPY, ZH_HANS_SESSION_MUTATION_COPY],
  ['settings', EN_SETTINGS_ITEM_COPY, ZH_HANS_SETTINGS_ITEM_COPY],
  ['transcript', EN_TRANSCRIPT_COPY, ZH_HANS_TRANSCRIPT_COPY],
  ['update', EN_UPDATE_COPY, ZH_HANS_UPDATE_COPY],
];

function placeholders(value: string): string[] {
  return [...value.matchAll(/\{([A-Za-z0-9_.-]+)\}/gu)].map((match) => match[1]);
}

describe('TUI feature catalogs', () => {
  it('covers every feature surface', () => {
    // A new feature directory that is not listed here is a catalog that no
    // test checks, which is how an incomplete translation reaches production.
    expect(CATALOGS.length).toBeGreaterThanOrEqual(19);
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
