import type { TuiPendingPermission } from '../../runtime/port.js';
import { sanitizeTerminalText } from '../rendering/terminal-text.js';
import { controllerInteractionText } from '../controller/interaction/copy.js';

export function formatPermissionRequest(request: TuiPendingPermission): string {
  const summary = request.reason ?? request.toolDescription ?? request.toolInput;
  return summary
    ? sanitizeTerminalText(summary).trim()
    : controllerInteractionText('permission.requestReviewAction');
}

export function formatPermissionResolution(
  request: TuiPendingPermission,
  decision: 'allowOnce' | 'allowAlways' | 'deny',
): string {
  const tool = sanitizeTerminalText(
    request.toolName ?? controllerInteractionText('permission.unknownTool'),
  );
  if (decision === 'allowAlways') {
    return controllerInteractionText('permission.resolutionSaved', { tool });
  }
  if (decision === 'deny') {
    return controllerInteractionText('permission.resolutionDenied', { tool });
  }
  return controllerInteractionText('permission.resolutionAllowed', { tool });
}
