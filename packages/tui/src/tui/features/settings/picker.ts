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
  footerSwitches: '↑/↓ select · Enter apply or switch · Esc close',
  language: 'Interface language',
  hint: 'Language: {language}',
  preferences: 'Preferences',
  'switch.on': '● on',
  'switch.off': '○ off',
  'switch.saving': 'saving…',
  'switch.unavailable': 'unavailable',
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
  footerSwitches: '↑/↓ 选择 · Enter 应用或切换 · Esc 取消',
  language: '界面语言',
  hint: '语言：{language}',
  preferences: '偏好',
  'switch.on': '● 开启',
  'switch.off': '○ 关闭',
  'switch.saving': '保存中…',
  'switch.unavailable': '不可用',
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

/** What a switch shows after a read or write. */
export interface TuiSettingsSwitchState {
  readonly enabled: boolean;
  /** Extra line under the row, for example where a change applies. */
  readonly note?: string;
}

/**
 * An on/off preference shown in /settings. Its value lives in the Runtime, so
 * reads and writes are async; resolving undefined means this host has none.
 */
export interface TuiSettingsSwitch {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  /** Short tag after the label, such as `Beta`. */
  readonly tag?: string;
  read(): Promise<TuiSettingsSwitchState | undefined>;
  write(enabled: boolean): Promise<TuiSettingsSwitchState | undefined>;
  /** One-line failure text for a rejected read or write. */
  describeFailure(action: 'read' | 'write'): string;
}

type SwitchView =
  | { readonly kind: 'loading' }
  | { readonly kind: 'ready'; readonly state: TuiSettingsSwitchState }
  | { readonly kind: 'saving'; readonly state: TuiSettingsSwitchState }
  | { readonly kind: 'failed'; readonly message: string; readonly state?: TuiSettingsSwitchState };

type SettingsRow =
  | { readonly kind: 'mode'; readonly mode: TuiMode }
  | { readonly kind: 'language'; readonly language: TuiLanguage }
  | { readonly kind: 'switch'; readonly item: TuiSettingsSwitch };

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
  private readonly switches: readonly TuiSettingsSwitch[];
  private readonly views = new Map<string, SwitchView>();
  private readonly hidden = new Set<string>();
  private readonly onChanged: () => void;
  private readonly onClosedFailure: ((message: string) => void) | undefined;
  private closed = false;

  constructor(
    private currentMode: TuiMode,
    private currentLanguage: TuiLanguage,
    private readonly onTuiModeChange: (mode: TuiMode) => boolean,
    private readonly onLanguageChange: (language: string) => boolean,
    private readonly onClose: () => void,
    options: {
      readonly switches?: readonly TuiSettingsSwitch[];
      /** Called when an async read or write changed what the picker shows. */
      readonly onChanged?: () => void;
      /** Reports a write that failed after the picker closed, where no row can show it. */
      readonly onClosedFailure?: (message: string) => void;
    } = {},
  ) {
    this.switches = options.switches ?? [];
    this.onChanged = options.onChanged ?? (() => undefined);
    this.onClosedFailure = options.onClosedFailure;
    this.selectedIndex = Math.max(0, this.rows().findIndex((row) => this.isActive(row)));
    for (const item of this.switches) {
      this.views.set(item.id, { kind: 'loading' });
      void this.load(item);
    }
  }

  private isActive(row: SettingsRow): boolean {
    if (row.kind === 'mode') return row.mode === this.currentMode;
    if (row.kind === 'language') return row.language === this.currentLanguage;
    return false;
  }

  handleInput(data: string): void {
    const keybindings = getKeybindings();
    const rows = this.rows();
    if (keybindings.matches(data, 'tui.select.up')) {
      this.selectedIndex = this.selectedIndex === 0 ? rows.length - 1 : this.selectedIndex - 1;
      return;
    }
    if (keybindings.matches(data, 'tui.select.down')) {
      this.selectedIndex = (this.selectedIndex + 1) % rows.length;
      return;
    }
    if (keybindings.matches(data, 'tui.select.confirm') || data === ' ') {
      const row = rows[this.selectedIndex];
      if (row?.kind === 'switch') {
        void this.toggle(row.item);
        return;
      }
      // Space toggles switches only; on mode and language rows it stays inert.
      if (data === ' ') return;
      this.applySelectedRow(row);
      return;
    }
    if (keybindings.matches(data, 'tui.select.cancel')) this.close();
  }

  private applySelectedRow(row: SettingsRow | undefined): void {
    if (!row) {
      this.close();
      return;
    }
    if (row.kind === 'switch') return;
    if (row.kind === 'mode') {
      if (row.mode === this.currentMode) {
        this.close();
        return;
      }
      if (this.onTuiModeChange(row.mode)) {
        this.currentMode = row.mode;
        this.close();
      } else {
        this.selectedIndex = this.activeIndexFor('mode');
      }
      return;
    }
    if (row.language === this.currentLanguage) {
      this.close();
      return;
    }
    if (this.onLanguageChange(row.language)) {
      this.currentLanguage = row.language;
      this.close();
    } else {
      this.selectedIndex = this.activeIndexFor('language');
    }
  }

  private activeIndexFor(kind: 'mode' | 'language'): number {
    const index = this.rows().findIndex((row) => row.kind === kind && this.isActive(row));
    return index < 0 ? 0 : index;
  }

  invalidate(): void {}

  render(width: number): string[] {
    const safeWidth = Math.max(0, Math.floor(width));
    if (safeWidth === 0) return [];
    const contentWidth = questionnaireFrameContentWidth(safeWidth);
    const compact = contentWidth < 56;
    const narrow = safeWidth < 42;
    const currentMode = modeLabel(this.currentMode);
    const rows = this.rows();
    const focusedRow = rows[this.selectedIndex];
    const focusedMode = focusedRow?.kind === 'mode' ? focusedRow.mode : undefined;
    const focusedLanguage = focusedRow?.kind === 'language' ? focusedRow.language : undefined;
    const switchRows = rows.flatMap((row, index) =>
      row.kind === 'switch'
        ? renderSwitch(row.item, this.views.get(row.item.id) ?? { kind: 'loading' }, {
            focused: index === this.selectedIndex,
            width: contentWidth,
          })
        : [],
    );
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
          ...(switchRows.length > 0
            ? ['', chalk.hex(colors.muted)(settingsText(undefined, 'preferences')), ...switchRows]
            : []),
        ],
        footer: settingsText(
          undefined,
          narrow ? 'footerCompact' : switchRows.length > 0 ? 'footerSwitches' : 'footer',
        ),
      },
      safeWidth,
      'signal',
    );
  }

  private rows(): SettingsRow[] {
    return [
      ...TUI_MODES.map((mode): SettingsRow => ({ kind: 'mode', mode })),
      ...TUI_LANGUAGES.map((language): SettingsRow => ({ kind: 'language', language })),
      ...this.switches
        .filter((item) => !this.hidden.has(item.id))
        .map((item): SettingsRow => ({ kind: 'switch', item })),
    ];
  }

  private close(): void {
    this.closed = true;
    this.onClose();
  }

  private async load(item: TuiSettingsSwitch): Promise<void> {
    let view: SwitchView | undefined;
    try {
      const state = await item.read();
      view = state ? { kind: 'ready', state } : undefined;
    } catch {
      view = { kind: 'failed', message: item.describeFailure('read') };
    }
    if (!view) {
      this.hide(item.id);
    } else {
      this.views.set(item.id, view);
    }
    this.notify();
  }

  private async toggle(item: TuiSettingsSwitch): Promise<void> {
    const view = this.views.get(item.id);
    // A switch whose value is unknown or being saved cannot be flipped safely.
    if (!view || view.kind === 'loading' || view.kind === 'saving' || !view.state) {
      if (view?.kind === 'failed' && !view.state) {
        this.views.set(item.id, { kind: 'loading' });
        this.notify();
        await this.load(item);
      }
      return;
    }
    const previous = view.state;
    this.views.set(item.id, { kind: 'saving', state: previous });
    this.notify();
    let next: SwitchView | undefined;
    try {
      const state = await item.write(!previous.enabled);
      next = state ? { kind: 'ready', state } : undefined;
    } catch {
      next = { kind: 'failed', message: item.describeFailure('write'), state: previous };
      if (this.closed) this.onClosedFailure?.(`${item.label}: ${next.message}`);
    }
    if (!next) {
      this.hide(item.id);
    } else {
      this.views.set(item.id, next);
    }
    this.notify();
  }

  private hide(id: string): void {
    const selected = rowKey(this.rows()[this.selectedIndex]);
    this.hidden.add(id);
    const remaining = this.rows();
    // rows() builds fresh objects, so the focused row is found again by identity key.
    const kept = selected ? remaining.findIndex((row) => rowKey(row) === selected) : -1;
    this.selectedIndex =
      kept >= 0 ? kept : Math.min(this.selectedIndex, Math.max(0, remaining.length - 1));
  }

  private notify(): void {
    if (!this.closed) this.onChanged();
  }
}

function rowKey(row: SettingsRow | undefined): string | undefined {
  if (!row) return undefined;
  if (row.kind === 'mode') return `mode:${row.mode}`;
  if (row.kind === 'language') return `language:${row.language}`;
  return `switch:${row.item.id}`;
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

function renderSwitch(
  item: TuiSettingsSwitch,
  view: SwitchView,
  options: { readonly focused: boolean; readonly width: number },
): string[] {
  const prefix = options.focused ? chalk.bold.hex(colors.signal)('›') : ' ';
  const labelText = item.tag ? `${item.label} (${item.tag})` : item.label;
  const label = (options.focused ? chalk.bold.hex(colors.signal) : chalk.hex(colors.text))(
    labelText,
  );
  const state = 'state' in view ? view.state : undefined;
  const value =
    view.kind === 'loading'
      ? chalk.hex(colors.muted)('…')
      : view.kind === 'saving'
        ? chalk.hex(colors.muted)(settingsText(undefined, 'switch.saving'))
        : state
          ? state.enabled
            ? chalk.hex(colors.signal)(settingsText(undefined, 'switch.on'))
            : chalk.hex(colors.muted)(settingsText(undefined, 'switch.off'))
          : chalk.hex(colors.error)(settingsText(undefined, 'switch.unavailable'));
  const lines = [fitWithRightMeta(`${prefix} ${label}`, value, options.width)];
  const indent = '    ';
  if (view.kind === 'failed') {
    lines.push(
      truncateToWidth(`${indent}${chalk.hex(colors.error)(view.message)}`, options.width, '…'),
    );
  }
  // The description explains the focused row; a note (where a change applies) always shows.
  const detail = [
    ...(options.focused ? [item.description] : []),
    ...(state?.note ? [state.note] : []),
  ];
  for (const text of detail) {
    lines.push(truncateToWidth(`${indent}${chalk.hex(colors.muted)(text)}`, options.width, '…'));
  }
  return lines;
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
