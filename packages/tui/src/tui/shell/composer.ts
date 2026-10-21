import type { Component } from '../rendering/component.js';
import type { Editor } from '../widgets/editor/editor.js';
import { sliceByColumn, stripAnsi, truncateToWidth, visibleWidth } from '../rendering/text.js';
import { renderTuiActionHint, tuiChalk as chalk, tuiColors as colors } from '../theme/runtime.js';
import { sanitizeTerminalText } from '../rendering/terminal-text.js';
import type { TuiComposerInputIntent } from '../commands/input-intent.js';
import type { TuiSurface } from './chat-layout.js';
import {
  formatTuiKeybinding,
  getDefaultTuiKeybindingRegistry,
  type TuiKeybindingRegistry,
} from './keybindings.js';
import { buildTuiTips, selectTuiTipAt, type TuiTip } from './tips.js';
import { shellText, type ShellCopyKey } from './copy.js';

export type TuiComposerMode = 'message' | 'goal' | 'working' | 'follow-up' | 'blocked';

export interface TuiComposerState {
  mode: TuiComposerMode;
  surface: TuiSurface;
  /** Contextual empty-editor placeholder, e.g. the BTW side prompt. */
  placeholder?: string;
  /** Stable mode label rendered below the editor, separate from the global status rail. */
  contextLabel?: string;
  hint?: string;
  /** Optional discovery content that joins the normal low-priority Tips rotation. */
  contextualTip?: TuiTip;
  /** Semantic emphasis for warnings and in-flight stop hints. */
  hintTone?: 'danger' | 'warning';
  attention?: 'permission' | 'question';
  attachmentCount?: number;
  draftCharacterCount?: number;
  draftLineCount?: number;
  inputIntent?: TuiComposerInputIntent;
  /** The activity line already states the draft label for this moment, so drop the header row. */
  headerHidden?: boolean;
}

export interface TuiComposerOptions {
  readonly imagePreview?: Component;
  readonly supportsShiftEnter?: () => boolean;
  readonly showTips?: boolean;
  readonly now?: () => number;
  readonly tips?: readonly TuiTip[];
  readonly keybindings?: TuiKeybindingRegistry;
}

export class TuiComposer implements Component {
  constructor(
    private readonly editor: Pick<Editor, 'render' | 'invalidate'>,
    private state: TuiComposerState,
    private readonly options: TuiComposerOptions = {},
  ) {}

  setState(state: TuiComposerState): void {
    this.state = state;
  }

  invalidate(): void {
    this.editor.invalidate();
    this.options.imagePreview?.invalidate();
  }

  render(width: number): string[] {
    const safeWidth = Number.isFinite(width) ? Math.max(0, Math.floor(width)) : 0;
    if (safeWidth === 0) return [];
    const placeholder =
      this.state.placeholder === undefined
        ? undefined
        : sanitizeTerminalText(this.state.placeholder);
    if (safeWidth <= 2) return [...this.editor.render(safeWidth, placeholder)];

    const innerWidth = safeWidth - 2;
    const body = this.editor.render(innerWidth, placeholder);
    const rendered = this.state.headerHidden
      ? []
      : [
          truncateToWidth(
            `${chalk.hex(colors.dim)('  ')}${renderComposerHeaderWithTip(
              this.state,
              innerWidth,
              this.options.supportsShiftEnter?.() === true,
              this.options.showTips !== false,
              this.options.now?.() ?? Date.now(),
              this.options.tips ?? buildTuiTips(),
              this.options.keybindings,
            )}`,
            safeWidth,
            chalk.hex(colors.dim)('…'),
          ),
        ];
    let renderedPrompt = false;
    let insideEditor = false;
    let highlightedToken = false;
    const renderedBody = body.map((line) => {
      const border = isEditorBorder(line);
      if (border) insideEditor = !insideEditor;
      let content = border
        ? chalk.hex(resolveTuiComposerBorderColor(this.state))(stripAnsi(line))
        : line;
      if (insideEditor && !border && !highlightedToken) {
        const decorated = highlightComposerInputToken(content, this.state);
        content = decorated.line;
        highlightedToken = decorated.highlighted;
      }
      const prefix = border
        ? chalk.hex(colors.dim)('  ')
        : !renderedPrompt
          ? chalk.bold.hex(resolveTuiComposerColor(this.state))('› ')
          : chalk.hex(colors.dim)('  ');
      if (!border) renderedPrompt = true;
      return truncateToWidth(`${prefix}${content}`, safeWidth, chalk.hex(colors.dim)('…'));
    });
    const contextLabel = this.state.contextLabel?.trim();
    return [
      ...(this.options.imagePreview?.render(safeWidth) ?? []),
      ...rendered,
      ...renderedBody,
      ...(contextLabel
        ? [
            truncateToWidth(
              `${chalk.hex(colors.dim)('  ')}${chalk.bold.hex(colors.signal)(
                sanitizeTerminalText(contextLabel),
              )}`,
              safeWidth,
              chalk.hex(colors.dim)('…'),
            ),
          ]
        : []),
    ];
  }
}

function renderComposerHeaderWithTip(
  state: TuiComposerState,
  width: number,
  supportsShiftEnter: boolean,
  showTips: boolean,
  nowMs: number,
  tips: readonly TuiTip[],
  keybindings: TuiKeybindingRegistry | undefined,
): string {
  const header = renderComposerHeader(state, width, supportsShiftEnter, keybindings);
  const availableTips = state.contextualTip ? [...tips, state.contextualTip] : tips;
  if (
    !showTips ||
    (state.surface !== 'conversation' && !state.contextualTip) ||
    state.mode !== 'message' ||
    state.hint?.trim() ||
    (state.attachmentCount ?? 0) > 0 ||
    (state.draftCharacterCount ?? 0) > 0
  ) {
    return header;
  }

  const tip = selectTuiTipAt(nowMs, availableTips);
  if (!tip) return header;

  for (const candidate of [tip.text, tip.shortText]) {
    const text = sanitizeTerminalText(candidate);
    const gap = width - visibleWidth(header) - visibleWidth(text);
    if (gap < 4) continue;
    return `${header}${' '.repeat(gap)}${chalk.hex(colors.muted)(text)}`;
  }
  return header;
}

function isEditorBorder(line: string): boolean {
  const plain = stripAnsi(line).trim();
  if (/^─+$/u.test(plain)) return true;
  if (/^─── [↑↓] \d+ more ─*$/u.test(plain)) return true;
  if (!plain.endsWith('...')) return false;
  const truncated = plain.slice(0, -3);
  return (
    /^─{0,3}$/u.test(truncated) ||
    /^─── ?$/u.test(truncated) ||
    /^─── [↑↓](?: \d+(?: m(?:o(?:r(?:e)?)?)?)?)? ?$/u.test(truncated)
  );
}

function renderComposerHeader(
  state: TuiComposerState,
  width: number,
  supportsShiftEnter: boolean,
  keybindings: TuiKeybindingRegistry | undefined,
): string {
  const labels = composerLabels(state, supportsShiftEnter, keybindings);
  const label = labels.find((candidate) => visibleWidth(candidate) <= width) ?? labels.at(-1) ?? '';
  const color = resolveTuiComposerColor(state);
  const [title = '', ...detailParts] = label.split(' · ');
  const detail = detailParts.join(' · ');
  const header = detail
    ? `${chalk.bold.hex(color)(title)}${chalk.hex(colors.dim)(' · ')}${renderTuiActionHint(detail)}`
    : chalk.bold.hex(color)(title);
  return header;
}

function composerLabels(
  state: TuiComposerState,
  supportsShiftEnter: boolean,
  keybindings: TuiKeybindingRegistry = getDefaultTuiKeybindingRegistry(),
): readonly string[] {
  const attachment = formatAttachmentCount(state.attachmentCount);
  const hint = state.hint?.trim();
  if (hint) return [sanitizeTerminalText(hint)];
  if (state.mode === 'blocked') {
    return state.attention === 'question'
      ? [shellText('composer.header.replyRequiredAnswer'), shellText('composer.header.replyRequired')]
      : [shellText('composer.header.replyRequiredAction'), shellText('composer.header.replyRequired')];
  }
  const submit = formatTuiKeybinding('tui.input.submit', keybindings);
  if (state.mode === 'goal') {
    if (attachment) {
      return [
        shellText('composer.label.goalWithAttachment', { attachment, submit }),
        shellText('composer.label.goalStart', { submit }),
        shellText('composer.header.goal'),
      ];
    }
    return [
      shellText('composer.label.goalStartEscCancel', { submit }),
      shellText('composer.label.goalStart', { submit }),
      shellText('composer.header.goal'),
    ];
  }
  const inputIntent = state.inputIntent;
  // Run controls (steer, interrupt) live on the activity line; this row only explains the draft.
  if (state.mode === 'follow-up') {
    const steer = formatTuiKeybinding('run.submit-guidance', keybindings);
    const queue = formatTuiKeybinding('run.queue-draft', keybindings);
    if (inputIntent && inputIntent.kind !== 'empty') {
      return composerInputIntentLabels(inputIntent, attachment, supportsShiftEnter, keybindings, {
        steer,
        queue,
      });
    }
    if (attachment) {
      return [
        shellText('composer.label.messageFollowUpAttachment', { attachment, steer, queue }),
        shellText('composer.label.messageFollowUp', { steer, queue }),
        shellText('composer.label.steerQueue', { steer, queue }),
        shellText('composer.label.queueOnly', { queue }),
        shellText('composer.header.message'),
      ];
    }
    return [
      shellText('composer.label.messageFollowUp', { steer, queue }),
      shellText('composer.label.steerQueue', { steer, queue }),
      shellText('composer.label.queueOnly', { queue }),
      shellText('composer.header.message'),
    ];
  }
  if (state.mode === 'working') {
    return [shellText('composer.header.working')];
  }
  const longDraft = (state.draftLineCount ?? 0) > 1 || (state.draftCharacterCount ?? 0) > 1_000;
  if (longDraft) {
    const edit = formatTuiKeybinding('composer.external-editor', keybindings);
    return [
      shellText('composer.label.longDraftEditSend', { edit, submit }),
      shellText('composer.label.longDraftEdit', { edit }),
      shellText('composer.header.longDraft'),
    ];
  }
  if (inputIntent && inputIntent.kind !== 'empty') {
    return composerInputIntentLabels(inputIntent, attachment, supportsShiftEnter, keybindings);
  }
  if (attachment) {
    return [
      shellText('composer.label.attachmentSend', { attachment, submit }),
      attachment,
      shellText('composer.header.message'),
    ];
  }
  if (state.surface === 'welcome') {
    return [shellText('composer.header.start'), shellText('composer.header.startBelow')];
  }
  const newline = composerNewlineKeybinding(supportsShiftEnter, keybindings);
  return [
    shellText('composer.label.messageSendNewline', { submit, newline }),
    shellText('composer.label.messageSend', { submit }),
    shellText('composer.header.message'),
  ];
}

function composerNewlineKeybinding(
  supportsShiftEnter: boolean,
  keybindings: TuiKeybindingRegistry,
): string {
  const keys = keybindings.keys('tui.input.newLine');
  if (keys.length === 2 && keys[0] === 'shift+enter' && keys[1] === 'ctrl+j') {
    return keybindings.format(supportsShiftEnter ? 'shift+enter' : 'ctrl+j');
  }
  return formatTuiKeybinding('tui.input.newLine', keybindings);
}

function composerInputIntentLabels(
  intent: TuiComposerInputIntent,
  attachment: string | undefined,
  supportsShiftEnter: boolean,
  keybindings: TuiKeybindingRegistry,
  followUp?: { readonly steer: string; readonly queue: string },
): readonly string[] {
  const intentKind = intent.kind;
  if (intentKind === 'empty') return [shellText('composer.header.message')];
  const presentation = COMPOSER_INPUT_INTENT_PRESENTATION[intentKind];
  const title = shellText(presentation.title);
  const detailedTitle = presentation.qualifier
    ? shellText('composer.label.intentWithQualifier', {
        title,
        qualifier: shellText(presentation.qualifier),
      })
    : title;
  const detailedSubject = attachment
    ? shellText('composer.label.intentWithAttachment', { title: detailedTitle, attachment })
    : detailedTitle;
  const compactSubject = attachment
    ? shellText('composer.label.intentWithAttachment', { title, attachment })
    : title;
  if (followUp && presentation.action !== 'run') {
    return [
      shellText('composer.label.intentFollowUp', {
        title: detailedSubject,
        steer: followUp.steer,
        queue: followUp.queue,
      }),
      shellText('composer.label.intentFollowUp', {
        title,
        steer: followUp.steer,
        queue: followUp.queue,
      }),
      shellText('composer.label.steerQueue', { steer: followUp.steer, queue: followUp.queue }),
      shellText('composer.label.queueOnly', { queue: followUp.queue }),
      title,
    ];
  }
  const submit = formatTuiKeybinding('tui.input.submit', keybindings);
  const action = shellText(COMPOSER_INPUT_INTENT_ACTION_KEYS[presentation.action]);
  if (presentation.action === 'send') {
    const newline = composerNewlineKeybinding(supportsShiftEnter, keybindings);
    return [
      shellText('composer.label.intentSendNewline', {
        title: detailedSubject,
        submit,
        action,
        newline,
      }),
      shellText('composer.label.intentAction', { title: compactSubject, submit, action }),
      title,
    ];
  }
  return [
    shellText('composer.label.intentAction', { title: detailedSubject, submit, action }),
    shellText('composer.label.intentAction', { title: compactSubject, submit, action }),
    title,
  ];
}

type NonEmptyTuiComposerInputIntentKind = Exclude<TuiComposerInputIntent['kind'], 'empty'>;

interface TuiComposerInputIntentPresentation {
  /** Catalog key for the intent title. */
  readonly title: ShellCopyKey;
  /** Catalog key for the qualifier shown after the title. */
  readonly qualifier?: ShellCopyKey;
  readonly action: 'send' | 'run' | 'invoke';
  readonly color: 'signal' | 'accent' | 'orbit' | 'warning';
}

/**
 * Input-intent presentation.
 *
 * `title` and `qualifier` hold catalog keys rather than rendered sentences, so
 * the table keeps its shape while the copy follows the active locale. The
 * `action` field stays the discriminator the label builder branches on.
 */
const COMPOSER_INPUT_INTENT_PRESENTATION: Readonly<
  Record<NonEmptyTuiComposerInputIntentKind, TuiComposerInputIntentPresentation>
> = {
  prompt: { title: 'composer.intent.prompt', action: 'send', color: 'signal' },
  bash: { title: 'composer.intent.shell', action: 'run', color: 'warning' },
  command: { title: 'composer.intent.command', action: 'run', color: 'accent' },
  'command-arguments': {
    title: 'composer.intent.command',
    qualifier: 'composer.intent.arguments',
    action: 'run',
    color: 'accent',
  },
  skill: { title: 'composer.intent.skill', action: 'invoke', color: 'orbit' },
  'skill-instructions': {
    title: 'composer.intent.skill',
    qualifier: 'composer.intent.instructions',
    action: 'invoke',
    color: 'orbit',
  },
};

/** Catalog key for the action word shown next to the submit shortcut. */
const COMPOSER_INPUT_INTENT_ACTION_KEYS: Readonly<
  Record<'send' | 'run' | 'invoke', ShellCopyKey>
> = {
  send: 'composer.action.send',
  run: 'composer.action.run',
  invoke: 'composer.action.invoke',
};

function formatAttachmentCount(count: number | undefined): string | undefined {
  if (!count) return undefined;
  return shellText(count === 1 ? 'composer.attachment.one' : 'composer.attachment.many', { count });
}

export function resolveTuiComposerColor(state: TuiComposerState): string {
  if (state.hintTone === 'danger') return colors.error;
  if (state.hintTone === 'warning') return colors.warning;
  if (state.mode === 'blocked' && state.attention === 'permission') return colors.warning;
  if (state.mode === 'goal') return colors.orbit;
  const inputIntent = state.inputIntent;
  if (inputIntent && inputIntent.kind !== 'empty') {
    return colors[COMPOSER_INPUT_INTENT_PRESENTATION[inputIntent.kind].color];
  }
  return colors.signal;
}

export function resolveTuiComposerBorderColor(state: TuiComposerState): string {
  if (state.inputIntent?.kind === 'empty' || !state.inputIntent) return colors.line;
  return resolveTuiComposerColor(state);
}

function highlightComposerInputToken(
  line: string,
  state: TuiComposerState,
): { readonly line: string; readonly highlighted: boolean } {
  const token = state.inputIntent?.token;
  if (!token) return { line, highlighted: false };
  const plain = stripAnsi(line);
  const tokenIndex = plain.indexOf(token);
  if (tokenIndex < 0) return { line, highlighted: false };
  const start = visibleWidth(plain.slice(0, tokenIndex));
  const tokenWidth = visibleWidth(token);
  const width = visibleWidth(line);
  const before = sliceByColumn(line, 0, start, true);
  const highlighted = sliceByColumn(line, start, tokenWidth, true);
  const after = sliceByColumn(
    line,
    start + tokenWidth,
    Math.max(0, width - start - tokenWidth),
    true,
  );
  return {
    line: `${before}${chalk.bold.hex(resolveTuiComposerColor(state))(highlighted)}${after}`,
    highlighted: true,
  };
}
