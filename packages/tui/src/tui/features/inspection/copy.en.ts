/**
 * English copy for the inspection panels.
 *
 * The English object is the only source of truth for key shape: the zh-Hans
 * catalog is typed against it, so a missing translation is a compile error
 * rather than a blank line in the interface.
 */
export const EN_INSPECTION_COPY = {
  // Capabilities panel
  'capabilities.title.skills': 'Skills',
  'capabilities.title.mcp': 'MCP servers',
  'capabilities.subtitle.agentScope': 'Available to the current Agent',
  'capabilities.subtitle.moreResults': 'More results exist',
  'capabilities.subtitle.readOnly': 'Read-only catalog',
  'capabilities.subtitle.matching': 'Matching “{filter}”',
  'capabilities.subtitle.runtimeCatalog': 'Runtime capability catalog · Read-only',
  'capabilities.footer.readOnly': 'Esc close · read only',
  'capabilities.footer.reload': 'Esc close · /mcp reload',
  'capabilities.section.builtIn': 'Built-in',
  'capabilities.section.user': 'User',
  'capabilities.section.other': 'Other',
  'capabilities.section.userConfigured': 'User-configured',
  'capabilities.section.projectScope': 'Project · .mcp.json',
  'capabilities.section.clientSession': 'Client session',
  'capabilities.section.catalog': 'Catalog',
  'capabilities.empty.noMatches': 'No matches',
  'capabilities.empty.noSkillsConfigured': 'No Skills configured',
  'capabilities.empty.broaderFilter': 'Close this panel and try a broader /skills filter.',
  'capabilities.empty.noVisibleSkills': 'The current Agent has no visible Skills.',
  'capabilities.empty.noMatchingCapabilities':
    'The current Runtime returned no matching capabilities in this group.',
  'capabilities.empty.noServersInGroup': 'No {group} servers',

  // Report inspection panel
  'report.escClose': 'Esc close',
  'report.scrollProgress': '{start}-{end}/{total} · ↑↓ scroll · PgUp/PgDn scroll · Esc close',

  // Account status
  'account.loading': 'Loading…',
  'account.notSignedIn': 'Not signed in',
  'account.signIn': 'Sign in with /login',
  'account.connected': 'Connected with MiniMax',
  'account.connectedWithWarnings': 'Connected with warnings',
  'account.unavailable': 'MiniMax account unavailable',
  'account.loadingBadge': 'Loading account…',
  'account.footer': 'Current configuration · /usage for details',
  'account.modelSource.apiKey': 'API key',
  'account.modelSource.tokenPlan': 'Token Plan',
  'account.plan.loginHint': 'Run /login to view plan and quota',

  // Model
  'model.sessionSelection': 'session selection',
  'model.configuredDefault': 'configured default',
  'model.unknownThinking': 'Unknown',
  'model.notConfigurable': 'Not configurable',
  'model.thinkingOn': 'On',
  'model.thinkingOff': 'Off',

  // Workspace
  'workspace.branch.detachedHead': 'Detached HEAD',
  'workspace.branch.unborn': 'Unborn branch',
  'workspace.branch.notGitRepository': 'Not a Git repository',
  'workspace.worktree.notApplicable': 'Not applicable',
  'workspace.worktree.linked': 'Linked',
  'workspace.worktree.primaryCheckout': 'Primary checkout',

  // Token Plan quota
  'quota.noSubscription': 'No Token Plan subscription',
  'quota.temporarilyUnavailable': 'Temporarily unavailable',
  'quota.unlimited': 'Unlimited',
  'quota.percentLeft': '{percent}% left',
  'quota.countLeft': '{count} left',
  'quota.countOfTotalLeft': '{count}/{total} left',
  'quota.resetPending': '{value} · reset pending',
  'quota.resetsIn': '{value} · resets in {duration}',

  // Runtime configuration check
  'runtime.title': 'Configuration check',
  'runtime.value.valid': 'Valid',
  'runtime.value.needsAttention': 'Needs attention',
  'runtime.currentRunImpact':
    'MCode may use built-in defaults until the config is fixed and restarted.',
  'runtime.footer': 'Read only · no files changed',
  'runtime.nextStep.createOrRestore':
    'Create or restore {path}, restart MCode, then run /doctor again.',
  'runtime.nextStep.checkAccess':
    'Check access to {path}, restart MCode, then run /doctor again.',
  'runtime.nextStep.setDefaultModel':
    'Set defaultModel in {path} to an available provider/model, restart MCode, then run /doctor again.',
  'runtime.nextStep.fixConfig': 'Fix {path}, restart MCode, then run /doctor again.',

  // Effective configuration
  'config.title': 'Effective configuration',
  'config.footer': 'Credential values are hidden',
  'config.runtimeDefault': 'Runtime default config',

  // Usage
  'usage.noAccountUsage':
    'No account usage is available. Sign in with /login to view plan and quota.',
  'usage.noSessionUsage': 'No usage has been recorded for this Session.',
  'usage.title.account': 'Account usage',
  'usage.title.session': 'Session usage',
  'usage.modelUnavailable': 'Model unavailable',

  // Context snapshot
  'context.loading': 'Context is loading. Run /context again after the active Run starts.',
  'context.unavailable': 'No Runtime context snapshot is available for this Session yet.',
  'context.staleNote': 'This snapshot belongs to the most recently completed Run.',
  'context.snapshot.mostRecentRun': 'Most recently completed Run',
  'context.snapshot.current': 'Current context',
  'context.footer.providerAnchored': 'Provider usage anchored · contents redacted',
  'context.footer.runtimeEstimate': 'Runtime estimate · contents redacted',

  // Skills
  'skills.noMatches': 'No Skills matched the current Agent configuration.',
  'skills.moreExist': 'More Skills exist; narrow the list with /skills <filter>.',

  // MCP servers
  'mcp.ownershipNote':
    'Built-in and plugin-owned MCP servers are Runtime-managed and are not included in this list.',
  'mcp.noUserServers': 'No user-configured MCP servers matched the current configuration.',
  'mcp.userServersTitle': 'User-configured MCP servers · {count}',
  'mcp.hiddenPayloads':
    'Configuration payloads and credential references are hidden. Retry the MCP operation, then run /mcp again.',

  // Pending permissions
  'permissions.noPendingRequests': 'No pending permission requests.',
  'permissions.policyOwnedByRuntime': 'Permission policy remains owned by Runtime.',
  'permissions.pendingTitle': 'Pending permissions · {count}',
  'permissions.awaitingDecision': 'Awaiting a decision',
  'permissions.chooseAction': 'Choose an action above to continue.',

  // Shared values
  'value.notSelected': 'not selected',
  'value.notConfigured': 'not configured',
  'value.unknown': 'unknown',
  'value.unavailable': 'Unavailable',
  'value.unavailableLower': 'unavailable',
  'value.notStarted': 'Not started',
  'value.untitled': 'Untitled',
  'value.configFile': 'the config file',
  'value.none': 'None',
  'value.default': 'default',
  'value.present': 'present',
  'value.missing': 'missing',
  'value.planMode': 'Plan',
  'value.defaultMode': 'Default',
  'value.nextMessage': 'next message',
  'value.submitting': 'submitting',

  // Status line
  'status.title': 'MCode status{version}',

  // Text reports
  'report.warnings': 'Warnings:',
  'context.title': 'Context',
  'context.line.snapshot': 'Context · {state}',
  'context.snapshotState.stale': 'stale snapshot',
  'context.snapshotState.live': 'live snapshot',
  'context.line.budget': 'Budget: {used} used · {remaining} · {utilization}',
  'context.budget.remaining': '{count} remaining',
  'context.line.model': 'Model: {model}',
  'context.line.compaction': 'Compaction: {state}',
  'context.componentsHeading': 'Components:',
  'context.componentLine': '- {label}: {tokens} tokens',

  // Report labels. These stay stable English identifiers inside the report
  // data because `status-visualization.ts` looks rows up by the exact string;
  // the render side turns them into display text.
  'label.account': 'Account',
  'label.model': 'Model',
  'label.workspace': 'Workspace',
  'label.session': 'Session',
  'label.sessionId': 'Session ID',
  'label.permissions': 'Permissions',
  'label.mode': 'Mode',
  'label.instructions': 'Instructions',
  'label.quota': 'Quota',
  'label.configFile': 'Config file',
  'label.issues': 'Issues',
  'label.impact': 'Impact',
  'label.nextStep': 'Next step',
  'label.location': 'Location',
  'label.credentials': 'Credentials',
  'label.runtime': 'Runtime',
  'label.budget': 'Budget',
  'label.components': 'Components',
  'label.provider': 'Provider',
  'label.auth': 'Auth',
  'label.plan': 'Plan',
  'label.modelSource': 'Model source',
  'label.thinkEffort': 'Think effort',
  'label.thinking': 'Thinking',
  'label.source': 'Source',
  'label.directory': 'Directory',
  'label.branch': 'Branch',
  'label.worktree': 'Worktree',
  'label.title': 'Title',
  'label.globalRules': 'Global rules',
  'label.projectRules': 'Project rules',
  'label.expires': 'Expires',
  'label.credits': 'Credits',
  'label.quotaFiveHour': '5-hour',
  'label.quotaWeekly': 'Weekly',
  'label.quotaVideo': 'Video',
  'label.status': 'Status',
  'label.path': 'Path',
  'label.file': 'File',
  'label.defaultModel': 'Default model',
  'label.default': 'Default',
  'label.endpoint': 'Endpoint',
  'label.issue': 'Issue',
  'label.currentRun': 'Current run',
  'label.action': 'Action',
  'label.dataDirectory': 'Data directory',
  'label.authMode': 'Auth mode',
  'label.authSource': 'Auth source',
  'label.providerApiKey': 'Provider API key',
  'label.managedCredential': 'Managed credential',
  'label.customProviders': 'Custom providers',
  'label.used': 'Used',
  'label.remaining': 'Remaining',
  'label.utilization': 'Utilization',
  'label.window': 'Window',
  'label.compaction': 'Compaction',
  'label.snapshot': 'Snapshot',
  'label.systemPrompt': 'System prompt',
  'label.memory': 'Memory',
  'label.tools': 'Tools',
  'label.skills': 'Skills',
  'label.messages': 'Messages',
  'label.other': 'Other',
} as const;

/** Every key the inspection panels catalog defines. */
export type InspectionCopyKey = keyof typeof EN_INSPECTION_COPY;
