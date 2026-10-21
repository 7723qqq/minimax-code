/**
 * English copy for the TUI runtime layer.
 *
 * The English object is the only source of truth for key shape: the zh-Hans
 * catalog is typed against it, so a missing translation is a compile error
 * rather than an empty line in the interface.
 */
export const EN_TUI_RUNTIME_COPY = {
  'runtime.preview.binaryOmitted': 'Binary content cannot be previewed safely.',
  'runtime.preview.tooLarge': 'File preview omitted because it is {size}.',
  'runtime.browser.restoredTabRecovery':
    'Inspect the restored tab before continuing so its current page state is explicit.',
  'runtime.browser.relatedPageMissing':
    'The click did not open the expected related Browser page.',
  'runtime.browser.relatedPageRecovery':
    'Inspect the current page before deciding whether to retry.',
  'runtime.browser.tabLimit':
    'Headless Browser preserves at most {n} previous tabs per session; the related popup was closed',
} as const;

/** Every key the TUI runtime catalog defines. */
export type TuiRuntimeCopyKey = keyof typeof EN_TUI_RUNTIME_COPY;
