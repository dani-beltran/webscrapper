import { WebScraper, WebScraperOptions, ScrapeTextResult, ScrapeStructuredResult, ScrapeErrorResult } from './scraper.js';

export interface BulkScraperOptions extends WebScraperOptions {
  outputDir?: string;
}

export interface BulkScrapeOptions {
  structured?: boolean;
  outputFormat?: 'json' | 'txt' | 'csv';
  outputFile?: string | null;
  batchSize?: number;
  delay?: number;
  groupBy?: string | null;
}

export declare class BulkScraper {
  scraper: WebScraper;
  outputDir: string;

  constructor(options?: BulkScraperOptions);

  scrapeUrlsFromFile(filePath: string): Promise<Array<ScrapeTextResult | ScrapeStructuredResult | ScrapeErrorResult>>;

  scrapeUrls(
    urls: string[],
    options?: BulkScrapeOptions
  ): Promise<Array<ScrapeTextResult | ScrapeStructuredResult | ScrapeErrorResult>>;

  saveResults(
    results: Array<ScrapeTextResult | ScrapeStructuredResult | ScrapeErrorResult>,
    filename: string,
    format: 'json' | 'txt' | 'csv'
  ): Promise<void>;

  extractTextFromStructured(result: ScrapeStructuredResult): string;

  resultsToCSV(results: Array<ScrapeTextResult | ScrapeStructuredResult | ScrapeErrorResult>): string;
}
