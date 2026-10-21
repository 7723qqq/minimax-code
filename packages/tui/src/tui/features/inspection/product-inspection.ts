import type {
  TuiAccountStatus,
  TuiContextSnapshotResponse,
  TuiMcpServer,
  TuiPendingPermission,
  TuiRuntimeDiagnostics,
  TuiModel,
  TuiSession,
  TuiSessionUsage,
  TuiSessionUsageSummary,
  TuiSkillList,
  TuiWorkspaceGitMetadata,
  TuiInstructionSource,
} from '../../../runtime/port.js';
import {
  formatTuiPermissionMode,
  isDangerousTuiPermissionMode,
  type TuiPermissionMode,
} from '../../../application/permission-mode.js';
import { sanitizeTerminalText } from '../../rendering/terminal-text.js';
import { sanitizeTuiUrl } from '../../rendering/url.js';
import { resolveTuiThinkingChoice } from '../model/thinking.js';
import { resolveTuiEffortChoice } from '../model/effort.js';
import { resolveTuiSessionCacheMetrics } from '../../../application/session-cache-metrics.js';
import { inspectionLabelId, inspectionReportLabel, inspectionText } from './copy.js';
import type {
  TranscriptContextVisualization,
  TranscriptInspectionReport,
  TranscriptInspectionTone,
  TranscriptUsageAccountRow,
  TranscriptUsageVisualization,
} from '../../transcript/model.js';

export type TuiSkill = NonNullable<TuiSkillList['skills']>[number];

export interface TuiStatusPresentationOptions {
  readonly version?: string;
  readonly accountLoading?: boolean;
  readonly model?: TuiModel;
  /** Session-scoped think effort; falls back to the configured default level. */
  readonly effort?: string;
  readonly workspaceDir?: string;
  readonly permissionMode?: TuiPermissionMode;
  readonly session?: TuiSession;
  readonly workspaceGit?: TuiWorkspaceGitMetadata;
  readonly instructionSources?: readonly TuiInstructionSource[];
  readonly planMode?: {
    readonly displayMode: 'default' | 'plan';
    readonly transition?: 'next-message' | 'submitting';
  };
}

export function formatTuiAccountStatus(
  account: TuiAccountStatus | undefined,
  options: TuiStatusPresentationOptions = {},
): string {
  return formatInspectionReport(createTuiAccountStatusInspection(account, options));
}

export function createTuiAccountStatusInspection(
  account: TuiAccountStatus | undefined,
  options: TuiStatusPresentationOptions = {},
): TranscriptInspectionReport {
  const sessionModel = options.model;
  const status = account?.status ?? 'unknown';
  const needsLogin = status === 'needs-login' || account?.managedTokenPresent === false;
  const identity = account?.identity?.email?.trim() || account?.identity?.name?.trim();
  const accountLabel = options.accountLoading
    ? inspectionText('account.loading')
    : needsLogin
      ? account?.modelSource === 'byok'
        ? inspectionText('account.notSignedIn')
        : inspectionText('account.signIn')
      : identity
        ? safeInline(identity)
        : status === 'ready'
          ? inspectionText('account.connected')
          : status === 'warning'
            ? inspectionText('account.connectedWithWarnings')
            : inspectionText('account.unavailable');
  const sessionEffort = sessionModel
    ? resolveTuiEffortChoice(sessionModel, options.effort)
    : undefined;
  const model = sessionModel
    ? `${safeInline(sessionModel.providerId)}/${safeInline(sessionModel.modelId)}${
        sessionModel.variant && !sessionEffort ? `#${safeInline(sessionModel.variant)}` : ''
      }`
    : safe(account?.defaultModel ?? inspectionText('value.notSelected'));
  const sections: Array<TranscriptInspectionReport['sections'][number]> = [
    {
      title: inspectionLabelId('label.account'),
      rows: [
        {
          label: inspectionLabelId('label.account'),
          value: accountLabel,
          tone: options.accountLoading
            ? 'neutral'
            : needsLogin
              ? 'warning'
              : accountStatusTone(status),
        },
        {
          label: inspectionLabelId('label.provider'),
          value: safe(account?.providerId ?? inspectionText('value.notConfigured')),
        },
        {
          label: inspectionLabelId('label.auth'),
          value: safe(account?.authMode ?? inspectionText('value.unknown')),
        },
        ...(account?.tokenPlanSummary?.tier
          ? [
              {
                label: inspectionLabelId('label.plan'),
                value: safeInline(account.tokenPlanSummary.tier),
                tone: 'accent' as const,
              },
            ]
          : []),
        ...(account?.modelSource
          ? [
              {
                label: inspectionLabelId('label.modelSource'),
                value:
                  account.modelSource === 'byok'
                    ? inspectionText('account.modelSource.apiKey')
                    : inspectionText('account.modelSource.tokenPlan'),
              },
            ]
          : []),
      ],
    },
  ];
  sections.push({
    title: inspectionLabelId('label.model'),
    rows: [
      {
        label: inspectionLabelId('label.model'),
        value: model,
        tone: sessionModel ? 'accent' : 'neutral',
      },
      ...(sessionEffort
        ? [{ label: inspectionLabelId('label.thinkEffort'), value: sessionEffort }]
        : [
            {
              label: inspectionLabelId('label.thinking'),
              value: formatThinkingStatus(sessionModel),
            },
          ]),
      {
        label: inspectionLabelId('label.source'),
        value:
          sessionModel && options.session
            ? inspectionText('model.sessionSelection')
            : inspectionText('model.configuredDefault'),
      },
    ],
  });
  if (options.workspaceDir !== undefined) {
    sections.push({
      title: inspectionLabelId('label.workspace'),
      rows: [
        { label: inspectionLabelId('label.directory'), value: safeInline(options.workspaceDir) },
        {
          label: inspectionLabelId('label.branch'),
          value: formatWorkspaceBranch(options.workspaceGit),
        },
        {
          label: inspectionLabelId('label.worktree'),
          value: formatWorkspaceWorktree(options.workspaceGit),
        },
      ],
    });
    sections.push({
      title: inspectionLabelId('label.session'),
      rows: [
        {
          label: inspectionLabelId('label.sessionId'),
          value: safeInline(options.session?.sessionId ?? inspectionText('value.notStarted')),
        },
        {
          label: inspectionLabelId('label.title'),
          value: safeInline(options.session?.title ?? inspectionText('value.untitled')),
        },
      ],
    });
    sections.push({
      title: inspectionLabelId('label.permissions'),
      rows: [
        {
          label: inspectionLabelId('label.permissions'),
          value: options.permissionMode
            ? formatTuiPermissionMode(options.permissionMode)
            : inspectionText('value.unavailable'),
          tone:
            options.permissionMode && isDangerousTuiPermissionMode(options.permissionMode)
              ? 'warning'
              : 'neutral',
        },
      ],
    });
    const mode = options.planMode?.displayMode ?? options.session?.interactionMode ?? 'default';
    const activeMode =
      options.session?.interactionMode === 'plan'
        ? inspectionText('value.planMode')
        : inspectionText('value.defaultMode');
    const modeLabel =
      mode === 'plan' ? inspectionText('value.planMode') : inspectionText('value.defaultMode');
    sections.push({
      title: inspectionLabelId('label.mode'),
      rows: [
        {
          label: inspectionLabelId('label.mode'),
          value: options.planMode?.transition
            ? `${activeMode} → ${modeLabel} (${
                options.planMode.transition === 'next-message'
                  ? inspectionText('value.nextMessage')
                  : inspectionText('value.submitting')
              })`
            : modeLabel,
        },
      ],
    });
    sections.push({
      title: inspectionLabelId('label.instructions'),
      rows: options.instructionSources?.length
        ? options.instructionSources.map((source) => ({
            label:
              source.scope === 'global'
                ? inspectionLabelId('label.globalRules')
                : inspectionLabelId('label.projectRules'),
            value: safeInline(source.path),
          }))
        : [
            {
              label: inspectionLabelId('label.instructions'),
              value: options.instructionSources
                ? inspectionText('value.none')
                : inspectionText('value.unavailable'),
            },
          ],
    });
  }
  const quotaRows = createTokenPlanQuotaRows(account).filter(
    (row) => row.label !== inspectionLabelId('label.quotaVideo'),
  );
  if (quotaRows.length > 0) sections.push({ title: inspectionLabelId('label.quota'), rows: quotaRows });
  return {
    title: inspectionText('status.title', {
      version: options.version ? ` · v${safeInline(options.version)}` : '',
    }),
    badge: options.accountLoading
      ? { label: inspectionText('account.loadingBadge'), tone: 'neutral' }
      : accountStatusBadge(status),
    sections,
    warnings: account?.warnings.map(safe),
    footer: inspectionText('account.footer'),
    visualization: { kind: 'status', ...(quotaRows.length ? { quotaRows } : {}) },
  };
}

function formatThinkingStatus(model: TuiModel | undefined): string {
  if (!model) return inspectionText('model.unknownThinking');
  const thinking = resolveTuiThinkingChoice(model);
  return thinking === undefined
    ? inspectionText('model.notConfigurable')
    : thinking === 'on'
      ? inspectionText('model.thinkingOn')
      : inspectionText('model.thinkingOff');
}

function formatWorkspaceBranch(metadata: TuiWorkspaceGitMetadata | undefined): string {
  if (!metadata) return inspectionText('value.unavailable');
  if (!metadata.isGitRepo) return inspectionText('workspace.branch.notGitRepository');
  if (metadata.detached) return inspectionText('workspace.branch.detachedHead');
  return safeInline(metadata.branch || inspectionText('workspace.branch.unborn'));
}

function formatWorkspaceWorktree(metadata: TuiWorkspaceGitMetadata | undefined): string {
  if (!metadata) return inspectionText('value.unavailable');
  if (!metadata.isGitRepo) return inspectionText('workspace.worktree.notApplicable');
  return metadata.isWorktree
    ? inspectionText('workspace.worktree.linked')
    : inspectionText('workspace.worktree.primaryCheckout');
}

function createTokenPlanRows(
  account: TuiAccountStatus | undefined,
  needsLogin: boolean,
): TranscriptUsageAccountRow[] {
  if (needsLogin) {
    return [
      {
        label: inspectionLabelId('label.plan'),
        value: inspectionText('account.plan.loginHint'),
        tone: 'warning',
      },
    ];
  }
  const summary = account?.tokenPlanSummary;
  const hasTokenPlan =
    account?.modelSource === 'token-plan' ||
    account?.tokenPlanQuotaState !== undefined ||
    Boolean(summary);
  if (!hasTokenPlan) return [];
  return [
    {
      label: inspectionLabelId('label.plan'),
      value: safe(summary?.tier ?? inspectionText('account.modelSource.tokenPlan')),
      tone: 'accent',
    },
    ...(summary?.expiresAtMs
      ? [{ label: inspectionLabelId('label.expires'), value: formatLocalDate(summary.expiresAtMs) }]
      : []),
    ...(summary?.creditBalance
      ? [
          {
            label: inspectionLabelId('label.credits'),
            value: formatCreditAmount(summary.creditBalance),
          },
        ]
      : []),
  ];
}

function createTokenPlanQuotaRows(
  account: TuiAccountStatus | undefined,
): TranscriptUsageAccountRow[] {
  if (account?.tokenPlanQuotaState === 'not-subscribed') {
    return [
      {
        label: inspectionLabelId('label.quota'),
        value: inspectionText('quota.noSubscription'),
        tone: 'warning',
      },
    ];
  }
  const quota = account?.tokenPlanQuota;
  if (!quota) {
    return account?.tokenPlanQuotaState === 'unavailable'
      ? [
          {
            label: inspectionLabelId('label.quota'),
            value: inspectionText('quota.temporarilyUnavailable'),
            tone: 'warning',
          },
        ]
      : [];
  }
  return [
    {
      label: inspectionLabelId('label.quotaFiveHour'),
      value: formatQuotaWindowDetail(quota.fiveHour),
      ...(quota.fiveHour.unlimited ? {} : remainingPercentRatio(quota.fiveHour.remainingPercent)),
    },
    {
      label: inspectionLabelId('label.quotaWeekly'),
      value: formatQuotaWindowDetail(quota.weekly),
      ...(quota.weekly.unlimited ? {} : remainingPercentRatio(quota.weekly.remainingPercent)),
    },
    ...(quota.video
      ? [
          {
            label: inspectionLabelId('label.quotaVideo'),
            value: formatVideoQuotaDetail(quota.video),
            ...(quota.video.unlimited
              ? {}
              : remainingCountRatio(quota.video.remainingCount, quota.video.totalCount)),
          },
        ]
      : []),
  ];
}

function remainingPercentRatio(
  value: number | undefined,
): Pick<TranscriptUsageAccountRow, 'remainingRatio'> {
  return typeof value === 'number' && Number.isFinite(value)
    ? { remainingRatio: Math.min(1, Math.max(0, value / 100)) }
    : {};
}

function remainingCountRatio(
  remaining: number | undefined,
  total: number | undefined,
): Pick<TranscriptUsageAccountRow, 'remainingRatio'> {
  return typeof remaining === 'number' &&
    Number.isFinite(remaining) &&
    typeof total === 'number' &&
    Number.isFinite(total) &&
    total > 0
    ? { remainingRatio: Math.min(1, Math.max(0, remaining / total)) }
    : {};
}

function formatQuotaWindowDetail(
  window: NonNullable<TuiAccountStatus['tokenPlanQuota']>['fiveHour'],
): string {
  if (window.unlimited) return inspectionText('quota.unlimited');
  const remaining =
    typeof window.remainingPercent === 'number'
      ? inspectionText('quota.percentLeft', { percent: formatNumber(window.remainingPercent) })
      : '—';
  return appendResetTime(remaining, window.resetAtMs);
}

function formatVideoQuotaDetail(
  video: NonNullable<TuiAccountStatus['tokenPlanQuota']>['video'],
): string {
  if (!video) return '—';
  if (video.unlimited) return inspectionText('quota.unlimited');
  const remaining =
    video.remainingCount === undefined
      ? '—'
      : video.totalCount === undefined
        ? inspectionText('quota.countLeft', { count: formatNumber(video.remainingCount) })
        : inspectionText('quota.countOfTotalLeft', {
            count: formatNumber(video.remainingCount),
            total: formatNumber(video.totalCount),
          });
  return appendResetTime(remaining, video.resetAtMs);
}

function appendResetTime(value: string, resetAtMs: number | undefined): string {
  if (resetAtMs === undefined || !Number.isFinite(resetAtMs)) return value;
  const remainingMs = resetAtMs - Date.now();
  if (remainingMs <= 0) return inspectionText('quota.resetPending', { value });
  const minutes = Math.ceil(remainingMs / 60_000);
  const duration =
    minutes < 60
      ? `${minutes}m`
      : minutes < 24 * 60
        ? `${Math.floor(minutes / 60)}h ${minutes % 60}m`
        : `${Math.floor(minutes / (24 * 60))}d ${Math.floor((minutes % (24 * 60)) / 60)}h`;
  return inspectionText('quota.resetsIn', { value, duration });
}

function formatLocalDate(value: number): string {
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(value));
}

export function formatTuiRuntimeDiagnostics(diagnostics: TuiRuntimeDiagnostics): string {
  return formatInspectionReport(createTuiRuntimeInspection(diagnostics));
}

export function formatTuiConfigSummary(diagnostics: TuiRuntimeDiagnostics): string {
  return formatInspectionReport(createTuiConfigInspection(diagnostics));
}

export function createTuiRuntimeInspection(
  diagnostics: TuiRuntimeDiagnostics,
): TranscriptInspectionReport {
  const status = safe(diagnostics.status ?? 'unknown');
  const statusTone = runtimeStatusTone(status);
  const valid = statusTone === 'success';
  const issues = diagnostics.warnings.map(safe);
  return {
    title: inspectionText('runtime.title'),
    badge: { label: valid ? 'VALID' : 'ISSUES', tone: statusTone },
    sections: [
      {
        title: inspectionLabelId('label.configFile'),
        rows: [
          {
            label: inspectionLabelId('label.status'),
            value: valid
              ? inspectionText('runtime.value.valid')
              : inspectionText('runtime.value.needsAttention'),
            tone: statusTone,
          },
          {
            label: inspectionLabelId('label.path'),
            value: safe(diagnostics.configPath ?? inspectionText('value.unavailableLower')),
          },
          { label: inspectionLabelId('label.file'), value: presence(diagnostics.configPresent) },
        ],
      },
      ...(valid
        ? [
            {
              title: inspectionLabelId('label.model'),
              rows: [
                {
                  label: inspectionLabelId('label.defaultModel'),
                  value: safe(diagnostics.defaultModel ?? inspectionText('value.notConfigured')),
                },
                {
                  label: inspectionLabelId('label.provider'),
                  value: safe(diagnostics.providerId ?? inspectionText('value.unknown')),
                },
              ],
            },
          ]
        : []),
      ...(issues.length > 0
        ? [
            {
              title: inspectionLabelId('label.issues'),
              rows: issues.map((issue) => ({
                label: inspectionLabelId('label.issue'),
                value: issue,
                tone: statusTone,
              })),
            },
          ]
        : []),
      ...(!valid
        ? [
            {
              title: inspectionLabelId('label.impact'),
              rows: [
                {
                  label: inspectionLabelId('label.currentRun'),
                  value: inspectionText('runtime.currentRunImpact'),
                  tone: 'warning' as const,
                },
              ],
            },
            {
              title: inspectionLabelId('label.nextStep'),
              rows: [
                {
                  label: inspectionLabelId('label.action'),
                  value: configurationNextStep(diagnostics),
                },
              ],
            },
          ]
        : []),
    ],
    footer: inspectionText('runtime.footer'),
  };
}

function configurationNextStep(diagnostics: TuiRuntimeDiagnostics): string {
  const path = safe(diagnostics.configPath ?? inspectionText('value.configFile'));
  if (diagnostics.warnings.some((issue) => issue.includes('does not exist'))) {
    return inspectionText('runtime.nextStep.createOrRestore', { path });
  }
  if (diagnostics.warnings.some((issue) => issue.includes('cannot be read'))) {
    return inspectionText('runtime.nextStep.checkAccess', { path });
  }
  if (diagnostics.warnings.some((issue) => issue.includes('defaultModel'))) {
    return inspectionText('runtime.nextStep.setDefaultModel', { path });
  }
  return inspectionText('runtime.nextStep.fixConfig', { path });
}

export function createTuiConfigInspection(
  diagnostics: TuiRuntimeDiagnostics,
): TranscriptInspectionReport {
  return {
    title: inspectionText('config.title'),
    badge: { label: 'READ ONLY', tone: 'accent' },
    sections: [
      {
        title: inspectionLabelId('label.location'),
        rows: [
          {
            label: inspectionLabelId('label.source'),
            value: safe(diagnostics.configPath ?? inspectionText('config.runtimeDefault')),
          },
          {
            label: inspectionLabelId('label.configFile'),
            value: presence(diagnostics.configPresent),
          },
          {
            label: inspectionLabelId('label.dataDirectory'),
            value: safe(diagnostics.dataDir ?? inspectionText('value.unavailableLower')),
          },
        ],
      },
      {
        title: inspectionLabelId('label.model'),
        rows: [
          {
            label: inspectionLabelId('label.default'),
            value: safe(diagnostics.defaultModel ?? inspectionText('value.notConfigured')),
          },
          {
            label: inspectionLabelId('label.provider'),
            value: safe(diagnostics.providerId ?? inspectionText('value.unknown')),
          },
          {
            label: inspectionLabelId('label.endpoint'),
            value: sanitizeTuiUrl(diagnostics.providerBaseUrl ?? inspectionText('value.default')),
          },
        ],
      },
      {
        title: inspectionLabelId('label.credentials'),
        rows: [
          {
            label: inspectionLabelId('label.authMode'),
            value: safe(diagnostics.authMode ?? inspectionText('value.unknown')),
          },
          {
            label: inspectionLabelId('label.authSource'),
            value: safe(diagnostics.authModeSource ?? inspectionText('value.unknown')),
          },
          {
            label: inspectionLabelId('label.providerApiKey'),
            value: presence(diagnostics.apiKeyPresent),
          },
          {
            label: inspectionLabelId('label.managedCredential'),
            value: presence(diagnostics.managedTokenPresent),
          },
          {
            label: inspectionLabelId('label.customProviders'),
            value: formatNumber(diagnostics.customProviderCount ?? 0),
          },
        ],
      },
    ],
    footer: inspectionText('config.footer'),
  };
}

export interface TuiUsagePresentationOptions {
  readonly context?: TuiContextSnapshotResponse;
  readonly model?: TuiModel;
  readonly account?: TuiAccountStatus;
  readonly scope?: 'session' | 'account';
}

export function formatTuiUsage(
  usage: TuiSessionUsage,
  options: TuiUsagePresentationOptions = {},
): string {
  const presentation = resolveTuiUsagePresentation(usage, options);
  if (!presentation) {
    return options.scope === 'account'
      ? inspectionText('usage.noAccountUsage')
      : inspectionText('usage.noSessionUsage');
  }
  return formatInspectionReport({
    title: usageTitle(options),
    sections: [],
    visualization: presentation,
  });
}

export function createTuiUsageInspection(
  usage: TuiSessionUsage,
  options: TuiUsagePresentationOptions = {},
): TranscriptInspectionReport | undefined {
  const presentation = resolveTuiUsagePresentation(usage, options);
  if (!presentation) return undefined;

  return {
    title: usageTitle(options),
    sections: [],
    visualization: presentation,
  };
}

function resolveTuiUsagePresentation(
  usage: TuiSessionUsage,
  options: TuiUsagePresentationOptions,
): TranscriptUsageVisualization | undefined {
  const summary = usage.summary;
  const accountRows = createUsageAccountRows(options.account);
  if (!summary && accountRows.length === 0) return undefined;

  const contextUsage = options.context?.contextUsage;
  const contextWindow = contextUsage
    ? positiveFinite(contextUsage.contextWindowTokens)
      ? contextUsage.contextWindowTokens
      : options.context?.model?.contextWindow
    : undefined;
  const context =
    contextUsage && positiveFinite(contextWindow)
      ? {
          usedTokens: contextUsage.usedTokens,
          windowTokens: contextWindow,
          utilization: contextUsage.usedTokens / contextWindow,
        }
      : null;
  const model = options.model
    ? `${safeInline(options.model.providerId)}/${safeInline(options.model.modelId)}`
    : inspectionText('usage.modelUnavailable');
  const cacheMetrics = resolveTuiSessionCacheMetrics(summary);
  return {
    kind: 'usage',
    model,
    sessionRecorded: summary !== undefined,
    inputTokens: summary?.inputTokens ?? 0,
    outputTokens: summary?.outputTokens ?? 0,
    totalTokens: summary?.totalTokens ?? (summary ? sumTokenUsage(summary) : 0),
    ...(cacheMetrics ? { cacheMetrics } : {}),
    context,
    ...(accountRows.length > 0 ? { accountRows } : {}),
  };
}

function createUsageAccountRows(
  account: TuiAccountStatus | undefined,
): TranscriptUsageAccountRow[] {
  if (!account) return [];
  const hasPlanInspection =
    account.tokenPlanQuotaState !== undefined ||
    account.tokenPlanSummary !== undefined ||
    account.tokenPlanQuota !== undefined;
  const needsLogin =
    !hasPlanInspection &&
    (account.status === 'needs-login' || account.managedTokenPresent === false);
  return [...createTokenPlanRows(account, needsLogin), ...createTokenPlanQuotaRows(account)];
}

function usageTitle(options: TuiUsagePresentationOptions): string {
  return options.scope === 'account'
    ? inspectionText('usage.title.account')
    : inspectionText('usage.title.session');
}

export function formatTuiContextSnapshot(
  response: TuiContextSnapshotResponse,
  fallbackModel?: TuiModel,
): string {
  if (response.status === 'loading') {
    return inspectionText('context.loading');
  }
  const usage = response.contextUsage;
  if (!usage || response.status === 'empty') {
    return inspectionText('context.unavailable');
  }
  const contextWindow = positiveFinite(usage.contextWindowTokens)
    ? usage.contextWindowTokens
    : response.model?.contextWindow;
  const remaining =
    contextWindow === undefined ? undefined : Math.max(0, contextWindow - usage.usedTokens);
  const utilization =
    contextWindow === undefined ? undefined : Math.min(1, usage.usedTokens / contextWindow);
  const model = response.model
    ? `${safeInline(response.model.provider)}/${safeInline(response.model.id)}`
    : fallbackModel
      ? `${safeInline(fallbackModel.providerId)}/${safeInline(fallbackModel.modelId)}`
      : inspectionText('value.notSelected');
  return [
    inspectionText('context.line.snapshot', {
      state: inspectionText(
        response.status === 'stale' ? 'context.snapshotState.stale' : 'context.snapshotState.live',
      ),
    }),
    inspectionText('context.line.budget', {
      used: formatNumber(usage.usedTokens),
      remaining:
        remaining === undefined
          ? inspectionText('value.unknown')
          : inspectionText('context.budget.remaining', { count: formatNumber(remaining) }),
      utilization:
        utilization === undefined
          ? inspectionText('value.unknown')
          : `${Math.round(utilization * 100)}%`,
    }),
    inspectionText('context.line.model', { model }),
    inspectionText('context.line.compaction', {
      state: response.compaction?.state ?? 'never',
    }),
    ...(usage.components.length > 0
      ? [
          '',
          inspectionText('context.componentsHeading'),
          ...usage.components.map((component) =>
            inspectionText('context.componentLine', {
              label: inspectionReportLabel(contextComponentLabel(component.kind)),
              tokens: formatNumber(component.tokens),
            }),
          ),
        ]
      : []),
    ...(response.status === 'stale' ? ['', inspectionText('context.staleNote')] : []),
  ].join('\n');
}

export function createTuiContextInspection(
  response: TuiContextSnapshotResponse,
): TranscriptInspectionReport | undefined {
  const usage = response.contextUsage;
  if (!usage || response.status === 'loading' || response.status === 'empty') return undefined;
  const contextWindow = positiveFinite(usage.contextWindowTokens)
    ? usage.contextWindowTokens
    : response.model?.contextWindow;
  const remaining =
    contextWindow === undefined ? undefined : Math.max(0, contextWindow - usage.usedTokens);
  const utilization =
    contextWindow === undefined ? undefined : Math.min(1, usage.usedTokens / contextWindow);
  const stale = response.status === 'stale';
  const visualization: TranscriptContextVisualization = {
    kind: 'context',
    model: response.model
      ? `${safeInline(response.model.provider)}/${safeInline(response.model.id)}`
      : inspectionText('value.notSelected'),
    snapshotState: stale ? 'stale' : 'live',
    usedTokens: usage.usedTokens,
    remainingTokens: remaining ?? null,
    contextWindow: contextWindow ?? null,
    utilization: utilization ?? null,
    basis:
      usage.totalCountSource === 'PROVIDER_USAGE_ANCHORED' ? 'provider-usage' : 'runtime-estimate',
    compaction: response.compaction?.state ?? 'never',
    compactionThresholdTokens: null,
    components: usage.components,
  };
  return {
    title: inspectionText('context.title'),
    badge: { label: stale ? 'STALE' : 'LIVE', tone: stale ? 'warning' : 'success' },
    sections: [
      {
        title: inspectionLabelId('label.runtime'),
        rows: [
          {
            label: inspectionLabelId('label.model'),
            value: response.model
              ? `${safeInline(response.model.provider)}/${safeInline(response.model.id)}`
              : inspectionText('value.notSelected'),
          },
          {
            label: inspectionLabelId('label.compaction'),
            value: response.compaction?.state ?? 'never',
          },
          {
            label: inspectionLabelId('label.snapshot'),
            value: stale
              ? inspectionText('context.snapshot.mostRecentRun')
              : inspectionText('context.snapshot.current'),
          },
        ],
      },
      {
        title: inspectionLabelId('label.budget'),
        rows: [
          {
            label: inspectionLabelId('label.used'),
            value: formatNumber(usage.usedTokens),
            tone: 'accent',
          },
          {
            label: inspectionLabelId('label.remaining'),
            value:
              remaining === undefined ? inspectionText('value.unknown') : formatNumber(remaining),
          },
          {
            label: inspectionLabelId('label.utilization'),
            value:
              utilization === undefined
                ? inspectionText('value.unknown')
                : `${Math.round(utilization * 100)}%`,
          },
          {
            label: inspectionLabelId('label.window'),
            value:
              contextWindow === undefined
                ? inspectionText('value.unknown')
                : formatNumber(contextWindow),
          },
        ],
      },
      ...(usage.components.length > 0
        ? [
            {
              title: inspectionLabelId('label.components'),
              rows: usage.components.map((component) => ({
                label: contextComponentLabel(component.kind),
                value: formatNumber(component.tokens),
              })),
            },
          ]
        : []),
    ],
    footer:
      usage.totalCountSource === 'PROVIDER_USAGE_ANCHORED'
        ? inspectionText('context.footer.providerAnchored')
        : inspectionText('context.footer.runtimeEstimate'),
    visualization,
  };
}

export function formatTuiSkills(result: TuiSkillList): string {
  const skills = result.skills ?? [];
  if (skills.length === 0) return inspectionText('skills.noMatches');
  const groups = [
    {
      label: 'Built-in Skills',
      skills: skills.filter((skill) => classifyTuiSkillSource(skill) === 'builtin'),
    },
    {
      label: 'User Skills',
      skills: skills.filter((skill) => classifyTuiSkillSource(skill) === 'user'),
    },
    {
      label: 'Other Skills',
      skills: skills.filter((skill) => classifyTuiSkillSource(skill) === 'other'),
    },
  ];
  const lines = [`Skills · ${skills.length}${result.hasMore ? '+' : ''}`];
  for (const group of groups) {
    if (group.skills.length === 0) continue;
    lines.push(
      '',
      `${group.label} · ${group.skills.length}`,
      ...group.skills.map(formatSkillSummary),
    );
  }
  if (result.hasMore) lines.push('', inspectionText('skills.moreExist'));
  return lines.join('\n');
}

export function formatTuiMcpServers(servers: readonly TuiMcpServer[]): string {
  const ownershipNote = inspectionText('mcp.ownershipNote');
  if (servers.length === 0) {
    return [inspectionText('mcp.noUserServers'), ownershipNote].join('\n');
  }
  return [
    inspectionText('mcp.userServersTitle', { count: servers.length }),
    ...servers.map((server) => {
      const publicStatus = readTuiMcpPublicStatus(server.configJson);
      const description = server.description ? `\n  ${safe(server.description)}` : '';
      const status =
        publicStatus.status && publicStatus.status !== 'disabled'
          ? ` · ${publicStatus.status}`
          : '';
      const error = publicStatus.error ? `\n  ${publicStatus.error}` : '';
      return `${safe(server.name)} · ${server.enabled ? 'enabled' : 'disabled'} · ${safe(
        server.transport ?? 'unknown transport',
      )}${status}${description}${error}`;
    }),
    '',
    ownershipNote,
    inspectionText('mcp.hiddenPayloads'),
  ].join('\n');
}

const PUBLIC_MCP_ERRORS = new Set([
  'MCP server transport is incomplete. Configure a command or URL and retry.',
  'MCP connection support is unavailable in this Runtime.',
  'MCP server connection failed. Retry or check its configuration.',
  'MCP server connection timed out. Retry or check its configuration.',
]);

export function readTuiMcpPublicStatus(configJson: string | undefined): {
  status?: 'available' | 'configured' | 'disabled' | 'error' | 'unavailable';
  error?: string;
} {
  if (!configJson) return {};
  try {
    const value = JSON.parse(configJson) as Record<string, unknown>;
    const status =
      value['status'] === 'available' ||
      value['status'] === 'configured' ||
      value['status'] === 'disabled' ||
      value['status'] === 'error' ||
      value['status'] === 'unavailable'
        ? value['status']
        : undefined;
    const rawError = typeof value['error'] === 'string' ? value['error'] : undefined;
    return {
      ...(status ? { status } : {}),
      ...(rawError && PUBLIC_MCP_ERRORS.has(rawError)
        ? { error: rawError }
        : status === 'error' || status === 'unavailable'
          ? { error: 'MCP server is unavailable. Retry or check its configuration.' }
          : {}),
    };
  } catch {
    return {};
  }
}

export function formatTuiPermissions(requests: readonly TuiPendingPermission[]): string {
  if (requests.length === 0) {
    return [
      inspectionText('permissions.noPendingRequests'),
      inspectionText('permissions.policyOwnedByRuntime'),
    ].join('\n');
  }
  return [
    inspectionText('permissions.pendingTitle', { count: requests.length }),
    ...requests.map((request, index) => {
      const description =
        request.toolDescription ?? request.reason ?? inspectionText('permissions.awaitingDecision');
      return `${index + 1}. ${safe(request.toolName ?? 'tool')} · ${safe(description)}`;
    }),
    '',
    inspectionText('permissions.chooseAction'),
  ].join('\n');
}

function sumTokenUsage(summary: TuiSessionUsageSummary): number {
  return (summary.inputTokens ?? 0) + (summary.outputTokens ?? 0) + (summary.reasoningTokens ?? 0);
}

function formatInspectionReport(report: TranscriptInspectionReport): string {
  const lines = [report.title];
  for (const section of report.sections) {
    for (const row of section.rows) {
      lines.push(`${inspectionReportLabel(row.label)}: ${row.value}`);
    }
  }
  if (report.warnings?.length) {
    lines.push('', inspectionText('report.warnings'), ...report.warnings.map((warning) => `- ${warning}`));
  }
  if (report.footer) lines.push('', report.footer);
  return lines.join('\n');
}

function accountStatusBadge(
  status: TuiAccountStatus['status'] | 'unknown',
): NonNullable<TranscriptInspectionReport['badge']> {
  if (status === 'ready') return { label: 'READY', tone: 'success' };
  if (status === 'needs-login') return { label: 'SIGN IN', tone: 'warning' };
  if (status === 'warning') return { label: 'WARNING', tone: 'warning' };
  return { label: 'UNAVAILABLE', tone: 'error' };
}

function accountStatusTone(
  status: TuiAccountStatus['status'] | 'unknown',
): TranscriptInspectionTone {
  if (status === 'ready') return 'success';
  if (status === 'needs-login' || status === 'warning') return 'warning';
  return 'error';
}

function runtimeStatusTone(status: string): TranscriptInspectionTone {
  const normalized = status.toLowerCase();
  if (normalized === 'ok' || normalized === 'ready' || normalized === 'healthy') return 'success';
  if (normalized.includes('warn') || normalized.includes('degraded')) return 'warning';
  if (normalized === 'unknown') return 'neutral';
  return 'error';
}

function formatSkillSource(value: number | undefined): string | undefined {
  if (value === 1) return 'official';
  if (value === 2) return 'user';
  return value === undefined ? undefined : `source ${value}`;
}

export function classifyTuiSkillSource(skill: TuiSkill): 'builtin' | 'user' | 'other' {
  if (skill.sourceKind?.startsWith('builtin') || skill.sourceType === 1) return 'builtin';
  if (skill.sourceKind || skill.sourceType === 2) return 'user';
  return 'other';
}

function formatSkillSummary(skill: TuiSkill): string {
  const name = skill.displayName ?? skill.name;
  const state = skill.enabled === false ? 'disabled' : 'enabled';
  const source = skill.sourceKind ?? formatSkillSource(skill.sourceType) ?? 'unknown source';
  const description = skill.displayDescription ?? skill.description;
  return `${safe(name)} · ${state} · ${safe(source)}${
    description ? `\n  ${safe(description)}` : ''
  }`;
}

function presence(value: boolean | undefined): string {
  return value === true
    ? inspectionText('value.present')
    : value === false
      ? inspectionText('value.missing')
      : inspectionText('value.unknown');
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

function formatCreditAmount(value: string): string {
  const normalized = value.replace(/,/gu, '').trim();
  const match = /^(\d+)(?:\.(\d+))?$/u.exec(normalized);
  if (!match) return '0';
  const integer = (match[1] ?? '0').replace(/^0+(?=\d)/u, '');
  return integer.replace(/\B(?=(\d{3})+(?!\d))/gu, ',');
}

function positiveFinite(value: number | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

function contextComponentLabel(
  kind: NonNullable<TuiContextSnapshotResponse['contextUsage']>['components'][number]['kind'],
): string {
  if (kind === 'SYSTEM_PROMPT') return inspectionLabelId('label.systemPrompt');
  if (kind === 'MEMORY') return inspectionLabelId('label.memory');
  if (kind === 'TOOLS') return inspectionLabelId('label.tools');
  if (kind === 'SKILLS') return inspectionLabelId('label.skills');
  if (kind === 'MESSAGES') return inspectionLabelId('label.messages');
  return inspectionLabelId('label.other');
}

function safe(value: string): string {
  return sanitizeTerminalText(value);
}

function safeInline(value: string): string {
  return safe(value).replace(/\s+/gu, ' ').trim();
}
