import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  readTuiLocaleSetting,
  readTuiModeSetting,
  readTuiThemeSetting,
  writeTuiLocaleSetting,
  writeTuiModeSetting,
  writeTuiThemeSetting,
} from '../../src/host/tui-settings.js';
import { resolveLocaleName, setProcessLocale } from '@mavis/shared/i18n';
import { TuiSettingsPicker } from '../../src/tui/features/settings/picker.js';
import { statusLineText } from '../../src/tui/features/settings/status-line-copy.js';
import { stripAnsi } from '../../src/tui/rendering/text.js';
import { readTuiPresentationConfig } from '../../src/tui/shell/status-line-config.js';

const directories: string[] = [];

afterEach(async () => {
  await Promise.all(directories.splice(0).map((directory) => rm(directory, { recursive: true })));
});

async function temporaryDataDir(): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), 'mcode-tui-settings-'));
  directories.push(directory);
  return directory;
}

describe('terminal presentation configuration', () => {
  it.each(['null', '[]', '[session-name, status]'])(
    'preserves terminalTitle %s through the config loader',
    async (title) => {
      const dataDir = await temporaryDataDir();
      await writeFile(
        join(dataDir, 'config.yaml'),
        `tui:\n  terminalTitle: ${title}\n  notifications:\n    when: unfocused\n    method: bel\n    events: [permission-required, turn-failed]\n`,
        'utf8',
      );
      const settings = await readTuiPresentationConfig(dataDir);
      expect(settings.terminalTitle).toEqual(
        title === 'null' ? null : title === '[]' ? [] : ['session-name', 'status'],
      );
      expect(settings.notifications).toEqual({
        when: 'unfocused',
        method: 'bel',
        events: ['permission-required', 'turn-failed'],
      });
    },
  );

  it.each([
    ['false', false],
    ['true', true],
    ['off', undefined],
  ] as const)('reads programStatus %s through the config loader', async (raw, expected) => {
    const dataDir = await temporaryDataDir();
    await writeFile(join(dataDir, 'config.yaml'), `tui:\n  programStatus: ${raw}\n`, 'utf8');
    const settings = await readTuiPresentationConfig(dataDir);
    expect(settings.programStatus).toBe(expected);
  });
});

describe('TUI mode settings', () => {
  it('uses regular mode when no valid explicit setting exists', async () => {
    const dataDir = await temporaryDataDir();

    expect(readTuiModeSetting(dataDir)).toBe('regular');
    await mkdir(join(dataDir, 'tui'), { recursive: true });
    await writeFile(join(dataDir, 'tui', 'tui-settings.json'), '{broken', 'utf8');
    expect(readTuiModeSetting(dataDir)).toBe('regular');
    await writeFile(join(dataDir, 'tui', 'tui-settings.json'), '{"tuiMode":"other"}', 'utf8');
    expect(readTuiModeSetting(dataDir)).toBe('regular');
  });

  it('persists the selected fullscreen mode in the MCode data directory', async () => {
    const dataDir = await temporaryDataDir();

    writeTuiModeSetting(dataDir, 'fullscreen');

    expect(readTuiModeSetting(dataDir)).toBe('fullscreen');
    expect(JSON.parse(await readFile(join(dataDir, 'tui', 'tui-settings.json'), 'utf8'))).toEqual({
      tuiMode: 'fullscreen',
    });
  });

  it('accepts a UTF-8 BOM written by Windows editors', async () => {
    const dataDir = await temporaryDataDir();
    await mkdir(join(dataDir, 'tui'), { recursive: true });
    await writeFile(
      join(dataDir, 'tui', 'tui-settings.json'),
      '\uFEFF{"tuiMode":"fullscreen"}',
      'utf8',
    );

    expect(readTuiModeSetting(dataDir)).toBe('fullscreen');
  });

  it('reads the legacy root file without writing back to the root', async () => {
    const dataDir = await temporaryDataDir();
    await writeFile(join(dataDir, 'tui-settings.json'), '{"tuiMode":"fullscreen"}', 'utf8');

    expect(readTuiModeSetting(dataDir)).toBe('fullscreen');
    writeTuiModeSetting(dataDir, 'regular');
    expect(JSON.parse(await readFile(join(dataDir, 'tui', 'tui-settings.json'), 'utf8'))).toEqual({
      tuiMode: 'regular',
    });
  });
});

describe('TUI theme settings', () => {
  it('uses no theme override when nothing is saved', async () => {
    const dataDir = await temporaryDataDir();

    expect(readTuiThemeSetting(dataDir)).toBeUndefined();
  });

  it('round-trips a theme and a pinned appearance', async () => {
    const dataDir = await temporaryDataDir();

    writeTuiThemeSetting(dataDir, 'aurora');
    expect(readTuiThemeSetting(dataDir)).toBe('aurora');

    writeTuiThemeSetting(dataDir, 'aurora/dark');
    expect(readTuiThemeSetting(dataDir)).toBe('aurora/dark');
  });

  it('does not drop the theme when the TUI mode is written afterwards', async () => {
    const dataDir = await temporaryDataDir();

    writeTuiThemeSetting(dataDir, 'midnight');
    writeTuiModeSetting(dataDir, 'fullscreen');

    expect(readTuiThemeSetting(dataDir)).toBe('midnight');
    expect(readTuiModeSetting(dataDir)).toBe('fullscreen');
  });

  it('does not drop the TUI mode when the theme is written afterwards', async () => {
    const dataDir = await temporaryDataDir();

    writeTuiModeSetting(dataDir, 'fullscreen');
    writeTuiThemeSetting(dataDir, 'graphite');

    expect(readTuiModeSetting(dataDir)).toBe('fullscreen');
    expect(readTuiThemeSetting(dataDir)).toBe('graphite');
  });

  it('rejects a theme id that is not a safe identifier', async () => {
    const dataDir = await temporaryDataDir();

    expect(() => writeTuiThemeSetting(dataDir, '../escape')).toThrow();
    expect(() => writeTuiThemeSetting(dataDir, 'a/b/c')).toThrow();
  });

  it('ignores a malformed saved theme instead of failing startup', async () => {
    const dataDir = await temporaryDataDir();
    await mkdir(join(dataDir, 'tui'), { recursive: true });
    await writeFile(
      join(dataDir, 'tui', 'tui-settings.json'),
      JSON.stringify({ theme: { nested: true } }),
      'utf8',
    );

    expect(readTuiThemeSetting(dataDir)).toBeUndefined();
    expect(readTuiModeSetting(dataDir)).toBe('regular');
  });

  it('ignores a saved theme that tries to traverse a path', async () => {
    const dataDir = await temporaryDataDir();
    await mkdir(join(dataDir, 'tui'), { recursive: true });
    await writeFile(
      join(dataDir, 'tui', 'tui-settings.json'),
      JSON.stringify({ theme: '../../etc/passwd' }),
      'utf8',
    );

    expect(readTuiThemeSetting(dataDir)).toBeUndefined();
  });

  it('keeps unknown settings keys when rewriting a known one', async () => {
    const dataDir = await temporaryDataDir();
    await mkdir(join(dataDir, 'tui'), { recursive: true });
    await writeFile(
      join(dataDir, 'tui', 'tui-settings.json'),
      JSON.stringify({ futureSetting: 'keep-me' }),
      'utf8',
    );

    writeTuiThemeSetting(dataDir, 'aurora');

    const document = JSON.parse(
      await readFile(join(dataDir, 'tui', 'tui-settings.json'), 'utf8'),
    ) as Record<string, unknown>;
    expect(document.futureSetting).toBe('keep-me');
    expect(document.theme).toBe('aurora');
  });
});

describe('TUI interface language setting', () => {
  it('uses no locale override when nothing is saved', async () => {
    const dataDir = await temporaryDataDir();

    expect(readTuiLocaleSetting(dataDir)).toBeUndefined();
  });

  it('round-trips a language tag and normalizes separators', async () => {
    const dataDir = await temporaryDataDir();

    writeTuiLocaleSetting(dataDir, 'zh-CN');
    expect(readTuiLocaleSetting(dataDir)).toBe('zh-CN');

    // A hand-edited `zh_CN` is accepted and stored in the canonical form.
    await writeFile(
      join(dataDir, 'tui', 'tui-settings.json'),
      JSON.stringify({ locale: 'zh_CN' }),
      'utf8',
    );
    expect(readTuiLocaleSetting(dataDir)).toBe('zh-CN');

    writeTuiLocaleSetting(dataDir, 'en');
    expect(readTuiLocaleSetting(dataDir)).toBe('en');
  });

  it('keeps the theme and TUI mode when the language is written', async () => {
    const dataDir = await temporaryDataDir();

    writeTuiThemeSetting(dataDir, 'midnight');
    writeTuiModeSetting(dataDir, 'fullscreen');
    writeTuiLocaleSetting(dataDir, 'zh-CN');

    expect(readTuiThemeSetting(dataDir)).toBe('midnight');
    expect(readTuiModeSetting(dataDir)).toBe('fullscreen');
    expect(readTuiLocaleSetting(dataDir)).toBe('zh-CN');
    expect(JSON.parse(await readFile(join(dataDir, 'tui', 'tui-settings.json'), 'utf8'))).toEqual({
      theme: 'midnight',
      tuiMode: 'fullscreen',
      locale: 'zh-CN',
    });
  });

  it('does not drop the language when another setting is written afterwards', async () => {
    const dataDir = await temporaryDataDir();

    writeTuiLocaleSetting(dataDir, 'zh-CN');
    writeTuiThemeSetting(dataDir, 'graphite');
    writeTuiModeSetting(dataDir, 'regular');

    expect(readTuiLocaleSetting(dataDir)).toBe('zh-CN');
    expect(readTuiThemeSetting(dataDir)).toBe('graphite');
    expect(readTuiModeSetting(dataDir)).toBe('regular');
  });

  it('treats a malformed saved language as not configured', async () => {
    const dataDir = await temporaryDataDir();
    await mkdir(join(dataDir, 'tui'), { recursive: true });

    for (const value of [42, null, '', 'fr FR', 'zh--CN', '../zh', 'zh-']) {
      await writeFile(
        join(dataDir, 'tui', 'tui-settings.json'),
        JSON.stringify({ locale: value, tuiMode: 'fullscreen' }),
        'utf8',
      );

      expect(readTuiLocaleSetting(dataDir)).toBeUndefined();
      // The rest of the document still loads; a bad language never blocks startup.
      expect(readTuiModeSetting(dataDir)).toBe('fullscreen');
    }
  });

  it('rejects a malformed language tag on write', async () => {
    const dataDir = await temporaryDataDir();

    expect(() => writeTuiLocaleSetting(dataDir, 'fr FR')).toThrow();
    expect(() => writeTuiLocaleSetting(dataDir, '')).toThrow();
    expect(() => writeTuiLocaleSetting(dataDir, '123')).toThrow();
    expect(readTuiLocaleSetting(dataDir)).toBeUndefined();
  });

  it('renders Chinese for a saved zh tag and English for any other language', async () => {
    const dataDir = await temporaryDataDir();

    writeTuiLocaleSetting(dataDir, 'zh-CN');
    expect(resolveLocaleName(readTuiLocaleSetting(dataDir))).toBe('zh-Hans');

    // A well-formed tag the catalogs do not cover falls back to English.
    writeTuiLocaleSetting(dataDir, 'fr-FR');
    expect(readTuiLocaleSetting(dataDir)).toBe('fr-FR');
    expect(resolveLocaleName(readTuiLocaleSetting(dataDir))).toBe('en');
  });

  it('switches rendered copy when the saved language is applied', async () => {
    const dataDir = await temporaryDataDir();
    // The suite runner pins MCODE_LOCALE=en, so an English render proves nothing
    // here; the saved language has to win over that pin.
    writeTuiLocaleSetting(dataDir, 'zh-CN');
    setProcessLocale(readTuiLocaleSetting(dataDir));
    try {
      expect(statusLineText('title')).toBe('状态栏');

      setProcessLocale('en');
      expect(statusLineText('title')).toBe('Status Line');
    } finally {
      setProcessLocale();
    }
  });
});

describe('settings picker copy', () => {
  function render(): string {
    const picker = new TuiSettingsPicker('regular', 'en', () => true, () => true, () => {});
    return stripAnsi(picker.render(100).join('\n'));
  }

  it('renders the whole panel in English by default', () => {
    const text = render();

    expect(text).toContain('Settings');
    expect(text).toContain('TUI mode · Regular');
    expect(text).toContain('Choose how MCode uses this terminal.');
    expect(text).toContain('Regular');
    expect(text).toContain('Fullscreen');
    expect(text).toContain('Uses terminal scrollback, selection, and copy.');
    expect(text).toContain('Interface language');
    expect(text).toContain('English');
    expect(text).toContain('● current');
    expect(text).toContain('↑/↓ select · Enter apply · Esc cancel');
  });

  it('renders the whole panel from the zh-Hans catalog', () => {
    setProcessLocale('zh-CN');
    try {
      const text = render();

      expect(text).toContain('设置');
      expect(text).toContain('TUI 模式 · 常规');
      expect(text).toContain('选择 MCode 如何使用这个终端。');
      expect(text).toContain('常规');
      expect(text).toContain('全屏');
      expect(text).toContain('使用终端自身的滚动、选择与复制。');
      expect(text).toContain('界面语言');
      expect(text).toContain('● 当前');
      expect(text).toContain('↑/↓ 选择 · Enter 应用 · Esc 取消');
    } finally {
      setProcessLocale();
    }
  });
});
