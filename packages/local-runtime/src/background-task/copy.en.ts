/**
 * English copy for the background-task lifecycle surfaces.
 *
 * The task terminal projection, the startup recovery notice and the stale-turn
 * notice were hard-coded English, so a Chinese deployment read English task
 * output. This catalog is the source of truth for the key shape; the zh-Hans
 * translation is typed with `satisfies`, so a missing translation is a compile
 * error rather than a blank message at runtime.
 */
export const EN_BACKGROUND_TASK_COPY = {
  'task.failed': 'Background task failed: {message}',
  'task.statusLine': '\n\n[{status}] {message}',
  'task.incomplete': 'Local background task did not complete.',
  'task.restartedBeforeCompleted': 'Local runtime restarted before task completed',
  'turn.restartedBeforeCompleted': 'Local runtime restarted before this turn completed.',
} as const;

/** Key type of the background-task copy catalog. */
export type BackgroundTaskCopyKey = keyof typeof EN_BACKGROUND_TASK_COPY;
