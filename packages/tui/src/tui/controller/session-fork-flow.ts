import { randomUUID } from 'node:crypto';

import { controllerText } from './copy.js';
import type {
  TuiMessage,
  TuiSession,
  TuiSessionForkPort,
  TuiSessionPort,
} from '../../runtime/port.js';

const FORK_HISTORY_PAGE_SIZE = 100;
const MAX_FORK_HISTORY_PAGES = 100;

type SessionForkRuntime = Pick<TuiSessionPort, 'listMessagePage'> & Partial<TuiSessionForkPort>;

export interface TuiSessionForkFlowOptions {
  readonly runtime: SessionForkRuntime;
  readonly currentSession: () => TuiSession | undefined;
  readonly isSessionIdle: () => boolean;
  readonly onOpenSession: (sessionId: string) => Promise<void>;
  readonly createRequestId?: () => string;
  readonly isStopped?: () => boolean;
}

export class TuiSessionForkFlow {
  private forking = false;

  constructor(private readonly options: TuiSessionForkFlowOptions) {}

  async forkFromUserMessage(userMessageId: string): Promise<void> {
    if (this.forking) throw new Error(controllerText('session.fork.alreadyInProgress'));
    const source = this.options.currentSession();
    if (!source) throw new Error(controllerText('session.fork.needsSession'));
    if (!this.options.isSessionIdle()) {
      throw new Error(controllerText('session.fork.waitForTurn'));
    }
    const getOptions = this.options.runtime.getSessionForkOptions;
    const forkSession = this.options.runtime.forkSession;
    if (!getOptions || !forkSession) {
      throw new Error(controllerText('session.fork.unavailable'));
    }

    this.forking = true;
    try {
      const assistantMessageId = await this.findForkBoundary(source.sessionId, userMessageId);
      const forkOptions = await getOptions.call(
        this.options.runtime,
        source.sessionId,
        assistantMessageId,
      );
      this.requireCurrentSource(source.sessionId);
      if (!forkOptions.canFork) {
        throw new Error(
          forkOptions.unavailableReason
            ? controllerText('session.fork.cannotForkWithReason', {
                reason: forkOptions.unavailableReason,
              })
            : controllerText('session.fork.cannotFork'),
        );
      }
      const result = await forkSession.call(this.options.runtime, {
        sessionId: source.sessionId,
        assistantMessageId,
        clientRequestId: (this.options.createRequestId ?? randomUUID)(),
        useSuggestedTitle: true,
        createIsolatedWorktree: false,
      });
      this.requireCurrentSource(source.sessionId);
      await this.options.onOpenSession(result.session.sessionId);
    } finally {
      this.forking = false;
    }
  }

  private async findForkBoundary(sessionId: string, userMessageId: string): Promise<string> {
    let messages: TuiMessage[] = [];
    let before: string | undefined;
    const seenCursors = new Set<string>();
    for (let pageNumber = 0; pageNumber < MAX_FORK_HISTORY_PAGES; pageNumber += 1) {
      const page = await this.options.runtime.listMessagePage(sessionId, {
        limit: FORK_HISTORY_PAGE_SIZE,
        ...(before ? { before } : {}),
      });
      messages = mergeHistoryPage(page.messages, messages);
      const boundary = findForkableAssistant(messages, userMessageId);
      if (boundary) return boundary;
      if (!page.hasMore || !page.nextCursor || seenCursors.has(page.nextCursor)) break;
      seenCursors.add(page.nextCursor);
      before = page.nextCursor;
    }
    if (!messages.some((message) => message.id === userMessageId)) {
      throw new Error(controllerText('session.fork.promptGone'));
    }
    throw new Error(controllerText('session.fork.noAssistantBoundary'));
  }

  private requireCurrentSource(sessionId: string): void {
    if (this.options.isStopped?.()) throw new Error(controllerText('session.fork.uiClosed'));
    if (this.options.currentSession()?.sessionId !== sessionId) {
      throw new Error(controllerText('session.fork.sessionChanged'));
    }
  }
}

function mergeHistoryPage(
  older: readonly TuiMessage[],
  newer: readonly TuiMessage[],
): TuiMessage[] {
  const seen = new Set<string>();
  return [...older, ...newer].filter((message) => {
    if (!message.id || !seen.has(message.id)) {
      if (message.id) seen.add(message.id);
      return true;
    }
    return false;
  });
}

function findForkableAssistant(
  messages: readonly TuiMessage[],
  userMessageId: string,
): string | undefined {
  const userIndex = messages.findIndex(
    (message) => message.id === userMessageId && message.role === 'user',
  );
  if (userIndex < 0) return undefined;
  for (let index = userIndex + 1; index < messages.length; index += 1) {
    const message = messages[index];
    if (!message) continue;
    if (message.role === 'user') return undefined;
    if (message.role === 'assistant' && message.id && message.actions?.fork === true) {
      return message.id;
    }
  }
  return undefined;
}
