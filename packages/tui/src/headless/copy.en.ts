/**
 * English copy for the headless `mcode exec` surface.
 *
 * The English object is the only source of truth for key shape: the zh-Hans
 * catalog is typed against it, so a missing translation is a compile error
 * rather than an empty line in the terminal.
 */
export const EN_HEADLESS_COPY = {
  'headless.error.runFailed': 'The run failed: {reason}. Retry after the connection recovers.',
  'headless.error.runFailedWithReason':
    'The run failed{reason}. Retry after the connection recovers.',
  'headless.error.internalError':
    'MCode encountered an internal error: {reason}. Retry; if it keeps happening, report it through an available support channel.',
  'headless.error.internalErrorWithReason':
    'MCode encountered an internal error{reason}. Retry; if it keeps happening, report it through an available support channel.',
  'headless.error.timedOut': 'The run timed out. Increase --timeout or retry.',
  'headless.error.stepLimit':
    'The run reached its step limit. Increase --max-steps or narrow the task.',
  'headless.error.cancelled': 'The run was cancelled.',
  'headless.error.configuration':
    'The run could not start with the current configuration{reason}. Open MCode and run /doctor.',
  'headless.contract.outputEmpty': 'Structured output was empty.',
  'headless.contract.outputInvalidJson': 'Structured output was not valid JSON.',
  'headless.contract.outputSchemaMismatch':
    'Structured output did not match --output-schema: {errors}',
  'headless.contract.interactionUnavailable':
    'The Runtime requested interaction from a non-interactive Exec host.',
  'headless.runner.shutdownIncomplete': 'Runtime shutdown did not complete cleanly.',
  'headless.runner.shutdownFailed': 'mcode exec shutdown failed.',
  'headless.runner.shutdownNextStep': 'Verify no process is still running.',
  'headless.runner.reviewResultMissing':
    'Runtime completed without a validated code review result.',
  'headless.runner.reviewResultInvalid': 'Runtime returned an invalid code review result.',
  'headless.output.pipeClosed': 'stdout pipe was closed.',
  'headless.output.writerFailed': 'stdout writer failed.',
} as const;

/** Every key the headless catalog defines. */
export type HeadlessCopyKey = keyof typeof EN_HEADLESS_COPY;
