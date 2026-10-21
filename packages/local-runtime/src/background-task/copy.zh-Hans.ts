import type { BackgroundTaskCopyKey } from './copy.en.js';

/**
 * Simplified Chinese copy for the background-task lifecycle surfaces.
 *
 * The `satisfies` clause is the completeness check: a key present in the
 * English catalog but absent here fails `pnpm typecheck`.
 *
 * `Runtime` and `Turn` stay in English because they are product names; the
 * `{status}` placeholder carries a machine status token and is never
 * translated.
 */
export const ZH_HANS_BACKGROUND_TASK_COPY = {
  'task.failed': '后台任务失败：{message}',
  'task.statusLine': '\n\n[{status}] {message}',
  'task.incomplete': '本地后台任务未完成。',
  'task.restartedBeforeCompleted': '本地 Runtime 在任务完成前已重启。',
  'turn.restartedBeforeCompleted': '本地 Runtime 在当前 Turn 完成前已重启。',
} as const satisfies Readonly<Record<BackgroundTaskCopyKey, string>>;
