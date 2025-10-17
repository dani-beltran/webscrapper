// Main type definitions for the Web Scraper package
export { WebScraper } from './scraper.js';
export type {
  WebScraperOptions,
  ScrapeTextResult,
  ScrapeStructuredResult,
  ScrapeErrorResult,
  LinkData,
  ListData,
  StructuredData,
  SectionData
} from './scraper.js';

export { BulkScraper } from './bulk-scraper.js';
export type {
  BulkScraperOptions,
  BulkScrapeOptions
} from './bulk-scraper.js';

export { ConfigurableScraper } from './configurable-scraper.js';
export type {
  ScraperConfig
} from './configurable-scraper.js';
