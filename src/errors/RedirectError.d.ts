/**
 * Custom error class thrown when a redirect is detected with followRedirects: false
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
