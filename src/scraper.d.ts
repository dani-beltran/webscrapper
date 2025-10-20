export interface WebScraperOptions {
  browser?: 'chromium' | 'firefox' | 'webkit';
  headless?: boolean;
  timeout?: number;
  sectionSelectors?: string[];
  waitForSelector?: string | null;
  excludeSelectors?: string[];
  userAgent?: string;
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

export interface StructuredData {
  headings: {
    [key: string]: string[];
  };
  paragraphs: string[];
  otherText: string[];
  links: LinkData[];
  lists: ListData[];
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

export declare class WebScraper {
  options: Required<WebScraperOptions>;
  browser: any | null;
  context: any | null;

  constructor(options?: WebScraperOptions);

  init(): Promise<void>;

  scrapeText(url: string): Promise<ScrapeTextResult>;

  scrapeTextStructured(url: string): Promise<ScrapeStructuredResult>;

  scrapeMultiplePages(
    urls: string[],
    structured?: boolean,
  ): Promise<Array<ScrapeTextResult | ScrapeStructuredResult | ScrapeErrorResult>>;

  close(): Promise<void>;
}
