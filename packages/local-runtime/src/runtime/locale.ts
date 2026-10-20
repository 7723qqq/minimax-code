/**
 * Host locale for local-runtime.
 *
 * Resolution (explicit override, Desktop handshake, `Intl`, environment) lives
 * in `@mavis/shared/i18n`. This wrapper keeps the module path and the exported
 * name that existing callers import.
 */
import { resolveLocale } from '@mavis/shared/i18n';

export function resolveLocalRuntimeLocale(): string {
  return resolveLocale();
}
