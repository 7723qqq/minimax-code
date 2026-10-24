import type { TuiMcpServer, TuiSkillList } from '../../../runtime/port.js';
import {
  classifyTuiSkillSource,
  readTuiMcpPublicStatus,
  type TuiSkill,
} from './product-inspection.js';
import {
  TuiInspectionPanel,
  type TuiInspectionRow,
  type TuiInspectionSection,
  type TuiInspectionTone,
} from '../../shell/inspection-panel.js';
import { tuiErrorDiagnostic } from '../../../user-facing-failure.js';
import { inspectionText } from './copy.js';

export function createTuiSkillsInspectionPanel(
  result: TuiSkillList,
  filter: string,
  onCancel: () => void,
  maxRows: () => number,
): TuiInspectionPanel {
  const skills = result.skills ?? [];
  const groups = [
    {
      title: inspectionText('capabilities.section.builtIn'),
      skills: skills.filter((skill) => classifyTuiSkillSource(skill) === 'builtin'),
    },
    {
      title: inspectionText('capabilities.section.user'),
      skills: skills.filter((skill) => classifyTuiSkillSource(skill) === 'user'),
    },
    {
      title: inspectionText('capabilities.section.other'),
      skills: skills.filter((skill) => classifyTuiSkillSource(skill) === 'other'),
    },
  ];
  const sections = groups
    .filter((group) => group.skills.length > 0)
    .map(
      (group): TuiInspectionSection => ({
        title: `${group.title} · ${group.skills.length}`,
        rows: group.skills.map(skillRow),
      }),
    );
  if (sections.length === 0) sections.push(emptySkillsSection(filter));
  const normalizedFilter = filter.trim();
  const subtitle = [
    normalizedFilter
      ? inspectionText('capabilities.subtitle.matching', { filter: normalizedFilter })
      : inspectionText('capabilities.subtitle.agentScope'),
    result.hasMore ? inspectionText('capabilities.subtitle.moreResults') : undefined,
    inspectionText('capabilities.subtitle.readOnly'),
  ]
    .filter(Boolean)
    .join(' · ');

  return new TuiInspectionPanel({
    title: inspectionText('capabilities.title.skills'),
    subtitle,
    badge: {
      label: `${skills.length}${result.hasMore ? '+' : ''} FOUND`,
      tone: skills.length > 0 ? 'accent' : 'neutral',
    },
    sections,
    footer: inspectionText('capabilities.footer.readOnly'),
    layout: 'stacked',
    maxRows,
    onCancel,
  });
}

export function createTuiMcpInspectionPanel(
  servers: readonly TuiMcpServer[],
  filter: string,
  onCancel: () => void,
  maxRows: () => number,
): TuiInspectionPanel {
  const catalog = servers.map(inspectMcpServer).sort(compareMcpServers);
  const available = catalog.filter((server) => server.status === 'available').length;
  const attention = catalog.some(
    (server) => server.status === 'error' || server.status === 'unavailable',
  );
  const normalizedFilter = filter.trim();
  const builtin = catalog.filter((server) => server.sourceKind === 'builtin');
  const configured = catalog.filter(
    (server) => server.sourceKind !== 'builtin' && !server.sourceScope,
  );
  const project = catalog.filter((server) => server.sourceScope === 'project');
  const session = catalog.filter((server) => server.sourceScope === 'session');

  return new TuiInspectionPanel({
    title: inspectionText('capabilities.title.mcp'),
    subtitle: [
      inspectionText('capabilities.subtitle.runtimeCatalog'),
      normalizedFilter
        ? inspectionText('capabilities.subtitle.matching', { filter: normalizedFilter })
        : undefined,
    ]
      .filter(Boolean)
      .join(' · '),
    badge: {
      label: `${available}/${catalog.length} AVAILABLE`,
      tone: attention ? 'warning' : available > 0 ? 'success' : 'neutral',
    },
    sections: [
      mcpSection(inspectionText('capabilities.section.builtIn'), builtin, normalizedFilter),
      mcpSection(
        inspectionText('capabilities.section.userConfigured'),
        configured,
        normalizedFilter,
      ),
      ...(project.length
        ? [mcpSection(inspectionText('capabilities.section.projectScope'), project, normalizedFilter)]
        : []),
      ...(session.length
        ? [mcpSection(inspectionText('capabilities.section.clientSession'), session, normalizedFilter)]
        : []),
    ],
    footer: inspectionText('capabilities.footer.reload'),
    layout: 'stacked',
    maxRows,
    onCancel,
  });
}

function skillRow(skill: TuiSkill): TuiInspectionRow {
  const available = skill.enabled !== false;
  return {
    label: skill.displayName ?? skill.name,
    value: `${available ? '● available' : '○ unavailable'} · ${skillSourceLabel(skill)}`,
    tone: available ? 'success' : 'neutral',
    labelTone: 'neutral',
    labelBold: true,
    detail: skill.displayDescription ?? skill.description,
    detailMaxLines: 2,
  };
}

function emptySkillsSection(filter: string): TuiInspectionSection {
  const normalizedFilter = filter.trim();
  return {
    title: inspectionText('capabilities.section.catalog'),
    rows: [
      {
        label: inspectionText('capabilities.empty.noMatches'),
        value: normalizedFilter || inspectionText('capabilities.empty.noSkillsConfigured'),
        labelTone: 'neutral',
        labelBold: true,
        detail: normalizedFilter
          ? inspectionText('capabilities.empty.broaderFilter')
          : inspectionText('capabilities.empty.noVisibleSkills'),
      },
    ],
  };
}

function skillSourceLabel(skill: TuiSkill): string {
  if (skill.sourceKind) return skill.sourceKind;
  if (skill.sourceType === 1) return 'official';
  if (skill.sourceType === 2) return 'user';
  return skill.sourceType === undefined ? 'unknown source' : `source ${skill.sourceType}`;
}

type McpCatalogStatus = 'available' | 'configured' | 'disabled' | 'unavailable' | 'error';

interface McpCatalogEntry {
  readonly name: string;
  readonly transport: string;
  readonly status: McpCatalogStatus;
  readonly sourceKind: 'builtin' | 'configured';
  readonly sourceScope?: 'project' | 'session';
  readonly managed: boolean;
  readonly tools: ReadonlyArray<{ name: string; description?: string }>;
  readonly description?: string;
  readonly error?: string;
}

function inspectMcpServer(server: TuiMcpServer): McpCatalogEntry {
  const publicStatus = readTuiMcpPublicStatus(server.configJson);
  const status: McpCatalogStatus =
    server.status ?? publicStatus.status ?? (!server.enabled ? 'disabled' : 'configured');
  return {
    name: server.name,
    transport: server.transport ?? 'unknown transport',
    status,
    sourceKind: server.sourceKind ?? 'configured',
    sourceScope: server.sourceScope,
    managed: server.managed === true,
    tools: server.tools ?? [],
    ...(server.description ? { description: server.description } : {}),
    ...(server.error || publicStatus.error
      ? { error: tuiErrorDiagnostic(server.error ?? publicStatus.error) }
      : {}),
  };
}

function mcpSection(
  title: string,
  servers: readonly McpCatalogEntry[],
  filter: string,
): TuiInspectionSection {
  return {
    title: `${title} · ${servers.length}`,
    rows:
      servers.length > 0
        ? servers.map(mcpRow)
        : [
            {
              label: inspectionText('capabilities.empty.noMatches'),
              value:
                filter ||
                inspectionText('capabilities.empty.noServersInGroup', {
                  group: title.toLocaleLowerCase(),
                }),
              labelTone: 'neutral',
              labelBold: true,
              detail: inspectionText('capabilities.empty.noMatchingCapabilities'),
            },
          ],
  };
}

function compareMcpServers(left: McpCatalogEntry, right: McpCatalogEntry): number {
  return (
    mcpStatusPriority(left.status) - mcpStatusPriority(right.status) ||
    left.name.localeCompare(right.name)
  );
}

function mcpStatusPriority(status: McpCatalogStatus): number {
  if (status === 'error') return 0;
  if (status === 'unavailable') return 1;
  if (status === 'configured') return 2;
  if (status === 'available') return 3;
  return 4;
}

function mcpRow(server: McpCatalogEntry): TuiInspectionRow {
  const builtin = server.sourceKind === 'builtin';
  const toolCount = server.tools.length;
  return {
    label: server.name,
    value: builtin
      ? `${server.status === 'unavailable' ? '○' : mcpStatusMarker(server.status)} ${server.status} · ${
          server.managed ? 'runtime-managed' : 'built-in'
        } · ${toolCount} ${toolCount === 1 ? 'tool' : 'tools'}`
      : `${mcpStatusMarker(server.status)} ${server.status} · ${server.transport}`,
    tone: mcpStatusTone(server.status),
    labelTone: 'neutral',
    labelBold: true,
    detail:
      builtin && toolCount > 0
        ? server.tools.map((tool) => tool.name).join(' · ')
        : (server.error ?? server.description),
    detailTone: !builtin && server.error ? 'error' : undefined,
    detailMaxLines: 2,
  };
}

function mcpStatusMarker(status: McpCatalogStatus): string {
  if (status === 'available') return '●';
  if (status === 'error' || status === 'unavailable') return '!';
  if (status === 'disabled') return '○';
  return '◆';
}

function mcpStatusTone(status: McpCatalogStatus): TuiInspectionTone {
  if (status === 'available') return 'success';
  if (status === 'error' || status === 'unavailable') return 'error';
  if (status === 'configured') return 'accent';
  return 'neutral';
}
