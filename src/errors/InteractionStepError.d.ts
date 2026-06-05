/**
 * Custom error class for required interaction step failures
 */
export declare class InteractionStepError extends Error {
  name: 'InteractionStepError';
  stepIndex: number;
  event: string;
  target: string;
  url: string;
  timestamp: string;
  cause: Error | unknown;

  constructor(stepIndex: number, event: string, target: string, url: string, cause: Error | unknown);
}
