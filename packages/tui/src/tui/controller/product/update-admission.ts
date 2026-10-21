import type {
  TuiActiveRunControlPort,
  TuiInteractionPort,
  TuiQueuePort,
} from '../../../runtime/port.js';
import type { TuiChatSnapshot } from '../chat-controller.js';
import { controllerProductText } from './copy.js';

type TuiUpdateAdmissionRuntime = Pick<TuiActiveRunControlPort, 'getActiveRun'> &
  Pick<TuiQueuePort, 'listQueuedMessages'> &
  Pick<TuiInteractionPort, 'getPendingQuestionnaire' | 'listPendingPermissions'>;

export interface TuiUpdateAdmission {
  readonly allowed: boolean;
  readonly reason?: string;
}

export function createTuiUpdateAdmission(options: {
  readonly runtime: TuiUpdateAdmissionRuntime;
  readonly snapshot: () => TuiChatSnapshot;
  readonly defaultAgentName: string;
  readonly queueEnabled: boolean;
}): () => Promise<TuiUpdateAdmission> {
  return async () => {
    const chat = options.snapshot();
    const session = chat.session;
    if (!session) return { allowed: true };
    if (chat.activeTurnId || chat.cancelling || chat.retiringTurnId) {
      return {
        allowed: false,
        reason: controllerProductText('update.admission.finishOrStop'),
      };
    }
    const [activeRun, queue, questionnaire, permissions] = await Promise.allSettled([
      options.runtime.getActiveRun(session.sessionId),
      options.queueEnabled
        ? options.runtime.listQueuedMessages(session.sessionId)
        : Promise.resolve([]),
      options.runtime.getPendingQuestionnaire(
        session.agentName ?? options.defaultAgentName,
        session.sessionId,
      ),
      options.runtime.listPendingPermissions(),
    ]);
    if (
      [activeRun, queue, questionnaire, permissions].some((result) => result.status === 'rejected')
    ) {
      return {
        allowed: false,
        reason: controllerProductText('update.admission.cannotVerify'),
      };
    }
    if (
      activeRun.status === 'fulfilled' &&
      (activeRun.value.state === 'running' || activeRun.value.state === 'decision-blocked')
    ) {
      return {
        allowed: false,
        reason: controllerProductText('update.admission.finishOrStop'),
      };
    }
    if (queue.status === 'fulfilled' && queue.value.some((item) => item.status === 'queued')) {
      return {
        allowed: false,
        reason: controllerProductText('update.admission.clearQueue'),
      };
    }
    if (questionnaire.status === 'fulfilled' && questionnaire.value) {
      return {
        allowed: false,
        reason: controllerProductText('update.admission.answerQuestion'),
      };
    }
    if (
      permissions.status === 'fulfilled' &&
      permissions.value.some((permission) => permission.sessionId === session.sessionId)
    ) {
      return {
        allowed: false,
        reason: controllerProductText('update.admission.resolvePermission'),
      };
    }
    return { allowed: true };
  };
}
