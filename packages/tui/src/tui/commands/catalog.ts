import type { SlashCommand } from '../widgets/autocomplete.js';
import { fuzzyFilter } from '../engine/public.js';
import { TuiContributionRegistry } from '../../contributions/index.js';
import { TUI_COMMAND_DESCRIPTORS } from '../../application/command-descriptors.js';
import { sessionHistoryText, sessionMutationText } from '../features/session-mutation/copy.js';
import { controllerText, type ControllerCopyKey } from '../controller/copy.js';

export type TuiCommandCategory =
  | 'Session'
  | 'Runtime'
  | 'Capability'
  | 'Input'
  | 'Transcript'
  | 'Decision'
  | 'Application';

export type TuiCommandAudience = 'user' | 'internal';
export type TuiCommandDiscoverability = 'primary' | 'contextual' | 'search-only';
export type TuiCommandReadiness = 'immediate' | 'controller' | 'full';

export interface TuiCommandContext {
  readonly hasSession: boolean;
  readonly hasParentSession: boolean;
  readonly managedTokenPresent: boolean;
  readonly queueEnabled: boolean;
  readonly hasLiveRun: boolean;
  readonly hasPendingInteraction?: boolean;
  readonly queuedCount: number;
  readonly canRetry: boolean;
  /** True when the paired temporary BTW side projection is visible. */
  readonly sideMode?: boolean;
}

/**
 * Side mode follows Codex's read-only command surface. Navigation, mutation,
 * auth, and process controls stay unavailable even when typed directly.
 * `/parent` stays available as the explicit "switch back to the main
 * conversation" command; it mirrors the Ctrl+/ toggle, not a close.
 * `/retry` stays available because it only resends the side Session's own
 * failed message, and a failed side response tells the user to run it.
 * `/doctor` and `/feedback` stay available so a failed side response can be
 * diagnosed and reported where it happened; neither mutates either Session.
 */
export const SIDE_MODE_COMMANDS = new Set([
  'help',
  'changelog',
  'context',
  'status',
  'usage',
  'export',
  'transcript',
  'copy',
  'parent',
  'retry',
  'doctor',
  'feedback',
]);

export interface TuiCommand {
  name: string;
  aliases?: readonly string[];
  description: string;
  category: TuiCommandCategory;
  /** Localized category label derived from `category` when the source omits it. */
  categoryLabel?: string;
  /** Runtime-provided Skill invocations carry Agent instructions after their slash token. */
  invocationKind?: 'skill';
  /**
   * Internal controls stay reserved for parser compatibility and
   * keyboard/interaction fallbacks, but never appear in slash discovery.
   * A reserved command without a handler is treated as unrecognized.
   */
  audience?: TuiCommandAudience;
  discoverability?: TuiCommandDiscoverability;
  readiness?: TuiCommandReadiness;
  /** Commands that replace or mutate the active Session are unavailable while a Turn is live. */
  runAvailability?: 'idle';
  preparingHint?: string;
  visibleWhen?: (context: TuiCommandContext) => boolean;
  /** Commands handled before catalog dispatch can still advertise live Composer intent. */
  inputWhen?: (context: TuiCommandContext) => boolean;
  unavailableReason?: string;
  /**
   * Syntax shown after the command name. Its presence also declares that the
   * command accepts non-whitespace text after its token; commands without a
   * hint are exact-token commands.
   */
  argumentHint?: string;
  /** Pi-compatible argument candidates, resolved when the Composer queries this command. */
  getArgumentCompletions?: SlashCommand['getArgumentCompletions'];
  shortcut?: string;
  usage: string;
  composerTemplate: string;
}

export type TuiCommandSource = Omit<TuiCommand, 'usage' | 'composerTemplate'>;

export interface TuiCommandInvocation {
  raw: string;
  name: string;
  args: string;
}

export interface TuiCommandInputDescriptor {
  readonly name: string;
  readonly aliases?: readonly string[];
  readonly argumentHint?: string;
}

export interface TuiCommandInputMatch<TCommand extends TuiCommandInputDescriptor> {
  readonly source: TCommand;
  readonly raw: string;
  readonly token: string;
  readonly args: string;
}

export type TuiCommandExecutionDisposition = 'consumed' | 'retained';

export type TuiCommandHandler = (
  invocation: TuiCommandInvocation,
) => void | TuiCommandExecutionDisposition | Promise<void | TuiCommandExecutionDisposition>;

export interface TuiCommandContribution {
  readonly id: string;
  readonly order?: number;
  readonly kind?: 'command' | 'active-run';
  readonly source: TuiCommandSource;
  readonly execute?: TuiCommandHandler;
}

// Command metadata follows the active interface language. The shared
// descriptors in `packages/tui/src/application/command-descriptors.ts` stay
// English: they are also rendered outside this interface.
const COMMAND_SOURCES: readonly TuiCommandSource[] = [
  {
    ...TUI_COMMAND_DESCRIPTORS.help,
    category: 'Application',
    readiness: 'immediate',
  },
  {
    ...TUI_COMMAND_DESCRIPTORS.new,
    aliases: ['clear'],
    category: 'Session',
    runAvailability: 'idle',
  },
  {
    name: 'update',
    description: controllerText('command.description.update'),
    category: 'Application',
    discoverability: 'search-only',
  },
  {
    name: 'changelog',
    description: controllerText('command.description.changelog'),
    category: 'Application',
  },
  {
    name: 'sessions',
    aliases: ['resume'],
    description: controllerText('command.description.sessions'),
    category: 'Session',
    argumentHint: '[query]',
    runAvailability: 'idle',
  },
  {
    name: 'goal',
    description: controllerText('command.description.goal'),
    category: 'Session',
    argumentHint: '<objective | action>',
    getArgumentCompletions: argumentCompleter([
      ['pause', controllerText('command.argument.goal.pause')],
      ['resume', controllerText('command.argument.goal.resume')],
      ['edit', controllerText('command.argument.goal.edit')],
      ['clear', controllerText('command.argument.goal.clear')],
      ['help', controllerText('command.argument.goal.help')],
      ['budget=', controllerText('command.argument.goal.budget')],
      ['budget=clear', controllerText('command.argument.goal.budgetClear')],
    ]),
  },
  {
    name: 'plan',
    description: controllerText('command.description.plan'),
    category: 'Session',
    argumentHint: '[on | off | status | view]',
    getArgumentCompletions: argumentCompleter([
      ['on', controllerText('command.argument.plan.on')],
      ['off', controllerText('command.argument.plan.off')],
      ['status', controllerText('command.argument.plan.status')],
      ['view', controllerText('command.argument.plan.view')],
    ]),
    shortcut: 'Shift+Tab',
  },
  {
    name: 'review',
    description: controllerText('command.description.review'),
    category: 'Capability',
  },
  {
    name: 'parent',
    description: controllerText('command.description.parent'),
    category: 'Session',
    discoverability: 'contextual',
    // SessionFlow keeps ordinary parent navigation idle-only, while a BTW
    // side Session may stop its own foreground Turn and return at any time.
    visibleWhen: (context) => context.hasParentSession,
    unavailableReason: controllerText('command.unavailable.noParent'),
  },
  {
    name: 'btw',
    aliases: ['side'],
    description: controllerText('command.description.btw'),
    category: 'Session',
    discoverability: 'contextual',
    // Deliberately not `runAvailability: 'idle'`. Asking a side question while
    // the main task runs is the primary use case, and a catalog command is
    // excluded from steer/queue staging, so `/btw ...` cannot be sent to the
    // running Turn by mistake.
    argumentHint: '[question]',
    visibleWhen: (context) => context.hasSession,
    unavailableReason: controllerText('command.unavailable.sideNeedsSession'),
  },
  {
    name: 'history',
    description: sessionHistoryText('commandDescription'),
    category: 'Session',
    discoverability: 'contextual',
    visibleWhen: (context) => context.hasSession,
    unavailableReason: sessionHistoryText('commandUnavailable'),
  },
  {
    name: 'fork',
    description: sessionMutationText('sessionMutation.command.fork.description'),
    category: 'Session',
    discoverability: 'contextual',
    runAvailability: 'idle',
    visibleWhen: (context) => context.hasSession,
    unavailableReason: sessionMutationText('sessionMutation.command.fork.unavailable'),
  },
  {
    name: 'rewind',
    description: sessionMutationText('sessionMutation.command.rewind.description'),
    category: 'Session',
    discoverability: 'contextual',
    runAvailability: 'idle',
    visibleWhen: (context) => context.hasSession,
    unavailableReason: sessionMutationText('sessionMutation.command.rewind.unavailable'),
  },
  {
    name: 'edit',
    description: sessionMutationText('sessionMutation.command.edit.description'),
    category: 'Session',
    discoverability: 'contextual',
    runAvailability: 'idle',
    visibleWhen: (context) => context.hasSession,
    unavailableReason: sessionMutationText('sessionMutation.command.edit.unavailable'),
  },
  {
    name: 'retry',
    description: controllerText('command.description.retry'),
    category: 'Session',
    discoverability: 'contextual',
    // A response that is still running (for example a hung provider request)
    // has not failed yet: tell the user to stop it rather than claiming there
    // is nothing to retry (#425).
    runAvailability: 'idle',
    visibleWhen: (context) => context.canRetry && !context.hasLiveRun,
    unavailableReason: controllerText('command.unavailable.nothingToRetry'),
  },
  {
    name: 'rename',
    description: controllerText('command.description.rename'),
    category: 'Session',
    discoverability: 'contextual',
    visibleWhen: (context) => context.hasSession,
    unavailableReason: controllerText('command.unavailable.renameNeedsSession'),
    argumentHint: '[title]',
    runAvailability: 'idle',
  },
  {
    name: 'archive',
    description: controllerText('command.description.archive'),
    category: 'Session',
    audience: 'internal',
  },
  {
    ...TUI_COMMAND_DESCRIPTORS.compact,
    category: 'Session',
    argumentHint: '[instructions]',
    discoverability: 'contextual',
    runAvailability: 'idle',
    visibleWhen: (context) => context.hasSession,
    unavailableReason: controllerText('command.unavailable.compactNeedsSession'),
  },
  {
    ...TUI_COMMAND_DESCRIPTORS.status,
    category: 'Runtime',
    readiness: 'controller',
    preparingHint: controllerText('command.preparing.accountStatus'),
  },
  {
    name: 'tasks',
    description: controllerText('command.description.tasks'),
    category: 'Runtime',
    discoverability: 'contextual',
    visibleWhen: (context) => context.hasSession,
    unavailableReason: controllerText('command.unavailable.tasksNeedsSession'),
  },
  {
    name: 'permission',
    description: controllerText('command.description.permission'),
    category: 'Runtime',
    argumentHint: '[status | ask | auto | full]',
    getArgumentCompletions: argumentCompleter([
      ['status', controllerText('command.argument.permission.status')],
      ['ask', controllerText('command.argument.permission.ask')],
      ['auto', controllerText('command.argument.permission.auto')],
      ['full', controllerText('command.argument.permission.full')],
    ]),
    shortcut: 'Alt+M',
  },
  {
    name: 'login',
    description: controllerText('command.description.login'),
    category: 'Runtime',
    discoverability: 'contextual',
    visibleWhen: (context) => !context.managedTokenPresent,
  },
  {
    name: 'logout',
    description: controllerText('command.description.logout'),
    category: 'Runtime',
    discoverability: 'contextual',
    visibleWhen: (context) => context.managedTokenPresent,
    unavailableReason: controllerText('command.unavailable.noManagedAccount'),
  },
  {
    ...TUI_COMMAND_DESCRIPTORS.doctor,
    category: 'Runtime',
    discoverability: 'search-only',
    readiness: 'immediate',
    preparingHint: controllerText('command.preparing.configurationCheck'),
  },
  {
    name: 'config',
    description: controllerText('command.description.config'),
    category: 'Runtime',
    audience: 'internal',
  },
  {
    ...TUI_COMMAND_DESCRIPTORS.context,
    category: 'Runtime',
    discoverability: 'contextual',
    visibleWhen: (context) => context.hasSession,
    unavailableReason: controllerText('command.unavailable.contextNeedsSession'),
  },
  {
    name: 'steer',
    description: controllerText('command.description.steer'),
    category: 'Runtime',
    argumentHint: '<message>',
  },
  {
    name: 'feedback',
    description: controllerText('command.description.feedback'),
    category: 'Application',
    argumentHint: '<message>',
    discoverability: 'search-only',
  },
  {
    name: 'checkin',
    description: controllerText('command.description.checkin'),
    category: 'Application',
    readiness: 'controller',
    preparingHint: controllerText('command.preparing.dailyReward'),
  },
  {
    name: 'settings',
    description: controllerText('command.description.settings'),
    category: 'Application',
  },
  {
    name: 'statusline',
    description: controllerText('command.description.statusline'),
    category: 'Application',
    readiness: 'immediate',
    visibleWhen: (context) => !context.hasPendingInteraction,
    unavailableReason: controllerText('command.unavailable.statusLineNeedsInteraction'),
  },
  {
    name: 'theme',
    description: controllerText('command.description.theme'),
    category: 'Application',
    // Reachable by typing, but kept out of the default slash list: theme
    // selection is a preference, not a primary verb.
    discoverability: 'search-only',
    readiness: 'immediate',
  },
  {
    name: 'hotkeys',
    description: controllerText('command.description.hotkeys'),
    category: 'Application',
    runAvailability: 'idle',
    unavailableReason: controllerText('command.unavailable.hotkeysNeedsIdle'),
  },
  {
    name: 'reload',
    description: controllerText('command.description.reload'),
    category: 'Application',
    runAvailability: 'idle',
    unavailableReason: controllerText('command.unavailable.reloadNeedsIdle'),
  },
  {
    ...TUI_COMMAND_DESCRIPTORS.model,
    category: 'Runtime',
    argumentHint: '[filter]',
  },
  {
    name: 'provider',
    description: controllerText('command.description.provider'),
    category: 'Runtime',
  },
  {
    name: 'plugins',
    description: controllerText('command.description.plugins'),
    category: 'Capability',
    argumentHint: '[filter]',
  },
  {
    ...TUI_COMMAND_DESCRIPTORS.skills,
    category: 'Capability',
    argumentHint: '[filter]',
    discoverability: 'search-only',
  },
  {
    ...TUI_COMMAND_DESCRIPTORS.mcp,
    category: 'Capability',
    argumentHint: '[filter|reload]',
    discoverability: 'search-only',
  },
  {
    name: 'add-dir',
    description: controllerText('command.description.addDir'),
    category: 'Input',
    argumentHint: '<path>',
    discoverability: 'search-only',
  },
  {
    name: 'decision',
    description: controllerText('command.description.decision'),
    category: 'Decision',
    audience: 'internal',
  },
  {
    ...TUI_COMMAND_DESCRIPTORS.usage,
    category: 'Transcript',
    discoverability: 'contextual',
  },
  {
    ...TUI_COMMAND_DESCRIPTORS.export,
    category: 'Transcript',
    argumentHint: '[path.md]',
    discoverability: 'contextual',
    visibleWhen: (context) => context.hasSession,
    unavailableReason: controllerText('command.unavailable.exportNeedsSession'),
  },
  {
    name: 'transcript',
    description: controllerText('command.description.transcript'),
    category: 'Transcript',
    discoverability: 'contextual',
    visibleWhen: (context) => context.hasSession,
    unavailableReason: controllerText('command.unavailable.transcriptNeedsSession'),
  },
  {
    name: 'copy',
    description: controllerText('command.description.copy'),
    category: 'Transcript',
    discoverability: 'contextual',
    visibleWhen: (context) => context.hasSession,
    unavailableReason: controllerText('command.unavailable.copyNeedsSession'),
  },
  {
    name: 'allow',
    description: controllerText('command.description.allow'),
    category: 'Decision',
    audience: 'internal',
    inputWhen: (context) => context.hasPendingInteraction === true,
  },
  {
    name: 'always',
    description: controllerText('command.description.always'),
    category: 'Decision',
    audience: 'internal',
    inputWhen: (context) => context.hasPendingInteraction === true,
  },
  {
    name: 'deny',
    description: controllerText('command.description.deny'),
    category: 'Decision',
    audience: 'internal',
    inputWhen: (context) => context.hasPendingInteraction === true,
  },
  {
    name: 'permissions',
    description: controllerText('command.description.permissions'),
    category: 'Decision',
    audience: 'internal',
  },
  {
    name: 'stop',
    description: controllerText('command.description.stop'),
    category: 'Application',
    audience: 'internal',
    readiness: 'immediate',
  },
  {
    name: 'queue',
    description: controllerText('command.description.queue'),
    category: 'Input',
    discoverability: 'contextual',
    visibleWhen: (context) =>
      context.queueEnabled && (context.hasLiveRun || context.queuedCount > 0),
    unavailableReason: controllerText('command.unavailable.queueEmpty'),
  },
  {
    name: 'quit',
    aliases: ['exit'],
    description: controllerText('command.description.quit'),
    category: 'Application',
    readiness: 'immediate',
  },
];

const ACTIVE_RUN_COMMAND_SOURCES: readonly TuiCommandSource[] = [];

export interface TuiCommandCatalog {
  readonly commands: readonly TuiCommand[];
  /** Commands whose local handler will run when the exact input is submitted. */
  readonly inputCommands: readonly TuiCommand[];
  readonly activeRunCommands: readonly TuiCommand[];
  readonly discoverableCommands: readonly TuiCommand[];
  readonly searchableCommands: readonly TuiCommand[];
  readonly slashCommands: readonly SlashCommand[];
  resolve(input: string): TuiCommand | undefined;
  dispatch(input: string): Promise<TuiCommandDispatchResult>;
}

export type TuiCommandDispatchResult =
  | { readonly status: 'unrecognized' }
  | { readonly status: 'unavailable'; readonly reason: string }
  | {
      readonly status: 'handled';
      readonly disposition?: TuiCommandExecutionDisposition;
    };

const EMPTY_COMMAND_CONTEXT: TuiCommandContext = {
  hasSession: false,
  hasParentSession: false,
  managedTokenPresent: false,
  queueEnabled: false,
  hasLiveRun: false,
  queuedCount: 0,
  canRetry: false,
  sideMode: false,
};

export function createTuiCommandCatalog(
  contributions: readonly TuiCommandContribution[] = [],
  handlers: Readonly<Partial<Record<string, TuiCommandHandler>>> = {},
  context: () => TuiCommandContext = () => EMPTY_COMMAND_CONTEXT,
): TuiCommandCatalog {
  const registry = new TuiContributionRegistry<TuiCommandContribution>();
  COMMAND_SOURCES.forEach((source, index) =>
    registry.register({
      id: `core/command/${source.name}`,
      order: index,
      source,
      execute: handlers[source.name],
    }),
  );
  ACTIVE_RUN_COMMAND_SOURCES.forEach((source, index) =>
    registry.register({
      id: `core/active-run/${source.name}`,
      order: index,
      kind: 'active-run',
      source,
      execute: handlers[source.name],
    }),
  );
  registry.registerAll(contributions);
  const registeredContributions = registry.freeze();

  const names = new Set<string>();
  const commands = registeredContributions
    .filter((contribution) => (contribution.kind ?? 'command') === 'command')
    .map((contribution) => materializeCommand(contribution.source, names));
  const activeRunCommands = registeredContributions
    .filter((contribution) => contribution.kind === 'active-run')
    .map((contribution) => materializeCommand(contribution.source, names));
  const inputCommandNames = new Set(
    registeredContributions
      .filter(
        (contribution) =>
          (contribution.kind ?? 'command') === 'command' && Boolean(contribution.execute),
      )
      .map((contribution) => contribution.source.name),
  );
  const resolve = (input: string): TuiCommand | undefined => {
    const invocation = parseCommandInvocation(input, registeredContributions);
    if (!invocation) return undefined;
    return [...commands, ...activeRunCommands].find(
      (command) => command.name === invocation.command.name,
    );
  };
  return {
    commands,
    get inputCommands() {
      const currentContext = context();
      return commands.filter(
        (command) =>
          isTuiCommandAllowedInSideMode(command, currentContext) &&
          (inputCommandNames.has(command.name) || command.inputWhen?.(currentContext) === true),
      );
    },
    activeRunCommands,
    get discoverableCommands() {
      return resolveTuiCommandVisibility(commands, context(), 'default');
    },
    get searchableCommands() {
      return resolveTuiCommandVisibility(commands, context(), 'search');
    },
    get slashCommands() {
      return resolveTuiCommandVisibility(commands, context(), 'default').map(
        ({ name, description, argumentHint, getArgumentCompletions }) => ({
          name,
          description,
          ...(argumentHint ? { argumentHint } : {}),
          ...(getArgumentCompletions ? { getArgumentCompletions } : {}),
        }),
      );
    },
    resolve,
    dispatch: async (input) => {
      const invocation = parseCommandInvocation(input, registeredContributions);
      if (!invocation) return { status: 'unrecognized' };
      const command = commands.find((candidate) => candidate.name === invocation.command.name);
      const currentContext = context();
      const resolvedCommand =
        command ?? materializeCommand(invocation.contribution.source, new Set());
      if (
        resolvedCommand.audience !== 'internal' &&
        !isTuiCommandAllowedInSideMode(resolvedCommand, currentContext)
      ) {
        return {
          status: 'unavailable',
          reason: resolveSideModeUnavailableReason(resolvedCommand),
        };
      }
      if (
        command &&
        command.audience !== 'internal' &&
        !isTuiCommandAvailable(command, currentContext)
      ) {
        return {
          status: 'unavailable',
          reason:
            command.runAvailability === 'idle' && currentContext.hasLiveRun
              ? controllerText('command.unavailable.stopBeforeUsage', { usage: command.usage })
              : (command.unavailableReason ??
                controllerText('command.unavailable.notAvailableNow', { usage: command.usage })),
        };
      }
      const disposition = await invocation.contribution.execute?.(invocation.command);
      return invocation.contribution.execute
        ? {
            status: 'handled',
            ...(disposition ? { disposition } : {}),
          }
        : { status: 'unrecognized' };
    },
  };
}

function parseCommandInvocation(
  input: string,
  contributions: readonly TuiCommandContribution[],
):
  | {
      command: TuiCommandInvocation;
      contribution: TuiCommandContribution;
    }
  | undefined {
  const match = matchTuiCommandInput(
    input,
    contributions.map(({ source }) => source),
  );
  if (!match) return undefined;
  const contribution = contributions.find(({ source }) => source === match.source);
  if (!contribution) return undefined;
  return {
    contribution,
    command: {
      raw: match.raw,
      name: contribution.source.name,
      args: match.args,
    },
  };
}

/**
 * Parse the slash token and trailing payload once for both execution and live Composer intent.
 * Exact-token commands reject non-whitespace suffixes, so callers cannot visually classify input
 * differently from the command path that will handle Enter.
 */
export function matchTuiCommandInput<TCommand extends TuiCommandInputDescriptor>(
  input: string,
  commands: readonly TCommand[],
): TuiCommandInputMatch<TCommand> | undefined {
  const raw = input.trim();
  const token = raw.split(/\s+/u, 1)[0];
  if (!token || (!token.startsWith('/') && !token.startsWith('@'))) return undefined;
  const requestedName = token.startsWith('/') ? token.slice(1) : token;
  const normalizedName = requestedName.toLocaleLowerCase();
  const source = commands.find((command) =>
    [command.name, ...(command.aliases ?? [])].some(
      (name) => name.toLocaleLowerCase() === normalizedName,
    ),
  );
  if (!source) return undefined;
  const args = raw.slice(token.length).trim();
  if (args && !source.argumentHint) return undefined;
  return { source, raw, token, args };
}

/** Localized label for every command category, keyed by its stable English key. */
const COMMAND_CATEGORY_LABELS: Readonly<Record<TuiCommandCategory, ControllerCopyKey>> = {
  Session: 'command.category.session',
  Runtime: 'command.category.runtime',
  Capability: 'command.category.capability',
  Input: 'command.category.input',
  Transcript: 'command.category.transcript',
  Decision: 'command.category.decision',
  Application: 'command.category.application',
};

function commandCategoryLabel(category: TuiCommandCategory): string {
  return controllerText(COMMAND_CATEGORY_LABELS[category]);
}

function materializeCommand(source: TuiCommandSource, names: Set<string>): TuiCommand {
  const normalizedNames = [source.name, ...(source.aliases ?? [])].map((name) =>
    name.toLocaleLowerCase(),
  );
  for (const name of normalizedNames) {
    if (names.has(name)) throw new Error(`Duplicate command name or alias: ${name}`);
    names.add(name);
  }
  const usage = `/${source.name}${source.argumentHint ? ` ${source.argumentHint}` : ''}`;
  return {
    ...source,
    usage,
    composerTemplate: `/${source.name}${source.argumentHint ? ' ' : ''}`,
    categoryLabel: source.categoryLabel ?? commandCategoryLabel(source.category),
  };
}

export function isTuiCommandDiscoverable(command: TuiCommand): boolean {
  return command.audience !== 'internal';
}

export function resolveTuiCommandVisibility(
  commands: readonly TuiCommand[],
  context: TuiCommandContext,
  mode: 'default' | 'search',
): TuiCommand[] {
  return commands.filter((command) => {
    if (!isTuiCommandDiscoverable(command)) return false;
    if (!isTuiCommandAvailable(command, context)) return false;
    return mode === 'search' || command.discoverability !== 'search-only';
  });
}

/** Side mode restricts the surface to the side-mode whitelist at every layer. */
export function isTuiCommandAllowedInSideMode(
  command: TuiCommand,
  context: TuiCommandContext,
): boolean {
  if (!context.sideMode) return true;
  return SIDE_MODE_COMMANDS.has(command.name.toLocaleLowerCase());
}

/** Mirrors Codex's side-conversation copy so a rejected command explains the exit path. */
export function resolveSideModeUnavailableReason(
  command: Pick<TuiCommand, 'name' | 'usage'>,
): string {
  if (command.name.toLocaleLowerCase() === 'rename') {
    return controllerText('command.unavailable.sideRename');
  }
  return controllerText('command.unavailable.sideCommand', { usage: command.usage });
}

export function isTuiCommandAvailable(command: TuiCommand, context: TuiCommandContext): boolean {
  if (!isTuiCommandAllowedInSideMode(command, context)) return false;
  if (command.runAvailability === 'idle' && context.hasLiveRun) return false;
  return command.visibleWhen?.(context) ?? true;
}

const DEFAULT_COMMAND_CATALOG = createTuiCommandCatalog();

export const MINIMAX_CODE_COMMANDS: readonly TuiCommand[] = DEFAULT_COMMAND_CATALOG.commands;
export const MINIMAX_CODE_ACTIVE_RUN_COMMANDS: readonly TuiCommand[] =
  DEFAULT_COMMAND_CATALOG.activeRunCommands;
export const MINIMAX_CODE_DISCOVERABLE_COMMANDS: readonly TuiCommand[] =
  DEFAULT_COMMAND_CATALOG.discoverableCommands;

export function formatTuiCommandUsage(command: TuiCommand): string {
  const aliases = command.aliases?.join(', ');
  return aliases ? `${command.usage} (${aliases})` : command.usage;
}

export function filterTuiCommands(
  commands: readonly TuiCommand[],
  query: string,
  context: TuiCommandContext = EMPTY_COMMAND_CONTEXT,
): TuiCommand[] {
  const tokens = query
    .trim()
    .replace(/^\/+/u, '')
    .toLocaleLowerCase()
    .split(/\s+/u)
    .filter(Boolean);
  const discoverableCommands = resolveTuiCommandVisibility(
    commands,
    context,
    tokens.length === 0 ? 'default' : 'search',
  );
  const firstToken = tokens[0];
  const slashQuery = /^\/+/u.test(query.trim());
  const directNameMatches =
    tokens.length === 1 && firstToken
      ? discoverableCommands.filter((command) =>
          [command.name, ...(command.aliases ?? [])].some((name) =>
            name.toLocaleLowerCase().startsWith(firstToken),
          ),
        )
      : [];
  if (directNameMatches.length > 0) return directNameMatches;
  if (slashQuery && tokens.length === 1) return [];
  if (tokens.length === 0) return [...discoverableCommands];

  return discoverableCommands.filter((command) => {
    const searchable = [
      command.name,
      ...(command.aliases ?? []),
      command.usage,
      command.description,
      command.category,
      command.shortcut,
    ]
      .filter(Boolean)
      .join(' ')
      .toLocaleLowerCase();
    return tokens.every((token) => searchable.includes(token));
  });
}

function argumentCompleter(
  choices: readonly (readonly [value: string, description: string])[],
): NonNullable<SlashCommand['getArgumentCompletions']> {
  const items = choices.map(([value, description]) => ({ value, label: value, description }));
  return (prefix) => {
    const query = prefix.trimStart();
    if (/\s/u.test(query)) return null;
    return fuzzyFilter(items, query, (item) => item.value);
  };
}
