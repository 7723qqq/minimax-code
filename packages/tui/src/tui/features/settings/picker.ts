import { createCatalogSet, isChineseLocale, resolveLocaleName, translate } from '@mavis/shared/i18n';
import { getKeybindings, type TuiMode } from '../../engine/public.js';
import type { Component } from '../../rendering/component.js';
import { truncateToWidth, visibleWidth } from '../../rendering/text.js';
import { tuiChalk as chalk, tuiColors as colors } from '../../theme/runtime.js';
import {
  questionnaireFrameContentWidth,
  renderQuestionnaireFrame,
} from '../interaction/decision-frame.js';

const TUI_MODES = ['regular', 'fullscreen'] as const satisfies readonly TuiMode[];

/** Languages the settings picker can switch to. The tag is what gets saved. */
const TUI_LANGUAGES = ['zh-CN', 'en'] as const;

export type TuiLanguage = (typeof TUI_LANGUAGES)[number];

/**
 * Copy for the settings picker.
 *
 * Every string the panel renders comes from here, including the mode rows that
 * used to be literal English: a panel that is half translated reads as a bug,
 * and the earlier decision to localize only the new row left the rest behind.
 * English keeps its exact wording, which the existing panel assertions match.
 */
const EN_SETTINGS_COPY = {
  title: 'Settings',
  titleWithMode: 'Settings · {mode}',
  meta: 'TUI mode · {mode}',
  introCompact: 'Choose how MCode fills this terminal.',
  intro: 'Choose how MCode uses this terminal.',
  'mode.regular': 'Regular',
  'mode.fullscreen': 'Fullscreen',
  'mode.regular.description': 'Uses terminal scrollback, selection, and copy.',
  'mode.fullscreen.description': 'Keeps MCode in a fixed viewport with in-app scrolling.',
  current: '● current',
  footerCompact: '↑/↓ move · Enter · Esc close',
  footer: '↑/↓ select · Enter apply · Esc cancel',
  language: 'Interface language',
  hint: 'Language: {language}',
} as const;

const ZH_HANS_SETTINGS_COPY = {
  title: '设置',
  titleWithMode: '设置 · {mode}',
  meta: 'TUI 模式 · {mode}',
  introCompact: '选择 MCode 如何占用这个终端。',
  intro: '选择 MCode 如何使用这个终端。',
  'mode.regular': '常规',
  'mode.fullscreen': '全屏',
  'mode.regular.description': '使用终端自身的滚动、选择与复制。',
  'mode.fullscreen.description': '在固定视口中运行 MCode，由应用内滚动。',
  current: '● 当前',
  footerCompact: '↑/↓ 移动 · Enter · Esc 关闭',
  footer: '↑/↓ 选择 · Enter 应用 · Esc 取消',
  language: '界面语言',
  hint: '语言：{language}',
} as const satisfies Readonly<Record<keyof typeof EN_SETTINGS_COPY, string>>;

type SettingsCopyKey = keyof typeof EN_SETTINGS_COPY;

const SETTINGS_CATALOG = createCatalogSet(EN_SETTINGS_COPY, {
  'zh-Hans': ZH_HANS_SETTINGS_COPY,
});

function settingsText(
  locale: string | undefined,
  key: SettingsCopyKey,
  values?: Readonly<Record<string, string | number>>,
): string {
  return translate(SETTINGS_CATALOG, resolveLocaleName(locale), key, values);
}

/**
 * Confirmation hint after the language is saved.
 *
 * Rendered in the language that was just selected, so the confirmation is
 * readable in the interface the user is about to see.
 */
export function tuiLanguageHint(language: TuiLanguage): string {
  return settingsText(language, 'hint', { language: formatTuiLanguage(language) });
}

type SettingsRow =
  | { readonly kind: 'mode'; readonly mode: TuiMode }
  | { readonly kind: 'language'; readonly language: TuiLanguage };

const SETTINGS_ROWS: readonly SettingsRow[] = [
  ...TUI_MODES.map((mode): SettingsRow => ({ kind: 'mode', mode })),
  ...TUI_LANGUAGES.map((language): SettingsRow => ({ kind: 'language', language })),
];

/** Map a resolved locale tag to the picker row and the value that gets saved. */
export function tuiLanguageFromLocale(locale: string): TuiLanguage {
  return isChineseLocale(locale) ? 'zh-CN' : 'en';
}

/** Language name in its own language, so the row reads the same in both modes. */
export function formatTuiLanguage(language: TuiLanguage): string {
  return language === 'zh-CN' ? '中文' : 'English';
}

function modeLabel(mode: TuiMode): string {
  return settingsText(undefined, mode === 'regular' ? 'mode.regular' : 'mode.fullscreen');
}

function modeDescription(mode: TuiMode): string {
  return settingsText(
    undefined,
    mode === 'regular' ? 'mode.regular.description' : 'mode.fullscreen.description',
  );
}

export class TuiSettingsPicker implements Component {
  private selectedIndex: number;

  constructor(
    private currentMode: TuiMode,
    private currentLanguage: TuiLanguage,
    private readonly onTuiModeChange: (mode: TuiMode) => boolean,
    private readonly onLanguageChange: (language: string) => boolean,
    private readonly onClose: () => void,
  ) {
    this.selectedIndex = Math.max(0, SETTINGS_ROWS.findIndex((row) => this.isActive(row)));
  }

  private isActive(row: SettingsRow): boolean {
    return row.kind === 'mode'
      ? row.mode === this.currentMode
      : row.language === this.currentLanguage;
  }

  private activeIndexFor(kind: SettingsRow['kind']): number {
    const index = SETTINGS_ROWS.findIndex((row) => row.kind === kind && this.isActive(row));
    return index < 0 ? 0 : index;
  }

  handleInput(data: string): void {
    const keybindings = getKeybindings();
    if (keybindings.matches(data, 'tui.select.up')) {
      this.selectedIndex =
        this.selectedIndex === 0 ? SETTINGS_ROWS.length - 1 : this.selectedIndex - 1;
      return;
    }
    if (keybindings.matches(data, 'tui.select.down')) {
      this.selectedIndex = (this.selectedIndex + 1) % SETTINGS_ROWS.length;
      return;
    }
    if (keybindings.matches(data, 'tui.select.confirm')) {
      this.applySelectedRow();
      return;
    }
    if (keybindings.matches(data, 'tui.select.cancel')) this.onClose();
  }

  private applySelectedRow(): void {
    const row = SETTINGS_ROWS[this.selectedIndex];
    if (!row) {
      this.onClose();
      return;
    }
    if (row.kind === 'mode') {
      if (row.mode === this.currentMode) {
        this.onClose();
        return;
      }
      if (this.onTuiModeChange(row.mode)) {
        this.currentMode = row.mode;
        this.onClose();
      } else {
        this.selectedIndex = this.activeIndexFor('mode');
      }
      return;
    }
    if (row.language === this.currentLanguage) {
      this.onClose();
      return;
    }
    if (this.onLanguageChange(row.language)) {
      this.currentLanguage = row.language;
      this.onClose();
    } else {
      this.selectedIndex = this.activeIndexFor('language');
    }
  }

  invalidate(): void {}

  render(width: number): string[] {
    const safeWidth = Math.max(0, Math.floor(width));
    if (safeWidth === 0) return [];
    const contentWidth = questionnaireFrameContentWidth(safeWidth);
    const compact = contentWidth < 56;
    const narrow = safeWidth < 42;
    const currentMode = modeLabel(this.currentMode);
    const focusedRow = SETTINGS_ROWS[this.selectedIndex];
    const focusedMode = focusedRow?.kind === 'mode' ? focusedRow.mode : undefined;
    const focusedLanguage = focusedRow?.kind === 'language' ? focusedRow.language : undefined;
    return renderQuestionnaireFrame(
      {
        title: narrow
          ? settingsText(undefined, 'titleWithMode', { mode: currentMode })
          : settingsText(undefined, 'title'),
        ...(narrow ? {} : { meta: settingsText(undefined, 'meta', { mode: currentMode }) }),
        body: [
          chalk.hex(colors.muted)(
            settingsText(undefined, compact ? 'introCompact' : 'intro'),
          ),
          '',
          ...TUI_MODES.flatMap((mode) =>
            renderMode(mode, {
              active: mode === this.currentMode,
              focused: mode === focusedMode,
              compact,
              width: contentWidth,
            }),
          ),
          '',
          chalk.hex(colors.muted)(settingsText(undefined, 'language')),
          ...TUI_LANGUAGES.flatMap((language) =>
            renderLanguage(language, {
              active: language === this.currentLanguage,
              focused: language === focusedLanguage,
              width: contentWidth,
            }),
          ),
        ],
        footer: settingsText(undefined, narrow ? 'footerCompact' : 'footer'),
      },
      safeWidth,
      'signal',
    );
  }
}

function renderMode(
  mode: TuiMode,
  options: {
    readonly active: boolean;
    readonly focused: boolean;
    readonly compact: boolean;
    readonly width: number;
  },
): string[] {
  const prefix = options.focused ? chalk.bold.hex(colors.signal)('›') : ' ';
  const label = (options.focused ? chalk.bold.hex(colors.signal) : chalk.hex(colors.text))(
    padToVisualWidth(modeLabel(mode), 10),
  );
  const status = options.active ? chalk.hex(colors.signal)(settingsText(undefined, 'current')) : '';
  const description = chalk.hex(colors.muted)(modeDescription(mode));
  const heading = `${prefix} ${label}`;

  if (options.compact) {
    return [
      fitWithRightMeta(heading, status, options.width),
      truncateToWidth(`  ${description}`, options.width, ''),
    ];
  }
  return [fitWithRightMeta(`${heading}  ${description}`, status, options.width)];
}

function renderLanguage(
  language: TuiLanguage,
  options: {
    readonly active: boolean;
    readonly focused: boolean;
    readonly width: number;
  },
): string[] {
  const prefix = options.focused ? chalk.bold.hex(colors.signal)('›') : ' ';
  const label = (options.focused ? chalk.bold.hex(colors.signal) : chalk.hex(colors.text))(
    padToVisualWidth(formatTuiLanguage(language), 10),
  );
  const status = options.active ? chalk.hex(colors.signal)(settingsText(undefined, 'current')) : '';
  return [fitWithRightMeta(`${prefix} ${label}`, status, options.width)];
}

/**
 * Pad to a column budget rather than a code-unit count, so a two-character
 * Chinese label lines up with a seven-letter English one.
 */
function padToVisualWidth(text: string, width: number): string {
  const gap = width - visibleWidth(text);
  return gap > 0 ? `${text}${' '.repeat(gap)}` : text;
}

function fitWithRightMeta(content: string, meta: string, width: number): string {
  if (!meta) return truncateToWidth(content, width, '');
  const gap = width - visibleWidth(content) - visibleWidth(meta);
  if (gap >= 2) return `${content}${' '.repeat(gap)}${meta}`;
  const contentWidth = Math.max(0, width - visibleWidth(meta) - 2);
  return `${truncateToWidth(content, contentWidth, '')}  ${meta}`;
}
