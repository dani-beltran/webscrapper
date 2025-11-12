export { RedirectError } from './errors/RedirectError.js';
export { SectionNotFoundError } from './errors/SectionNotFoundError.js';
export { SelectorTimeoutError } from './errors/SelectorTimeoutError.js';

export interface WebScraperOptions {
  browser?: 'chromium' | 'firefox' | 'webkit';
  headless?: boolean;
  timeout?: number;
  sectionSelectors?: string[];
  waitForSelector?: string | null;
  excludeSelectors?: string[];
  userAgent?: string;
  followRedirects?: boolean;
}

export interface ScrapeTextResult {
  url: string;
  text: string;
  length: number;
  timestamp: string;
}

export interface LinkData {
  text: string;
  href: string;
}

export interface ListData {
  type: 'ul' | 'ol';
  items: string[];
}

export interface ImageData {
  src: string;
  alt: string;
  title: string;
}

export interface StructuredData {
  headings: {
    [key: string]: string[];
  };
  paragraphs: string[];
  otherText: string[];
  links: LinkData[];
  lists: ListData[];
  images: ImageData[];
}

export interface SectionData extends StructuredData {
  id: string;
  title: string | null;
}

export interface ScrapeStructuredResult extends Partial<StructuredData> {
  url: string;
  title: string;
  timestamp: string;
  sections?: SectionData[];
}

export interface ScrapeErrorResult {
  url: string;
  error: string;
  timestamp: string;
}

export interface ScrapeRedirectResult {
  url: string;
  redirect: true;
  status: number;
  location: string;
  message: string;
  timestamp: string;
}

export declare class WebScraper {
  options: Required<WebScraperOptions>;
  browser: any | null;
  context: any | null;

  constructor(options?: WebScraperOptions);

  init(): Promise<void>;

  /**
   * Scrape text content from a URL
   * @throws {RedirectError} When followRedirects is false and a redirect is detected
   */
  scrapeText(url: string): Promise<ScrapeTextResult>;

  /**
   * Scrape structured content from a URL
   * @throws {RedirectError} When followRedirects is false and a redirect is detected
   */
  scrapeTextStructured(url: string): Promise<ScrapeStructuredResult>;

  /**
   * Scrape multiple pages
   * Note: RedirectErrors are caught and converted to ScrapeRedirectResult objects in the results array
   */
  scrapeMultiplePages(
    urls: string[],
    structured?: boolean,
  ): Promise<Array<ScrapeTextResult | ScrapeStructuredResult | ScrapeErrorResult | ScrapeRedirectResult>>;

  close(): Promise<void>;
}
