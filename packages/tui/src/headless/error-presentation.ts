import { tuiErrorDiagnostic } from '../user-facing-failure.js';
import { headlessText } from './copy.js';
import type { ExecResult } from './contract.js';
import { TuiExecError } from './exit-policy.js';

export function formatTuiExecFailure(error: TuiExecError): string {
  if (
    error.kind === 'invocation' ||
    error.kind === 'config' ||
    error.kind === 'cancelled' ||
    error.kind === 'brokenPipe'
  ) {
    return tuiErrorDiagnostic(error);
  }
  if (error.kind === 'runtime') {
    return headlessText('headless.error.runFailed', { reason: tuiErrorDiagnostic(error) });
  }
  return headlessText('headless.error.internalError', { reason: tuiErrorDiagnostic(error) });
}

export function formatTuiExecResultFailure(result: ExecResult): string {
  if (result.status === 'timeout') {
    return headlessText('headless.error.timedOut');
  }
  if (result.status === 'limit_exceeded') {
    return headlessText('headless.error.stepLimit');
  }
  if (result.status === 'cancelled') return headlessText('headless.error.cancelled');
  if (result.error?.category === 'config') {
    const reason = result.error.message ? `: ${tuiErrorDiagnostic(result.error.message)}` : '';
    return headlessText('headless.error.configuration', { reason });
  }
  if (result.error?.category === 'internal') {
    const reason = result.error.message ? `: ${tuiErrorDiagnostic(result.error.message)}` : '';
    return headlessText('headless.error.internalErrorWithReason', { reason });
  }
  const reason = result.error?.message ? `: ${tuiErrorDiagnostic(result.error.message)}` : '';
  return headlessText('headless.error.runFailedWithReason', { reason });
}
