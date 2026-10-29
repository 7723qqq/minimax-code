/**
 * Request media limits for images attached to provider requests.
 *
 * The field names mirror the published `config.yaml` surface
 * (`requestMedia.image.max_width`, …), so they intentionally stay snake_case.
 */
export const REQUEST_MEDIA_MAX_BASE64_BYTES = 5 * 1024 * 1024;

export interface RequestMediaImageConfig {
  readonly max_width: number;
  readonly max_height: number;
  readonly max_base64_bytes: number;
}

export interface RequestMediaConfig {
  readonly recoveryDivisor: number;
  readonly image: RequestMediaImageConfig;
}

export const REQUEST_MEDIA_DEFAULTS: RequestMediaConfig = {
  recoveryDivisor: 2,
  image: {
    max_width: 2_000,
    max_height: 2_000,
    max_base64_bytes: 4_718_592,
  },
};

export function parseRequestMediaConfig(value: unknown): RequestMediaConfig {
  const source = isRecord(value) ? value : {};
  const image = isRecord(source.image) ? source.image : {};
  const divisor = source.recoveryDivisor;
  return {
    recoveryDivisor:
      typeof divisor === 'number' && Number.isFinite(divisor) && divisor > 1
        ? divisor
        : REQUEST_MEDIA_DEFAULTS.recoveryDivisor,
    image: {
      max_width: positiveInteger(image.max_width) ?? REQUEST_MEDIA_DEFAULTS.image.max_width,
      max_height: positiveInteger(image.max_height) ?? REQUEST_MEDIA_DEFAULTS.image.max_height,
      max_base64_bytes: Math.min(
        positiveInteger(image.max_base64_bytes) ??
          REQUEST_MEDIA_DEFAULTS.image.max_base64_bytes,
        REQUEST_MEDIA_MAX_BASE64_BYTES,
      ),
    },
  };
}

function positiveInteger(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0
    ? value
    : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
