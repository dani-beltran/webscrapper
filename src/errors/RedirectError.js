/**
 * Custom error class for redirect detection
 * Thrown when a redirect is detected with followRedirects: false
 */
export class RedirectError extends Error {
  constructor(status, location, originalUrl) {
    super(`Redirection is disallowed. Redirect detected (${status}) to: ${location}`);
    this.name = 'RedirectError';
    this.redirect = true;
    this.status = status;
    this.location = location;
    this.originalUrl = originalUrl;
    this.timestamp = new Date().toISOString();
    
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, RedirectError);
    }
  }
}
