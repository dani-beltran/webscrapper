/**
 * Custom error class thrown when a redirect is detected and the matching followPermanentRedirect/followTemporaryRedirect option is false
 */
export declare class RedirectError extends Error {
  name: 'RedirectError';
  redirect: true;
  status: number;
  location: string;
  originalUrl: string;
  timestamp: string;
  
  constructor(status: number, location: string, originalUrl: string);
}
