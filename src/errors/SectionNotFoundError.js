/**
 * Custom error class for section selector not found
 * Thrown when no sections are found with the provided selectors
 */
export class SectionNotFoundError extends Error {
  constructor(selectors, url, bodyText) {
    const selectorList = Array.isArray(selectors) ? selectors.join(', ') : selectors;
    super(`No sections found with selectors: ${selectorList}`);
    this.name = 'SectionNotFoundError';
    this.selectors = selectors;
    this.url = url;
    this.bodyText = bodyText;
    this.timestamp = new Date().toISOString();
    
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, SectionNotFoundError);
    }
  }
}