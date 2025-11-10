/**
 * Custom error class for section selector not found
 * Thrown when no sections are found with the provided selectors
 */
export declare class SectionNotFoundError extends Error {
  name: 'SectionNotFoundError';
  selectors: string | string[];
  url: string;
  timestamp: string;
  
  constructor(selectors: string | string[], url: string);
}