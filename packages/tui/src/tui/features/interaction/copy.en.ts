/**
 * English copy for the interaction surfaces.
 *
 * The English object is the only source of truth for key shape: the Chinese
 * catalog is typed against it, so a missing translation fails `pnpm typecheck`
 * instead of rendering an empty line in the terminal.
 *
 * Keys are grouped by the panel that renders them. A sentence that appears in
 * two panels has one key, and a sentence that is assembled in code keeps its
 * `{name}` placeholder here rather than a template literal at the call site.
 */
/**
 * English copy for the permission, plan and questionnaire panels.
 *
 * The English object is the only source of truth for key shape: the zh-Hans
 * catalog is typed against it, so a missing translation is a compile error
 * rather than a blank line in the interface.
 */
export const EN_INTERACTION_COPY = {
  // Permission mode picker
  'permissionMode.description.default': 'Confirm sensitive actions',
  'permissionMode.description.auto': 'Ask only when risk is high',
  'permissionMode.description.bypassPermissions': 'Run without confirmation',
  'permissionMode.title': 'Permission',
  'permissionMode.titleWithMode': 'Permission · {mode}',
  'permissionMode.meta': 'Current · {mode}',
  'permissionMode.body.compact': 'Choose a tool access policy.',
  'permissionMode.body.wide': 'Choose how MCode handles tool access.',
  'permissionMode.footer.compact': '↑/↓ move · Enter · Esc back',
  'permissionMode.footer.wide': '↑/↓ select · Enter apply · Esc cancel',
  'permissionMode.active': '● active',

  // Permission picker
  'permission.title.applying': '◌ Applying permission…',
  'permission.title.saveRule': '◆ Save permission rule',
  'permission.title.deny': '× Deny action',
  'permission.title.approvalRequired': '◆ Approval required',
  'permission.awaitingRuntime': 'Waiting for Runtime to commit the decision.',
  'permission.alwaysAllow.question': 'Always allow matching actions?',
  'permission.alwaysAllow.description': 'Future matching actions will continue without asking.',
  'permission.deny.question': 'Deny this action?',
  'permission.deny.guidanceHint': 'Add guidance for MCode, or leave this blank.',
  'permission.prompt.runCommand': 'Run this command?',
  'permission.prompt.writeFile': 'Write this file?',
  'permission.prompt.applyEdits': 'Apply these edits?',
  'permission.prompt.deleteItem': 'Delete this item?',
  'permission.prompt.tool': 'Allow {tool}?',
  'permission.note.why': 'Why · {reason}',
  'permission.tool.unknown': 'Unknown',
  'permission.status.savingRule': 'Saving the permission rule and allowing this action…',
  'permission.status.denying': 'Denying this action…',
  'permission.status.allowing': 'Allowing for this conversation…',
  'permission.detail.alwaysAllow': 'Review the exact saved scope next',
  'permission.detail.deny': 'Add guidance before denying this action',
  'permission.detail.allowOnce': 'MCode asks again in a new conversation',
  'permission.decision.allowForConversation': '{prefix} Allow for this conversation',
  'permission.decision.allowThisConversation': '{prefix} Allow this conversation',
  'permission.decision.allowConversation': '{prefix} Allow conversation',
  'permission.decision.allow': '{prefix} Allow',
  'permission.decision.alwaysAllowMatchingActions': '{prefix} Always allow matching actions',
  'permission.decision.alwaysAllowMatching': '{prefix} Always allow matching',
  'permission.decision.alwaysAllow': '{prefix} Always allow',
  'permission.decision.denyAndGuide': '{prefix} Deny and guide MCode',
  'permission.decision.denyAndGuideShort': '{prefix} Deny and guide',
  'permission.decision.deny': '{prefix} Deny',
  'permission.footer.choose': '↑/↓ choose · Enter confirm · Esc deny · Ctrl+C stop',
  'permission.footer.chooseCompact': '↑/↓ · Enter confirm · Esc deny · Ctrl+C stop',
  'permission.footer.confirm': 'Enter confirm · Esc deny · Ctrl+C stop',
  'permission.footer.confirmCompact': 'Enter · Esc deny · Ctrl+C',
  'permission.footer.minimal': 'Enter · Esc',
  'permission.footer.alwaysSave': 'Enter save and allow · Esc go back · Ctrl+C stop',
  'permission.footer.alwaysSaveCompact': 'Enter save · Esc go back · Ctrl+C stop',
  'permission.footer.alwaysSaveShort': 'Enter save · Esc back',
  'permission.footer.deny': 'Enter deny · Esc go back · Ctrl+C stop',
  'permission.footer.denyCompact': 'Enter deny · Esc back · Ctrl+C stop',
  'permission.footer.denyShort': 'Enter deny · Esc back',
  'permission.scope.label': 'Scope',
  'permission.scope.unavailable': 'Exact saved scope is unavailable.',
  'permission.status.detailsLines': 'Details {visible} of {total} lines · {action}',
  'permission.status.detailsLinesCompact': '{visible}/{total} lines · {action}',
  'permission.status.detailsLinesTiny': '{visible}/{total} · Ctrl+E',
  'permission.status.detailsShown':
    'Details {range} of {n} shown · {total} total · PgUp/PgDn scroll · {action}',
  'permission.status.detailsShownCompact':
    '{range}/{n} shown · {total} total · PgUp/PgDn · Ctrl+E',
  'permission.status.detailsShownTiny': '{range}/{n} · PgUp/PgDn · Ctrl+E',
  'permission.status.detailsScroll': 'Details {range} of {total} · PgUp/PgDn scroll · {action}',
  'permission.status.detailsScrollPlain': 'Details {range} of {total} · PgUp/PgDn scroll',
  'permission.status.detailsScrollCompact': '{range}/{total} · PgUp/PgDn · Ctrl+E',
  'permission.status.detailsScrollCompactPlain': '{range}/{total} · PgUp/PgDn',
  'permission.status.viewport': '{label} {range} of {total} · PgUp/PgDn scroll',
  'permission.status.viewportCompact': '{label} {range}/{total} · PgUp/PgDn',
  'permission.status.viewportTiny': '{range}/{total} · PgUp/PgDn',
  'permission.action.collapse': 'Ctrl+E collapse',
  'permission.action.reviewAll': 'Ctrl+E review all',

  // Plan entry
  'planEntry.title': 'Plan mode',
  'planEntry.question': 'Use Plan mode?',
  'planEntry.description': 'Plan mode structures complex tasks before execution.',
  'planEntry.option.confirm': 'Continue with plan',
  'planEntry.option.decline': 'Deny',
  'planEntry.option.unavailable': '{label} (unavailable)',
  'planEntry.status.continuing': 'Continuing with plan…',
  'planEntry.status.keepingDefault': 'Keeping Default mode…',
  'planEntry.footer': '↑/↓ select · Enter confirm · Esc deny',

  // Plan review
  'planReview.title': 'Plan Review',
  'planReview.title.feedback': 'Add context',
  'planReview.heading': 'Plan complete. What would you like to do?',
  'planReview.meta': 'Full plan above · frozen snapshot',
  'planReview.option.approve': 'Agree and start implementation',
  'planReview.option.skip': 'Skip for now',
  'planReview.option.feedback': 'Add context to revise',
  'planReview.status.feedback': 'Sending feedback…',
  'planReview.status.skip': 'Skipping review…',
  'planReview.status.start': 'Starting implementation…',
  'planReview.feedback.hint': 'Tell MiniMax Code what to adjust, then press Enter.',
  'planReview.footer': '↑/↓ select · Enter confirm · Esc skip',
  'planReview.footer.feedback': 'Enter send · Esc back',

  // Plan viewer
  'planViewer.title': 'Latest Plan',
  'planViewer.navigation': 'Lines {a}-{b} of {n} · PgUp/PgDn scroll',
  'planViewer.footer': 'Esc close',

  // Questionnaire
  'questionnaire.title': 'Ask',
  'questionnaire.status.sending': 'Sending answers…',
  'questionnaire.status.closing': 'Closing question…',
  'questionnaire.status.answered': 'All questionnaire steps are answered.',
  'questionnaire.confirm.cancelTitle': 'Cancel this question?',
  'questionnaire.confirm.cancelDescription':
    'The pending request and its unsent answers will be discarded.',
  'questionnaire.confirm.footer': 'Enter cancel question · Esc keep answering',
  'questionnaire.savedAnswer': 'Saved answer · {rawText}',
  'questionnaire.other': 'Other…',
  'questionnaire.otherPlaceholder': 'Type another answer',
  'questionnaire.recommended': '{label} (Recommended)',
  'questionnaire.moreAbove': '… {n} more above',
  'questionnaire.moreBelow': '… {n} more below',
  'questionnaire.countdown.timeUp': 'Time is up · applying the recommended option…',
  'questionnaire.countdown.before': 'Auto-continue in ',
  'questionnaire.countdown.after': ' with the recommended option',
  'questionnaire.progress.single': '{current} of {total}',
  'questionnaire.progress.answered': '{answered}/{total} answered',
  'questionnaire.questionLabel': 'Question {index}',
  'questionnaire.action.send': 'send',
  'questionnaire.action.next': 'next',
  'questionnaire.action.back': 'back',
  'questionnaire.action.cancel': 'cancel',
  'questionnaire.footer.typeAnswer': 'Type your answer · Enter {action} · Esc {escape}',
  'questionnaire.footer.select': '↑↓ move · 1-{count} select · Enter {action}',
  'questionnaire.footer.toggle': '↑↓ move · Space toggle · Enter {action}',
  'questionnaire.footer.enterAction': 'Enter {action}',
  'questionnaire.footer.full': '{primary} · Tab/←/→ questions · Esc cancel',
  'questionnaire.footer.compact': '{primary} · Esc cancel',
  'questionnaire.footer.narrow': '{primaryAction} · Esc cancel',
  'questionnaire.footer.enterEscCancel': 'Enter · Esc cancel',
  'questionnaire.footer.enterEsc': 'Enter · Esc',

  // Notices shared by more than one interaction panel
  'waiting.commitDecision': 'Waiting for Runtime to commit the decision.',
  'waiting.continueConversation': 'Waiting for MiniMax Code to continue the conversation.',
  'waiting.dismissPending': 'Waiting for MiniMax Code to dismiss the pending request.',
} as const;

/** Every key the permission, plan and questionnaire panels catalog defines. */
export type InteractionCopyKey = keyof typeof EN_INTERACTION_COPY;
