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

### Interactive CLI

```bash
npm start
# or
npm run cli
```

This will start an interactive session where you can enter URLs and choose options.

### Command Line Interface

```bash
# Basic scraping
npm run scrape https://example.com

# Structured content extraction
npm run scrape -- --structured https://example.com

# Save to file
npm run scrape -- --structured --output results.json https://example.com

# Use different browser
npm run scrape -- --browser firefox https://example.com
```

### Bulk Scraping

```bash
# Scrape multiple URLs
npm run bulk -- urls https://example.com https://google.com

# Scrape URLs from file
npm run bulk -- file sample-urls.txt --structured --output results.json

# With custom options
npm run bulk -- file urls.txt --batch-size 3 --delay 2000 --format csv
```

### Preset-based Scraping

```bash
# List available presets
npm run config list-presets

# Use a preset for specific site types
npm run config -- scrape https://news-site.com news

# Show preset configuration
npm run config show-preset blog

# Save results with custom options
npm run config -- scrape https://docs.site.com documentation --output docs.json
```

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