import { shellText, type ShellCopyKey } from './copy.js';

export interface TuiTip {
  readonly id: string;
  readonly command: string;
  readonly text: string;
  readonly shortText: string;
  readonly weight?: number;
}

interface TuiTipDefinition {
  readonly id: string;
  readonly command: string;
  readonly textKey: ShellCopyKey;
  readonly shortTextKey: ShellCopyKey;
  readonly weight?: number;
}

/**
 * Rotating Composer tips.
 *
 * The wording is catalogued, so a definition holds the catalog key rather than
 * the rendered sentence. `buildTuiTips()` resolves the keys, which means the
 * Composer renders the tip in the language that is active when it draws.
 */
const TUI_TIP_DEFINITIONS: readonly TuiTipDefinition[] = [
  {
    id: 'goal',
    command: 'goal',
    textKey: 'tip.goal.text',
    shortTextKey: 'tip.goal.short',
    weight: 2,
  },
  {
    id: 'context',
    command: 'context',
    textKey: 'tip.context.text',
    shortTextKey: 'tip.context.short',
    weight: 2,
  },
  {
    id: 'steer',
    command: 'steer',
    textKey: 'tip.steer.text',
    shortTextKey: 'tip.steer.short',
    weight: 2,
  },
  {
    id: 'plugins',
    command: 'plugins',
    textKey: 'tip.plugins.text',
    shortTextKey: 'tip.plugins.short',
    weight: 2,
  },
  {
    id: 'sessions',
    command: 'sessions',
    textKey: 'tip.sessions.text',
    shortTextKey: 'tip.sessions.short',
  },
  {
    id: 'fork',
    command: 'fork',
    textKey: 'tip.fork.text',
    shortTextKey: 'tip.fork.short',
  },
  {
    id: 'rewind',
    command: 'rewind',
    textKey: 'tip.rewind.text',
    shortTextKey: 'tip.rewind.short',
  },
  {
    id: 'compact',
    command: 'compact',
    textKey: 'tip.compact.text',
    shortTextKey: 'tip.compact.short',
  },
  {
    id: 'skills',
    command: 'skills',
    textKey: 'tip.skills.text',
    shortTextKey: 'tip.skills.short',
  },
  {
    id: 'feedback',
    command: 'feedback',
    textKey: 'tip.feedback.text',
    shortTextKey: 'tip.feedback.short',
  },
];

/** Build the tips in the language that is active right now. */
export function buildTuiTips(): readonly TuiTip[] {
  return TUI_TIP_DEFINITIONS.map((tip) => ({
    id: tip.id,
    command: tip.command,
    text: shellText(tip.textKey),
    shortText: shellText(tip.shortTextKey),
    ...(tip.weight === undefined ? {} : { weight: tip.weight }),
  }));
}

export const TUI_TIPS = buildTuiTips();

export const TUI_TIP_ROTATION_INTERVAL_MS = 30_000;

/** Build a deterministic smooth weighted round-robin sequence. */
export function buildWeightedTuiTipRotation(tips: readonly TuiTip[]): readonly TuiTip[] {
  const items = tips.map((tip) => ({
    tip,
    weight: Math.max(1, Math.trunc(tip.weight ?? 1)),
    current: 0,
  }));
  const totalWeight = items.reduce((total, item) => total + item.weight, 0);
  const rotation: TuiTip[] = [];

  for (let index = 0; index < totalWeight; index += 1) {
    let selected = items[0];
    for (const item of items) {
      item.current += item.weight;
      if (!selected || item.current > selected.current) selected = item;
    }
    if (!selected) break;
    selected.current -= totalWeight;
    rotation.push(selected.tip);
  }

  return rotation;
}

const DEFAULT_TUI_TIP_ROTATION = buildWeightedTuiTipRotation(TUI_TIPS);

export function selectTuiTipAt(
  nowMs: number,
  tips: readonly TuiTip[] = TUI_TIPS,
): TuiTip | undefined {
  const rotation = tips === TUI_TIPS ? DEFAULT_TUI_TIP_ROTATION : buildWeightedTuiTipRotation(tips);
  if (rotation.length === 0) return undefined;

  const bucket = Math.floor(nowMs / TUI_TIP_ROTATION_INTERVAL_MS);
  const index = ((bucket % rotation.length) + rotation.length) % rotation.length;
  return rotation[index];
}
