/**
 * English copy for the TUI application layer.
 *
 * The English object is the only source of truth for key shape: the zh-Hans
 * catalog is typed against it, so a missing translation is a compile error
 * rather than an empty line in the interface.
 */
export const EN_APPLICATION_COPY = {
  'application.run.noFinalResponse': 'Runtime completed without a final assistant response.',
  'application.login.required':
    'Sign in to MiniMax to use Agent features. Run /login, then retry.',
  'application.login.requiredHeadless':
    'Sign in to MiniMax to use Agent features. Run `mcode login`, then retry.',
  'application.run.automationPublishFailed': 'Could not publish the TUI automation result.',
  'application.run.questionnaireRequiresInput': 'Questionnaire requires user input.',
  'application.run.contentReviewBlocked': 'Content review blocked the request.',
  'app.turnFailed': 'Runtime turn failed.',
  'application.content.interactiveLoading': 'Interactive content is loading…',
  'application.content.interactiveKindTitle':
    'Interactive {kind}: {title} (open in Desktop).',
  'application.content.interactiveTitle': 'Interactive content: {title} (open in Desktop).',
  'application.content.interactiveAvailable': 'Interactive content available in Desktop.',
  'application.content.mcpAuthorizationRequired':
    'MCP authorization required: {reason} (open in Desktop).',
  'application.content.mcpAuthorizationRequiredWithoutReason':
    'MCP authorization required (open in Desktop).',
  'application.content.teamRecommendationAccepted': 'Team recommendation accepted.',
  'application.content.teamRecommendationSkipped': 'Team recommendation skipped.',
  'application.content.teamRecommendationAvailable':
    'Team recommendation available in Desktop.',
  'application.goal.badBudgetValue':
    'Bad budget value: use a positive integer, K/M suffix, or \'clear\' (got "{rawBudget}").',
  'application.goal.duplicateBudget':
    'budget= is specified more than once: keep a single budget={value}.',
} as const;

/** Every key the TUI application catalog defines. */
export type ApplicationCopyKey = keyof typeof EN_APPLICATION_COPY;
