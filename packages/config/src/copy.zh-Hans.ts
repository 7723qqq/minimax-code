import type { ConfigTranslations } from './copy.en.js';

/**
 * Simplified Chinese copy for the configuration package.
 *
 * The `satisfies` clause is the completeness check: a key present in the
 * English catalog but absent here fails `pnpm typecheck`.
 */
export const ZH_HANS_CONFIG_COPY = {
  'skillEvolve.lifecycle.invalid':
    'skillEvolve.lifecycle 配置无效：staleThresholdDays（{staleThresholdDays}）必须严格小于 archiveThresholdDays（{archiveThresholdDays}）。',
  'config.statusLine.saveFailed': '无法保存状态栏设置。请检查 config.yaml 语法和文件权限。',
  'provider.authMode.unknown': '未知的 provider authMode "{value}"，已回退到兼容解析。',
} as const satisfies ConfigTranslations;
