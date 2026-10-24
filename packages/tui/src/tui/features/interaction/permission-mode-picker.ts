import {
  formatTuiPermissionMode,
  formatTuiPermissionModeCompact,
  MINIMAX_CODE_PERMISSION_MODES,
  type TuiPermissionMode,
} from '../../../application/permission-mode.js';
import { getKeybindings, matchesKey } from '../../engine/public.js';
import type { Component } from '../../rendering/component.js';
import { truncateToWidth, visibleWidth } from '../../rendering/text.js';
import { tuiChalk as chalk, tuiColors as colors } from '../../theme/runtime.js';
import { questionnaireFrameContentWidth, renderQuestionnaireFrame } from './decision-frame.js';
import { interactionText, type InteractionCopyKey } from './copy.js';

type VisiblePermissionMode = (typeof MINIMAX_CODE_PERMISSION_MODES)[number];

const PERMISSION_MODE_DESCRIPTION_KEYS: Record<VisiblePermissionMode, InteractionCopyKey> = {
  default: 'permissionMode.description.default',
  auto: 'permissionMode.description.auto',
  bypassPermissions: 'permissionMode.description.bypassPermissions',
};

export class TuiPermissionModePicker implements Component {
  private selectedIndex: number;

  constructor(
    private readonly currentMode: TuiPermissionMode,
    private readonly onSelect: (mode: TuiPermissionMode) => void,
    private readonly onCancel: () => void,
    private readonly requestRender: () => void = () => undefined,
  ) {
    const currentIndex = MINIMAX_CODE_PERMISSION_MODES.indexOf(
      currentMode as VisiblePermissionMode,
    );
    this.selectedIndex = currentIndex >= 0 ? currentIndex : 0;
  }

  handleInput(data: string): void {
    if (matchesKey(data, 'up')) {
      this.selectedIndex =
        this.selectedIndex === 0
          ? MINIMAX_CODE_PERMISSION_MODES.length - 1
          : this.selectedIndex - 1;
      this.requestRender();
      return;
    }
    if (matchesKey(data, 'down')) {
      this.selectedIndex = (this.selectedIndex + 1) % MINIMAX_CODE_PERMISSION_MODES.length;
      this.requestRender();
      return;
    }
    if (/^[1-3]$/u.test(data)) {
      const mode = MINIMAX_CODE_PERMISSION_MODES[Number(data) - 1];
      if (mode) this.onSelect(mode);
      return;
    }
    if (matchesKey(data, 'enter')) {
      const mode = MINIMAX_CODE_PERMISSION_MODES[this.selectedIndex];
      if (mode) this.onSelect(mode);
      return;
    }
    if (getKeybindings().matches(data, 'tui.select.cancel')) this.onCancel();
  }

  invalidate(): void {}

  render(width: number): string[] {
    const safeWidth = Math.max(0, Math.floor(width));
    if (safeWidth === 0) return [];
    const contentWidth = questionnaireFrameContentWidth(safeWidth);
    const compact = contentWidth < 56;
    const currentMode = formatTuiPermissionMode(this.currentMode);
    return renderQuestionnaireFrame(
      {
        title: safeWidth < 42
          ? interactionText('permissionMode.titleWithMode', { mode: currentMode })
          : interactionText('permissionMode.title'),
        ...(safeWidth >= 42
          ? { meta: interactionText('permissionMode.meta', { mode: currentMode }) }
          : {}),
        body: [
          chalk.hex(colors.muted)(
            compact
              ? interactionText('permissionMode.body.compact')
              : interactionText('permissionMode.body.wide'),
          ),
          '',
          ...MINIMAX_CODE_PERMISSION_MODES.flatMap((mode, index) =>
            renderMode(mode, {
              active: mode === this.currentMode,
              focused: index === this.selectedIndex,
              compact,
              width: contentWidth,
            }),
          ),
        ],
        footer:
          safeWidth < 42
            ? interactionText('permissionMode.footer.compact')
            : interactionText('permissionMode.footer.wide'),
      },
      safeWidth,
      'signal',
    );
  }
}

function renderMode(
  mode: VisiblePermissionMode,
  options: {
    readonly active: boolean;
    readonly focused: boolean;
    readonly compact: boolean;
    readonly width: number;
  },
): string[] {
  const prefix = options.focused ? chalk.bold.hex(colors.signal)('›') : ' ';
  const labelColor = options.focused
    ? colors.signal
    : mode === 'bypassPermissions'
      ? colors.error
      : colors.text;
  const label = (options.focused ? chalk.bold : chalk).hex(labelColor)(
    formatTuiPermissionModeCompact(mode).padEnd(4),
  );
  const status = [
    mode === 'bypassPermissions' ? chalk.hex(colors.error)('⚠') : '',
    options.active ? chalk.hex(colors.signal)(interactionText('permissionMode.active')) : '',
  ]
    .filter(Boolean)
    .join(' ');
  const description = chalk.hex(colors.muted)(interactionText(PERMISSION_MODE_DESCRIPTION_KEYS[mode]));
  const heading = `${prefix} ${label}`;

  if (options.compact) {
    return [
      fitWithRightMeta(heading, status, options.width),
      truncateToWidth(`  ${description}`, options.width, ''),
    ];
  }
  return [fitWithRightMeta(`${heading}  ${description}`, status, options.width)];
}

function fitWithRightMeta(content: string, meta: string, width: number): string {
  if (!meta) return truncateToWidth(content, width, '');
  const gap = width - visibleWidth(content) - visibleWidth(meta);
  if (gap >= 2) return `${content}${' '.repeat(gap)}${meta}`;
  const contentWidth = Math.max(0, width - visibleWidth(meta) - 2);
  return `${truncateToWidth(content, contentWidth, '')}  ${meta}`;
}
