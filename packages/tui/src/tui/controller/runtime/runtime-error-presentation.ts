import {
  classifyLLMRequestRejectionMessage,
  LLM_ERROR_CODES,
} from '@mavis/shared/llm-error-classifier';
import { tuiErrorDiagnostic } from '../../../user-facing-failure.js';
import { controllerText } from '../copy.js';

const AUTH_ERROR_CODES = new Set<number>([401, LLM_ERROR_CODES.LLM_AUTH_ERROR]);
const RATE_LIMIT_ERROR_CODES = new Set<number>([
  429,
  LLM_ERROR_CODES.LLM_RATE_LIMITED,
  LLM_ERROR_CODES.LLM_TPM_RATE_LIMITED,
]);
const QUOTA_ERROR_CODES = new Set<number>([
  402,
  LLM_ERROR_CODES.USAGE_LIMIT_EXCEEDED,
  LLM_ERROR_CODES.LLM_CREDITS_EXHAUSTED,
]);
const PROVIDER_RETRY_ERROR_CODES = new Set<number>([
  LLM_ERROR_CODES.LLM_UPSTREAM_ERROR,
  LLM_ERROR_CODES.LLM_CLUSTER_OVERLOADED,
]);
const FORCE_RETRY_ERROR_CODES = new Set<number>([
  50_001,
  LLM_ERROR_CODES.LLM_RATE_LIMITED,
  LLM_ERROR_CODES.LLM_UPSTREAM_ERROR,
  LLM_ERROR_CODES.LLM_TPM_RATE_LIMITED,
  LLM_ERROR_CODES.LLM_CLUSTER_OVERLOADED,
]);
const CONTENT_SAFETY_ERROR_CODES = new Set<number>([50_200, 50_201]);

export interface TuiRuntimeFailurePresentation {
  readonly content: string;
  readonly retryable: boolean;
}

export interface TuiRuntimeFailureMetadata {
  readonly retryable?: boolean;
  readonly errorSource?: string;
  readonly errorDetail?: string;
  readonly errorProviderId?: string;
}

export function formatTuiRuntimeFailure(
  rawMessage: string | undefined,
  errorCode?: number,
  metadata: TuiRuntimeFailureMetadata = {},
): string {
  return resolveTuiRuntimeFailure(rawMessage, errorCode, metadata).content;
}

export function resolveTuiRuntimeFailure(
  rawMessage: string | undefined,
  errorCode?: number,
  metadata: TuiRuntimeFailureMetadata = {},
): TuiRuntimeFailurePresentation {
  const message = rawMessage?.trim();
  const detail = runtimeFailureDetail(message, metadata.errorDetail);
  const provider = runtimeFailureProvider(metadata);
  const diagnostics = `${detail}${provider}`;
  const code =
    errorCode === undefined
      ? ''
      : controllerText('runtime.error.codeDetail', { code: String(errorCode) });
  const retryable =
    (errorCode !== undefined && FORCE_RETRY_ERROR_CODES.has(errorCode)) ||
    metadata.retryable !== false;
  if (errorCode === 403) {
    return {
      content: controllerText('runtime.error.accessDenied', { diagnostics, code }),
      retryable: false,
    };
  }
  if (
    (errorCode !== undefined && AUTH_ERROR_CODES.has(errorCode)) ||
    (errorCode === undefined &&
      message &&
      /\b(?:auth(?:entication|orization)?|credentials?)\b.*\b(?:expired|failed|invalid|required|missing)\b/iu.test(
        message,
      ))
  ) {
    return {
      content:
        metadata.errorSource === 'byok_upstream'
          ? controllerText('runtime.error.credentialsRejected', { diagnostics, code })
          : controllerText('runtime.error.authRejected', { diagnostics, code }),
      retryable: false,
    };
  }
  const rejection = requestRejection(message, metadata.errorDetail);
  if (rejection) {
    // Deterministic provider rejections (#425): the same history fails the
    // same way on every resend, so /retry is never the next step. Show the
    // upstream reason, which the generic branches below would hide.
    const reasonLine = rejection.reason
      ? controllerText('runtime.error.reasonDetail', { reason: rejection.reason })
      : '';
    return {
      content:
        rejection.kind === 'image_limit'
          ? controllerText('runtime.error.imageLimit', { reason: reasonLine, provider, code })
          : controllerText('runtime.error.invalidRequest', {
              reason: reasonLine,
              provider,
              code,
            }),
      retryable: false,
    };
  }
  if (
    (errorCode !== undefined && RATE_LIMIT_ERROR_CODES.has(errorCode)) ||
    (message && /\b(?:rate.?limit(?:ed)?|too many requests|HTTP\s*429)\b/iu.test(message))
  ) {
    return {
      content: retryable
        ? controllerText('runtime.error.rateLimitedRetryable', { diagnostics, code })
        : controllerText('runtime.error.rateLimitedFinal', { diagnostics, code }),
      retryable,
    };
  }
  if (errorCode !== undefined && QUOTA_ERROR_CODES.has(errorCode)) {
    return {
      content: controllerText('runtime.error.usageLimit', { diagnostics, code }),
      retryable: false,
    };
  }
  if (
    message &&
    /\b(?:usage limit|credits? exhausted|insufficient (?:credits?|balance))\b/iu.test(message)
  ) {
    return {
      content: controllerText('runtime.error.usageLimit', { diagnostics, code }),
      retryable: false,
    };
  }
  if (errorCode !== undefined && PROVIDER_RETRY_ERROR_CODES.has(errorCode)) {
    return {
      content: retryable
        ? controllerText('runtime.error.providerUnavailableRetryable', { diagnostics, code })
        : controllerText('runtime.error.providerUnavailableFinal', { diagnostics, code }),
      retryable,
    };
  }
  if (message && /\b(?:provider|model)\b.*\bunavailable\b/iu.test(message)) {
    return {
      content: retryable
        ? controllerText('runtime.error.providerUnavailableRetryable', { diagnostics, code })
        : controllerText('runtime.error.providerUnavailableFinal', { diagnostics, code }),
      retryable,
    };
  }
  if (message && /^(?:terminated|connection (?:closed|terminated))\.?$/iu.test(message)) {
    return {
      content: retryable
        ? controllerText('runtime.error.connectionEndedRetryable', { diagnostics, code })
        : controllerText('runtime.error.connectionEndedFinal', { diagnostics, code }),
      retryable,
    };
  }
  if (
    (errorCode !== undefined && CONTENT_SAFETY_ERROR_CODES.has(errorCode)) ||
    (message && /\b(?:content (?:filter|review)|safety|policy violation)\b/iu.test(message))
  ) {
    return {
      content: controllerText('runtime.error.contentSafety', { diagnostics, code }),
      retryable: false,
    };
  }
  if (errorCode === LLM_ERROR_CODES.LLM_MIGRATION_ERROR) {
    return {
      content: controllerText('runtime.error.modelTimeout', { diagnostics, code }),
      retryable: false,
    };
  }
  const reason = metadata.errorDetail ?? message;
  const diagnostic = reason ? tuiErrorDiagnostic(reason) : undefined;
  return {
    content: diagnostic
      ? retryable
        ? controllerText('runtime.error.responseFailedWithReasonRetryable', {
            reason: diagnostic,
            provider,
            code,
          })
        : controllerText('runtime.error.responseFailedWithReasonFinal', {
            reason: diagnostic,
            provider,
            code,
          })
      : retryable
        ? controllerText('runtime.error.responseFailedRetryable', { provider, code })
        : controllerText('runtime.error.responseFailedFinal', { provider, code }),
    retryable,
  };
}

const BYOK_UPSTREAM_PREFIX_RE = /^BYOK provider .+? upstream error:\s*/u;

function requestRejection(
  message: string | undefined,
  rawDetail: string | undefined,
): { readonly kind: 'image_limit' | 'invalid_request'; readonly reason: string } | undefined {
  for (const candidate of [rawDetail, message]) {
    const kind = classifyLLMRequestRejectionMessage(candidate);
    if (!kind || !candidate) continue;
    return { kind, reason: tuiErrorDiagnostic(candidate.replace(BYOK_UPSTREAM_PREFIX_RE, '')) };
  }
  return undefined;
}

function runtimeFailureDetail(message: string | undefined, rawDetail: string | undefined): string {
  const detail = rawDetail ? tuiErrorDiagnostic(rawDetail) : '';
  return detail && detail !== message
    ? controllerText('runtime.error.reasonDetail', { reason: detail })
    : '';
}

function runtimeFailureProvider(metadata: TuiRuntimeFailureMetadata): string {
  if (metadata.errorSource !== 'byok_upstream') return '';
  const providerId = metadata.errorProviderId
    ? tuiErrorDiagnostic(metadata.errorProviderId)
    : controllerText('runtime.error.providerConfigured');
  return controllerText('runtime.error.providerDetail', { provider: providerId });
}
