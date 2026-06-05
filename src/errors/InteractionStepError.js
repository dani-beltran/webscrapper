/**
 * Custom error class for required interaction step failures
 */
export class InteractionStepError extends Error {
  constructor(stepIndex, event, target, url, cause) {
    const eventName = event || 'unknown';
    const targetSelector = target || 'unknown';
    const causeMessage = cause?.message || 'Unknown interaction failure';
    super(`Interaction step ${stepIndex} failed (${eventName} on "${targetSelector}"): ${causeMessage}`);
    this.name = 'InteractionStepError';
    this.stepIndex = stepIndex;
    this.event = eventName;
    this.target = targetSelector;
    this.url = url;
    this.timestamp = new Date().toISOString();
    this.cause = cause;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, InteractionStepError);
    }
  }
}
