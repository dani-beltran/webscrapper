import type { Page } from 'playwright';

export { RedirectError } from './errors/RedirectError.js';

export type WebScraperPlugin = (page: Page) => void | Promise<void>;

export interface SectionGroup {
  selector: string;
  /** Throw when the selector is missing. @default false */
  required?: boolean;
  /** Wait for the selector before extraction. @default true */
  wait?: boolean;
  name?: string;
}

export interface WebScraperOptions {
  browser?: 'chromium' | 'firefox' | 'webkit';
  headless?: boolean;
  timeout?: number;
  groups?: SectionGroup[];
  waitUntil?: 'load' | 'domcontentloaded' | 'networkidle' | 'commit';
  excludeSelectors?: string[];
  userAgent?: string;
  followPermanentRedirect?: boolean;
  followTemporaryRedirect?: boolean;
  /** Runs after navigation, before configured section group waits and content extraction. */
  plugin?: WebScraperPlugin;
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
  options: Omit<Required<WebScraperOptions>, 'plugin'> & { plugin?: WebScraperPlugin };
  browser: any | null;
  context: any | null;

  constructor(options?: WebScraperOptions);

  init(): Promise<void>;

  /**
   * Scrape text content from a URL
   * @throws {RedirectError} When followPermanentRedirect or followTemporaryRedirect is false and a matching redirect is detected
   */
  scrapeText(url: string): Promise<ScrapeTextResult>;

  /**
   * Scrape structured content from a URL
   * @throws {RedirectError} When followPermanentRedirect or followTemporaryRedirect is false and a matching redirect is detected
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
