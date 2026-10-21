import type { Component } from '../../rendering/component.js';
import { tuiChalk as chalk, tuiColors as colors } from '../../theme/runtime.js';
import type { TuiShellState } from '../contracts.js';
import {
  fitLine,
  normalizeWidth,
  renderFrameBottom,
  renderFrameDivider,
  renderFrameHeader,
  renderFrameRow,
} from '../frame.js';
import { resolveTuiLayoutPolicy } from '../layout-policy.js';
import { formatTuiKeybinding, type TuiKeybindingRegistry } from '../keybindings.js';
import { shellText } from '../copy.js';
import {
  MINIMAX_CODE_WELCOME_DESIGN,
  MINIMAX_CODE_WELCOME_PASTE_IMAGE_SHORTCUT,
} from './design.js';
import { renderTuiWelcomeHero } from './hero.js';

export interface TuiWelcomeContent {
  readonly tips?: readonly string[];
  readonly changelogEntries?: readonly string[];
}

export class TuiWelcome implements Component {
  constructor(
    private state: TuiShellState,
    private readonly keybindings?: TuiKeybindingRegistry,
    private readonly content: TuiWelcomeContent = {},
  ) {}

  setState(state: TuiShellState): void {
    this.state = state;
  }

  invalidate(): void {}

  render(width: number): string[] {
    return this.renderViewport(width, Number.POSITIVE_INFINITY);
  }

  renderViewport(width: number, height: number): string[] {
    return this.renderFrame(width, height, false);
  }

  /**
   * Static banner above a conversation. In regular mode it becomes native
   * scrollback, so it omits live account and runtime status; the conversation
   * footer shows those through renderPreludeNotice().
   */
  renderPrelude(width: number): string[] {
    return this.renderFrame(width, Number.POSITIVE_INFINITY, true);
  }

  /** Live account notice for the conversation footer; empty when nothing needs action. */
  renderPreludeNotice(width: number): string[] {
    const safeWidth = normalizeWidth(width);
    const message = resolveWelcomeAccountNotice(this.state);
    if (!message || safeWidth === 0) return [];
    return [fitLine(`  ${renderWelcomeAccountNotice(message)}`, safeWidth)];
  }

  private renderFrame(width: number, height: number, staticBanner: boolean): string[] {
    const safeWidth = normalizeWidth(width);
    if (safeWidth === 0) return [];
    if (safeWidth < 4) return [fitLine('M', safeWidth)];

    const policy = resolveTuiLayoutPolicy(safeWidth);
    const options = { keybindings: this.keybindings, content: this.content, staticBanner };
    let frame =
      policy.welcome === 'compact'
        ? renderCompactWelcome(this.state, safeWidth, options)
        : policy.welcome === 'stacked'
          ? renderStackedWelcome(this.state, safeWidth, options)
          : renderWideWelcome(this.state, safeWidth, options);
    if (frame.length + 2 > height && policy.welcome !== 'compact') {
      frame = renderCompactWelcome(this.state, safeWidth, options);
    }
    return fitWelcomeHeight(['', ...frame, ''], height);
  }
}

interface WelcomeRenderOptions {
  readonly keybindings: TuiKeybindingRegistry | undefined;
  readonly content?: TuiWelcomeContent;
  readonly staticBanner: boolean;
}

function fitWelcomeHeight(lines: string[], height: number): string[] {
  if (!Number.isFinite(height)) return lines;
  const maxRows = Math.max(1, Math.floor(height));
  const fitted = [...lines];
  while (fitted.length > maxRows) {
    const blankIndex = fitted.findIndex((line) => line.length === 0);
    if (blankIndex < 0) break;
    fitted.splice(blankIndex, 1);
  }
  return fitted.slice(0, maxRows);
}

function renderWideWelcome(
  state: TuiShellState,
  width: number,
  { keybindings, content, staticBanner }: WelcomeRenderOptions,
): string[] {
  const tips = resolveWelcomeItems(content?.tips, MINIMAX_CODE_WELCOME_DESIGN.wide.tips, 3);
  const news = resolveWelcomeItems(
    content?.changelogEntries,
    MINIMAX_CODE_WELCOME_DESIGN.wide.news,
    3,
  );
  return [
    ...renderTuiWelcomeHero(width),
    '',
    renderWelcomeHeader(state, width, staticBanner),
    ...(staticBanner ? [] : renderWelcomeAccountNoticeRows(state, width)),
    renderFrameRow(renderSectionTitle(MINIMAX_CODE_WELCOME_DESIGN.sectionTitles.tips), width),
    ...tips.map((text) =>
      renderFrameRow(renderWelcomeBullet(resolveWelcomeCopy(text, keybindings)), width),
    ),
    renderFrameDivider(width),
    renderFrameRow(renderSectionTitle(MINIMAX_CODE_WELCOME_DESIGN.sectionTitles.news), width),
    ...news.map((text) =>
      renderFrameRow(renderWelcomeBullet(resolveWelcomeCopy(text, keybindings)), width),
    ),
    renderFrameBottom(width),
  ];
}

function renderStackedWelcome(
  state: TuiShellState,
  width: number,
  { keybindings, content, staticBanner }: WelcomeRenderOptions,
): string[] {
  const tips = resolveWelcomeItems(content?.tips, MINIMAX_CODE_WELCOME_DESIGN.stacked.tips, 2);
  const news = resolveWelcomeItems(
    content?.changelogEntries,
    MINIMAX_CODE_WELCOME_DESIGN.stacked.news,
    3,
  );
  return [
    ...renderTuiWelcomeHero(width),
    '',
    renderWelcomeHeader(state, width, staticBanner),
    ...(staticBanner ? [] : renderWelcomeAccountNoticeRows(state, width)),
    renderFrameDivider(width),
    renderFrameRow(renderSectionTitle(MINIMAX_CODE_WELCOME_DESIGN.sectionTitles.tips), width),
    ...tips.map((text) =>
      renderFrameRow(renderWelcomeBullet(resolveWelcomeCopy(text, keybindings)), width),
    ),
    renderFrameRow('', width),
    renderFrameRow(renderSectionTitle(MINIMAX_CODE_WELCOME_DESIGN.sectionTitles.news), width),
    ...news.map((text) =>
      renderFrameRow(renderWelcomeBullet(resolveWelcomeCopy(text, keybindings)), width),
    ),
    renderFrameRow('', width),
    renderFrameBottom(width),
  ];
}

function renderCompactWelcome(
  state: TuiShellState,
  width: number,
  { keybindings, content, staticBanner }: WelcomeRenderOptions,
): string[] {
  const tips = resolveWelcomeItems(content?.tips, MINIMAX_CODE_WELCOME_DESIGN.compact.tips, 2);
  const news = resolveWelcomeItems(
    content?.changelogEntries,
    MINIMAX_CODE_WELCOME_DESIGN.compact.news,
    3,
  );
  return [
    ...renderTuiWelcomeHero(width),
    '',
    renderFrameHeader(
      `${chalk.bold.hex(colors.brand)('MCode')} ${chalk.hex(colors.muted)(`v${state.version}`)}`,
      staticBanner ? '' : renderActivity(state),
      width,
    ),
    ...(staticBanner ? [] : renderWelcomeAccountNoticeRows(state, width)),
    renderFrameRow(renderSectionTitle(shellText('welcome.section.tipsShort')), width),
    ...tips.map((text) =>
      renderFrameRow(chalk.hex(colors.muted)(resolveWelcomeCopy(text, keybindings)), width),
    ),
    renderFrameRow(renderSectionTitle(MINIMAX_CODE_WELCOME_DESIGN.sectionTitles.news), width),
    ...news.map((text) => renderFrameRow(chalk.hex(colors.muted)(text), width)),
    renderFrameBottom(width),
  ];
}

function renderWelcomeHeader(state: TuiShellState, width: number, staticBanner: boolean): string {
  return renderFrameHeader(
    chalk.hex(colors.muted)(`v${state.version}`),
    staticBanner ? '' : renderActivity(state),
    width,
  );
}

function resolveWelcomeItems(
  selected: readonly string[] | undefined,
  fallback: readonly string[],
  count: number,
): readonly string[] {
  return selected?.length ? selected.slice(0, count) : fallback;
}

function renderSectionTitle(title: string): string {
  return chalk.bold.hex(colors.brand)(title);
}

function renderWelcomeBullet(text: string): string {
  return `${chalk.bold.hex(colors.orbit)('›')} ${chalk.hex(colors.text)(text)}`;
}

function resolveWelcomeCopy(value: string, keybindings: TuiKeybindingRegistry | undefined): string {
  return value.replaceAll(
    MINIMAX_CODE_WELCOME_PASTE_IMAGE_SHORTCUT,
    formatTuiKeybinding('composer.paste-image', keybindings),
  );
}

function resolveWelcomeAccountNotice(state: TuiShellState): string | undefined {
  // The comparison below stays against the state token the projection produces;
  // only the rendered text comes from the catalog, so Chinese no longer shows the
  // raw English token in the notice line.
  return state.accountStatus === 'Sign in with /login'
    ? shellText('welcome.notice.loginRequired')
    : state.accountStatus === 'Connected with warnings'
      ? shellText('welcome.notice.providerOrStatus')
      : state.accountStatus === 'Account unavailable'
        ? shellText('welcome.notice.status')
        : undefined;
}

function renderWelcomeAccountNotice(message: string): string {
  return `${chalk.bold.hex(colors.warning)('○')} ${chalk.bold.hex(colors.warning)(message)}`;
}

function renderWelcomeAccountNoticeRows(state: TuiShellState, width: number): string[] {
  const message = resolveWelcomeAccountNotice(state);
  if (!message) return [];
  return [renderFrameRow(renderWelcomeAccountNotice(message), width)];
}

function renderActivity(state: TuiShellState): string {
  if (state.accountStatus === 'Sign in with /login') {
    return chalk.bold.hex(colors.warning)(`○ ${shellText('welcome.status.loginRequired')}`);
  }
  if (state.runtimeStatus === 'error') {
    return chalk.bold.hex(colors.error)(`× ${shellText('welcome.status.error')}`);
  }
  if (state.accountStatus === 'Checking account') {
    return chalk.bold.hex(colors.signal)(`◌ ${shellText('welcome.status.checkingAccount')}`);
  }
  if (state.accountStatus === 'Connected with warnings') {
    return chalk.bold.hex(colors.warning)(`○ ${shellText('welcome.status.setupWarning')}`);
  }
  if (state.accountStatus === 'Account unavailable') {
    return chalk.bold.hex(colors.warning)(`○ ${shellText('welcome.status.accountUnavailable')}`);
  }
  if (state.runtimeStatus === 'ready') {
    return chalk.bold.hex(colors.orbit)(`● ${shellText('welcome.status.ready')}`);
  }
  if (state.runtimeStatus === 'starting') {
    return chalk.bold.hex(colors.signal)(`◌ ${shellText('welcome.status.starting')}`);
  }
  if (state.runtimeStatus === 'offline') {
    return chalk.bold.hex(colors.warning)(`○ ${shellText('welcome.status.offline')}`);
  }
  return chalk.bold.hex(colors.error)(`× ${shellText('welcome.status.error')}`);
}
