import type { ModelCopyKey } from './copy.en.js';

/**
 * Simplified Chinese copy for the model picker.
 *
 * The `satisfies` clause is the completeness check: a key present in the
 * English catalog but absent here fails `pnpm typecheck`.
 */
export const ZH_HANS_MODEL_COPY = {
  noMatchingModels: '没有匹配的模型',
  favoritesUpdateFailed: '无法更新收藏，按 ctrl+s 重试。',
  availableModels: '可用模型',
  higherContextUsage: '该上下文窗口的用量更高。',
  addProviderDescription: '配置 API Key 供应商并添加其模型',
  unknownProvider: '未知供应商',
  thinkEffort: '思考强度',
  oauthCredentialsReady: 'OAuth 凭据已就绪',
  reopenBrowserSignIn: '重新打开浏览器登录',
  previousSignInFailed: '上次登录失败',
  signInWithOpenAiOauth: '使用 OpenAI OAuth 登录',
  loginRequired: '需要登录',
  deleteProviderTitle: '删除供应商？',
  deleteProviderFooter: 'Enter 删除供应商 · Esc 取消',
  deletingProvider: '正在删除供应商…',
  deleteProviderRetry: '重试，或按 Esc 取消。',
  deleteProviderUnchanged: '供应商及其模型保持不变。',
  deleteProviderModels: '将删除其已保存的凭据和全部 {count} 个已配置模型。',
  hintEffort: '↑↓ 选择 · 输入搜索 · ←/→ 强度 · enter 应用{context}{delete} · esc 取消',
  hintThinking: '↑↓ 选择 · 输入搜索 · ←/→ 思考 · enter 应用{context}{delete} · esc 取消',
  hintPlain: '↑↓ 选择 · 输入搜索 · enter 应用{context}{delete} · esc 取消',
  hintContext: ' · tab 上下文',
  hintFavorite: ' · ctrl+s 收藏',
  hintUnfavorite: ' · ctrl+s 取消收藏',
  hintDeleteProvider: ' · ctrl+d 删除供应商',
} as const satisfies Readonly<Record<ModelCopyKey, string>>;
