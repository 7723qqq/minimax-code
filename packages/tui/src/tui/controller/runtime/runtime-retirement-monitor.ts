import { formatTuiActionFailure } from '../../../user-facing-failure.js';
import { controllerText } from '../copy.js';

const DEFAULT_RETIREMENT_WARNING_TIMEOUT_MS = 5_000;

interface TuiRetirementStatePatch {
  readonly status?: 'idle' | 'error';
  readonly retiringTurnId?: undefined;
  readonly error?: string | undefined;
}

export interface TuiRuntimeRetirementMonitorOptions {
  readonly turnId: string;
  readonly retirement: Promise<boolean>;
  readonly timeoutMs?: number;
  readonly currentTurnId: () => string | undefined;
  readonly apply: (patch: TuiRetirementStatePatch) => void;
  readonly onSettled: () => void;
}

export function monitorTuiRuntimeRetirement(options: TuiRuntimeRetirementMonitorOptions): void {
  const timeoutMessage = controllerText('runtime.retirement.timeout');
  let timeoutShown = false;
  const timeout = setTimeout(
    () => {
      if (options.currentTurnId() !== options.turnId) return;
      timeoutShown = true;
      options.apply({ status: 'error', error: timeoutMessage });
    },
    Math.max(0, options.timeoutMs ?? DEFAULT_RETIREMENT_WARNING_TIMEOUT_MS),
  );
  timeout.unref?.();

  void options.retirement.then(
    (released) => {
      clearTimeout(timeout);
      if (options.currentTurnId() !== options.turnId) return;
      options.apply({
        retiringTurnId: undefined,
        ...(released
          ? timeoutShown
            ? { status: 'idle', error: undefined }
            : {}
          : {
              status: 'error',
              error: controllerText('runtime.retirement.notConfirmed'),
            }),
      });
      options.onSettled();
    },
    (error: unknown) => {
      clearTimeout(timeout);
      if (options.currentTurnId() !== options.turnId) return;
      options.apply({
        status: 'error',
        retiringTurnId: undefined,
        error: formatTuiActionFailure(error, {
          summary: controllerText('runtime.retirement.confirmFailed'),
          nextStep: controllerText('common.retryEsc'),
          preservation: controllerText('runtime.retirement.messagesBlocked'),
        }),
      });
      options.onSettled();
    },
  );
}
