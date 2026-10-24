import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { isValidLocaleTag } from '@mavis/shared/i18n';
import type { TuiMode } from '../tui/engine/public.js';

const TUI_SETTINGS_FILE = path.join('tui', 'tui-settings.json');
const LEGACY_TUI_SETTINGS_FILE = 'tui-settings.json';
const THEME_ID = /^[a-z0-9][a-z0-9._-]{0,63}$/iu;

interface TuiSettingsDocument {
  readonly tuiMode?: unknown;
  readonly theme?: unknown;
  readonly locale?: unknown;
}

function settingsPath(dataDir: string): string {
  return path.join(dataDir, TUI_SETTINGS_FILE);
}

function readDocument(dataDir: string): TuiSettingsDocument {
  for (const file of [TUI_SETTINGS_FILE, LEGACY_TUI_SETTINGS_FILE]) {
    try {
      const content = readFileSync(path.join(dataDir, file), 'utf8').replace(/^\uFEFF/u, '');
      const parsed = JSON.parse(content) as unknown;
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as TuiSettingsDocument;
      }
    } catch {
      // Try the legacy root location before falling back to defaults.
    }
  }
  return {};
}

function writeDocument(dataDir: string, patch: TuiSettingsDocument): void {
  const filePath = settingsPath(dataDir);
  const directory = path.dirname(filePath);
  mkdirSync(directory, { recursive: true, mode: 0o700 });
  // Merge instead of replacing so writing one preference never drops the other.
  const next: Record<string, unknown> = { ...readDocument(dataDir), ...patch };
  if (next.tuiMode === undefined) delete next.tuiMode;
  if (next.theme === undefined) delete next.theme;
  if (next.locale === undefined) delete next.locale;
  const temporaryPath = path.join(directory, `.tui-settings.json.${process.pid}.${Date.now()}.tmp`);
  writeFileSync(temporaryPath, `${JSON.stringify(next, null, 2)}\n`, {
    encoding: 'utf8',
    mode: 0o600,
  });
  renameSync(temporaryPath, filePath);
}

export function readTuiModeSetting(dataDir: string): TuiMode {
  return readDocument(dataDir).tuiMode === 'fullscreen' ? 'fullscreen' : 'regular';
}

export function writeTuiModeSetting(dataDir: string, mode: TuiMode): void {
  writeDocument(dataDir, { tuiMode: mode });
}

/**
 * Saved theme selection. Accepts `id` or `id/light|dark` so a user can pin an
 * appearance for terminals that report their background unreliably. Unknown or
 * malformed values resolve to the default theme in the controller, never here.
 */
export function readTuiThemeSetting(dataDir: string): string | undefined {
  const value = readDocument(dataDir).theme;
  if (typeof value !== 'string') return undefined;
  const raw = value.trim();
  if (!raw) return undefined;
  const pair = /^([a-z0-9][a-z0-9._-]{0,63})\/(light|dark)$/iu.exec(raw);
  const pinnedId = pair?.[1];
  const pinnedAppearance = pair?.[2];
  if (pinnedId && pinnedAppearance) {
    return `${pinnedId}/${pinnedAppearance.toLowerCase()}`;
  }
  return THEME_ID.test(raw) ? raw : undefined;
}

export function writeTuiThemeSetting(dataDir: string, theme: string): void {
  const raw = theme.trim();
  if (!THEME_ID.test(raw) && !/^[a-z0-9][a-z0-9._-]{0,63}\/(light|dark)$/iu.test(raw)) {
    throw new Error(`"${theme}" is not a valid theme id`);
  }
  writeDocument(dataDir, { theme: raw });
}

/**
 * Saved interface language. Stored as a BCP 47 tag so a future language needs no
 * new key, and validated before it is written: the value is spread into the
 * settings document next to `tuiMode` and `theme`.
 *
 * A value that is missing, not a string, or not a well-formed tag resolves to
 * `undefined` — the caller then falls back to the environment chain — so a hand
 * edited file can never block startup or pin the interface to a broken tag.
 */
export function readTuiLocaleSetting(dataDir: string): string | undefined {
  const value = readDocument(dataDir).locale;
  if (typeof value !== 'string') return undefined;
  const raw = value.trim().replace(/_/gu, '-');
  if (!raw || !isValidLocaleTag(raw)) return undefined;
  return raw;
}

export function writeTuiLocaleSetting(dataDir: string, locale: string): void {
  const raw = locale.trim().replace(/_/gu, '-');
  if (!raw || !isValidLocaleTag(raw)) {
    throw new Error(`"${locale}" is not a valid BCP 47 language tag`);
  }
  writeDocument(dataDir, { locale: raw });
}
