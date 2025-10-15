import { WebScraper, WebScraperOptions, ScrapeTextResult, ScrapeStructuredResult, ScrapeErrorResult, ScrapeTextStructuredOptions } from './scraper.js';

export interface ScraperConfig {
  defaultOptions: WebScraperOptions;
  presets: {
    [key: string]: WebScraperOptions;
  };
}

export declare class ConfigurableScraper {
  config: ScraperConfig;
  scraper: WebScraper;
  preset: string | null;

  constructor(preset?: string | null, customOptions?: WebScraperOptions);

  loadConfig(): ScraperConfig;

  scrapeText(url: string): Promise<ScrapeTextResult>;

  scrapeTextStructured(url: string, options?: ScrapeTextStructuredOptions): Promise<ScrapeStructuredResult>;

  scrapeMultiplePages(
    urls: string[],
    structured?: boolean,
    options?: ScrapeTextStructuredOptions
  ): Promise<Array<ScrapeTextResult | ScrapeStructuredResult | ScrapeErrorResult>>;

  close(): Promise<void>;

  static listPresets(): string[];

  static getPresetConfig(presetName: string): WebScraperOptions | null;
}
