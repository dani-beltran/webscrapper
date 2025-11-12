/**
 * Custom error class for selector timeout
 * Thrown when a selector times out while waiting
 */
export class SelectorTimeoutError extends Error {
  constructor(selectors, url) {
    const selectorList = Array.isArray(selectors) ? selectors.join(', ') : selectors;
    super(`Timeout waiting for selector(s): ${selectorList}`);
    this.name = 'SelectorTimeoutError';
    this.selectors = selectors;
    this.url = url;
    this.timestamp = new Date().toISOString();
    
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, SelectorTimeoutError);
    }
  }
}
