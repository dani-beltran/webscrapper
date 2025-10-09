# Web Scraper with Playwright

A powerful web scraper built with Playwright that extracts text content from websites with multiple operation modes.

## Features

- **Single URL scraping**: Extract content from individual websites
- **Bulk scraping**: Process multiple URLs in batches with configurable delays
- **Configuration-based scraping**: Use presets optimized for different site types (news, blogs, documentation, etc.)
- Extract all visible text from any website
- Support for multiple browsers (Chromium, Firefox, WebKit)
- Handles JavaScript-rendered content
- Clean text output with proper formatting
- Error handling and retry mechanisms
- Unified CLI interface with backward compatibility

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

## Unified Command Line Interface

The web scraper automatically detects the operation mode based on your arguments:

### Single URL Scraping

```bash
# Basic scraping
npm run scrape "https://example.com"

# Structured content extraction
npm run scrape "https://example.com" --structured

# Save to file
npm run scrape "https://example.com" --structured --output results.json

# Use different browser
npm run scrape "https://example.com" --browser firefox
```

### Bulk Scraping

```bash
# Multiple URLs (automatically detected as bulk mode)
npm run scrape "https://example.com" "https://google.com"

# URLs from file (triggered by --file flag)
npm run scrape --file sample-urls.txt --structured --output results.json

# With custom options
npm run scrape --file urls.txt --batch-size 3 --delay 2000 --format csv
```

### Configuration-based Scraping

```bash
# Using preset (triggered by --preset flag)  
npm run scrape --preset news "https://news-site.com"

# List available presets
npm run scrape list-presets

# Show preset configuration
npm run scrape show-preset blog

# Save results with custom options
npm run scrape --preset documentation "https://docs.site.com" --output docs.json

# Show information about presets
npm run list-presets
npm run show-preset blog
```

## Programmatic Usage

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

## Examples

See `src/examples.js` for more usage examples.

## License

MIT