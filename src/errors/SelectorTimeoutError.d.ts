/**
 * Custom error class for selector timeout
 * Thrown when a selector times out while waiting
 */
export declare class SelectorTimeoutError extends Error {
  name: 'SelectorTimeoutError';
  selectors: string | string[];
  url: string;
  timestamp: string;
  
  constructor(selectors: string | string[], url: string);
}
