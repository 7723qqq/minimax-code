import { resolveLocaleName } from '@mavis/shared/i18n';

import { transcriptText } from '../features/transcript/copy.js';

export interface TranscriptToolDefinition {
  readonly names: readonly string[];
  readonly family?:
    | 'shell'
    | 'read'
    | 'search'
    | 'write'
    | 'edit'
    | 'task'
    | 'task-control'
    | 'mcp';
  readonly accentLabel?: string;
  readonly summaryStyle?: 'parenthetical' | 'dot';
  readonly succeededMarker?: 'check';
  readonly runningAction: string;
  readonly completedAction: string;
  readonly failedAction?: string;
  readonly failedActionsByCode?: Readonly<Record<string, string>>;
  readonly previewLines?: {
    readonly running: number;
    readonly completed: number;
    readonly failed: number;
  };
}

const BUILTIN_TOOL_DEFINITIONS = (): readonly TranscriptToolDefinition[] => [
  {
    names: ['bash'],
    family: 'shell',
    runningAction: transcriptText('tool.action.running'),
    completedAction: transcriptText('tool.action.ran'),
    failedAction: transcriptText('tool.action.commandFailed'),
    previewLines: { running: 3, completed: 3, failed: 8 },
  },
  {
    names: ['edit', 'edit_file', 'apply_patch'],
    family: 'edit',
    runningAction: transcriptText('tool.action.editing'),
    completedAction: transcriptText('tool.action.edited'),
    failedAction: transcriptText('tool.action.editFailed'),
    previewLines: { running: 3, completed: 3, failed: 8 },
  },
  {
    names: ['grep', 'search'],
    family: 'search',
    runningAction: transcriptText('tool.action.searching'),
    completedAction: transcriptText('tool.action.searched'),
    failedAction: transcriptText('tool.action.searchFailed'),
    failedActionsByCode: {
      invalid_regex: transcriptText('tool.action.invalidSearchPattern'),
    },
    previewLines: { running: 3, completed: 3, failed: 6 },
  },
  {
    names: ['glob', 'list', 'list_files'],
    family: 'search',
    runningAction: transcriptText('tool.action.listing'),
    completedAction: transcriptText('tool.action.listed'),
    failedAction: transcriptText('tool.action.listFailed'),
  },
  {
    names: ['memory'],
    runningAction: transcriptText('tool.action.updatingMemory'),
    completedAction: transcriptText('tool.action.updatedMemory'),
    failedAction: transcriptText('tool.action.memoryUpdateFailed'),
  },
  {
    names: ['read', 'read_file', 'readfile'],
    family: 'read',
    runningAction: transcriptText('tool.action.reading'),
    completedAction: transcriptText('tool.action.read'),
    failedAction: transcriptText('tool.action.readFailed'),
  },
  {
    names: ['write', 'write_file'],
    family: 'write',
    runningAction: transcriptText('tool.action.writing'),
    completedAction: transcriptText('tool.action.wrote'),
    failedAction: transcriptText('tool.action.writeFailed'),
    previewLines: { running: 3, completed: 3, failed: 8 },
  },
  {
    names: ['task', 'delegate', 'spawn_agent'],
    family: 'task',
    runningAction: transcriptText('tool.action.delegating'),
    completedAction: transcriptText('tool.action.delegated'),
    failedAction: transcriptText('tool.action.delegationFailed'),
    previewLines: { running: 3, completed: 3, failed: 8 },
  },
  {
    names: ['task_output'],
    family: 'task-control',
    summaryStyle: 'dot',
    succeededMarker: 'check',
    runningAction: transcriptText('tool.action.readingTaskResult'),
    completedAction: transcriptText('tool.action.readTaskResult'),
    failedAction: transcriptText('tool.action.readTaskResult'),
  },
  {
    names: ['task_query'],
    family: 'task-control',
    summaryStyle: 'dot',
    succeededMarker: 'check',
    runningAction: transcriptText('tool.action.checkingBackgroundTasks'),
    completedAction: transcriptText('tool.action.checkedBackgroundTasks'),
    failedAction: transcriptText('tool.action.backgroundTaskCheckFailed'),
  },
  {
    names: ['web_search', 'matrix_web_search', 'mcp__matrix__web_search'],
    runningAction: transcriptText('tool.action.usingWebSearch'),
    completedAction: transcriptText('tool.action.usedWebSearch'),
    failedAction: transcriptText('tool.action.webSearchFailed'),
    accentLabel: 'WebSearch',
  },
  {
    names: ['web_fetch'],
    runningAction: transcriptText('tool.action.usingWebFetch'),
    completedAction: transcriptText('tool.action.usedWebFetch'),
    failedAction: transcriptText('tool.action.webFetchFailed'),
    accentLabel: 'WebFetch',
  },
  {
    names: ['mcp'],
    family: 'mcp',
    runningAction: transcriptText('tool.action.calling'),
    completedAction: transcriptText('tool.action.called'),
    failedAction: transcriptText('tool.action.callFailed'),
    previewLines: { running: 3, completed: 3, failed: 8 },
  },
];

/**
 * Tool definitions carry localized action labels, so they are rebuilt when the
 * host locale changes instead of being frozen at import time.
 */
let cachedToolDefinitions:
  | { readonly locale: string; readonly definitions: ReadonlyMap<string, TranscriptToolDefinition> }
  | undefined;

function toolDefinitions(): ReadonlyMap<string, TranscriptToolDefinition> {
  const locale = resolveLocaleName();
  if (cachedToolDefinitions?.locale === locale) return cachedToolDefinitions.definitions;
  const definitions: ReadonlyMap<string, TranscriptToolDefinition> = new Map(
    BUILTIN_TOOL_DEFINITIONS().flatMap((definition) =>
      definition.names.map((name) => [normalizeToolName(name), definition] as const),
    ),
  );
  cachedToolDefinitions = { locale, definitions };
  return definitions;
}

export function resolveTranscriptToolDefinition(
  title: string | undefined,
): TranscriptToolDefinition | undefined {
  const normalized = normalizeToolName(title);
  const definitions = toolDefinitions();
  return (
    definitions.get(normalized) ?? (isMcpToolName(normalized) ? definitions.get('mcp') : undefined)
  );
}

export function resolveTranscriptToolFailedAction(
  definition: TranscriptToolDefinition,
  errorCode: string | undefined,
): string {
  return (
    (errorCode ? definition.failedActionsByCode?.[errorCode] : undefined) ??
    definition.failedAction ??
    definition.completedAction
  );
}

export function normalizeToolName(title: string | undefined): string {
  return title?.trim().toLocaleLowerCase().replaceAll('-', '_') || 'tool';
}

export function formatTranscriptToolIdentity(
  title: string | undefined,
  definition: TranscriptToolDefinition | undefined,
): string | undefined {
  if (definition?.family !== 'mcp') return undefined;
  const normalized = normalizeToolName(title);
  if (normalized.startsWith('mcp__')) {
    const [, server, ...tool] = normalized.split('__');
    return server && tool.length > 0 ? `${server}.${tool.join('.')}` : normalized;
  }
  if (normalized.startsWith('mcp_')) return normalized.slice(4).replaceAll('__', '.');
  return normalized === 'mcp' ? undefined : normalized;
}

function isMcpToolName(name: string): boolean {
  return name === 'mcp' || name.startsWith('mcp__') || name.startsWith('mcp_');
}
