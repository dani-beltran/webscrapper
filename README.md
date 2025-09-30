# Web Scraper with Playwright

A powerful web scraper built with Playwright that extracts all text content from websites.

## Features

- Extract all visible text from any website
- Support for multiple browsers (Chromium, Firefox, WebKit)
- Handles JavaScript-rendered content
- Clean text output with proper formatting
- Error handling and retry mechanisms
- Configurable options

## Installation

1. Install dependencies:
```bash
npm install
```

2. Install browser binaries:
```bash
npm run install-browsers
```

## Usage

### Basic Usage

```bash
npm start
```

This will prompt you to enter a URL to scrape.

### Programmatic Usage

```javascript
import { WebScraper } from './src/scraper.js';

const scraper = new WebScraper();
const text = await scraper.scrapeText('https://example.com');
console.log(text);
```

### Configuration Options

```javascript
const scraper = new WebScraper({
  browser: 'chromium', // 'chromium', 'firefox', or 'webkit'
  headless: true,
  timeout: 30000,
  waitForSelector: null, // Optional selector to wait for
  excludeSelectors: ['script', 'style', 'nav', 'footer'] // Elements to exclude
});
```

## API

### WebScraper Class

#### Constructor Options

- `browser` (string): Browser to use ('chromium', 'firefox', 'webkit'). Default: 'chromium'
- `headless` (boolean): Run browser in headless mode. Default: true
- `timeout` (number): Page load timeout in milliseconds. Default: 30000
- `waitForSelector` (string): CSS selector to wait for before scraping. Default: null
- `excludeSelectors` (array): CSS selectors of elements to exclude from text extraction

#### Methods

- `scrapeText(url)`: Scrapes all text content from the given URL
- `scrapeMultiplePages(urls)`: Scrapes text from multiple URLs
- `close()`: Closes the browser instance

## Examples

See `src/examples.js` for more usage examples.

## License

MIT