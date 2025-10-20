# 🕷️ Web Scraper with Playwright

A production-ready web scraping solution built with Playwright that extracts text content from websites with multiple operation modes and intelligent content filtering.

## ✨ Features

- **Multi-browser support** (Chromium, Firefox, WebKit)
- **Unified CLI** - Auto-detects operation mode (single URL, bulk, or preset-based)
- **JavaScript rendering** - Handles dynamic content
- **Structured extraction** - Headings, paragraphs, links, lists, images
- **Bulk processing** - Scrape multiple URLs efficiently with rate limiting
- **Configuration presets** - Optimized for news, blogs, docs, e-commerce
- **Multiple output formats** - JSON, TXT, CSV
- **Content grouping** - Group results by CSS selectors
- **Error handling** - Robust error recovery and retry mechanisms

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Install browser binaries
npm run install-browsers

# Basic scraping
npm run scrape "https://example.com"

# Structured extraction
npm run scrape "https://example.com" -- --structured --output results.json

# Run tests
npm test
```

## 📖 Usage

### Single URL Scraping

```bash
# Basic text extraction
npm run scrape "https://example.com"

# Structured content (headings, links, paragraphs, lists)
npm run scrape "https://example.com" -- --structured

# Group content by sections
npm run scrape "https://news-site.com" -- --structured --group-by "article"

# Use different browser
npm run scrape "https://example.com" -- --browser firefox

# Debug mode (visible browser)
npm run scrape "https://example.com" -- --no-headless
```

### Bulk Scraping

```bash
# Multiple URLs
npm run scrape "https://site1.com" "https://site2.com" -- --structured

# From file
npm run scrape -- --file urls.txt --output results.json

# Custom batch processing
npm run scrape -- --file urls.txt --batch-size 3 --delay 2000 --format csv
```

### Preset-based Scraping

```bash
# List available presets
npm run list-presets

# Show preset details
npm run show-preset news

# Use preset (news, blog, ecommerce, documentation)
npm run scrape -- --preset news "https://news-site.com" --output articles.json
```

#### Available Presets

- **news** - News articles (excludes related articles, newsletters, ads)
- **blog** - Blog posts (excludes author bio, related posts, comments)
- **ecommerce** - Product pages (excludes reviews, recommendations, cart)
- **documentation** - Technical docs (excludes edit buttons, breadcrumbs, navigation)


### Programmatic Usage

```javascript
import { WebScraper } from './src/scraper.js';

// Basic usage
const scraper = new WebScraper();
const result = await scraper.scrapeText('https://example.com');
console.log(result.text);
await scraper.close();

// With custom configuration
const customScraper = new WebScraper({
  browser: 'chromium',
  headless: true,
  timeout: 30000,
  waitForSelector: '.main-content',
  excludeSelectors: ['script', 'style', '.ads', 'nav', 'footer'],
  followRedirects: false  // Don't follow 301/302 redirects (default: true)
});

// Structured extraction
const structured = await scraper.scrapeTextStructured('https://example.com');
console.log(structured.headings, structured.links);

// Multiple section selectors - try multiple CSS selectors
const sectionScraper = new WebScraper({
  sectionSelectors: ['article', 'section', '.content', 'main']
});
const sections = await sectionScraper.scrapeTextStructured('https://example.com');
console.log(sections.sections); // Array of matched sections

// Override section selectors per request
const result = await scraper.scrapeTextStructured('https://example.com', {
  sectionSelectors: ['.post', 'article', '.entry']
});
```

### Using Presets Programmatically

```javascript
import { ConfigurableScraper } from './src/configurable-scraper.js';

const scraper = new ConfigurableScraper();
const result = await scraper.scrapeWithPreset(
  'https://news-site.com', 
  'news',
  { structured: true }
);
```

### Bulk Processing

```javascript
import { BulkScraper } from './src/bulk-scraper.js';

const bulkScraper = new BulkScraper();
const results = await bulkScraper.scrapeUrls(urls, {
  batchSize: 3,
  delay: 2000,
  structured: true,
  outputFormat: 'json'
});
```

## 🎯 Advanced Features

### Redirect Handling

Control how the scraper handles HTTP redirects (301, 302, 303, 307, 308):

```javascript
const scraper = new WebScraper({
  followRedirects: false  // Don't follow redirects (default: true)
});

const result = await scraper.scrapeText('https://example.com/old-page');
// If a redirect is encountered, returns:
// {
//   url: 'https://example.com/old-page',
//   redirect: true,
//   status: 301,
//   location: 'https://example.com/new-page',
//   message: 'Redirect detected (301) to: https://example.com/new-page',
//   timestamp: '2025-10-20T10:00:00.000Z'
// }
```

**Use cases:**
- ✅ Detect moved or deprecated URLs
- ✅ Track redirect chains in bulk operations
- ✅ Validate URL structure without following redirects
- ✅ Audit SEO redirect configurations

### Multiple Section Selectors

You can now specify multiple CSS selectors to capture content from different section types. The scraper will try each selector and combine all matching sections.
Each section in the results will include the selector as id, if there are several matches for the same selector, they will be numbered.

```javascript
const scraper = new WebScraper({
  sectionSelectors: ['article', 'section', '.content', 'main']
});

const result = await scraper.scrapeTextStructured('https://example.com');
// Returns sections matching ANY of the selectors
```

This is useful when:
- Different pages use different HTML structures
- You want to capture multiple types of content sections
- Content is split across various semantic elements

**Benefits:**
- ✅ More flexible scraping across different page layouts
- ✅ Fallback selectors if primary selector doesn't match
- ✅ Combine multiple content areas (e.g., main article + sidebars)

## 📊 Output Formats

### JSON (default)
```json
{
  "url": "https://example.com",
  "text": "Extracted content...",
  "length": 1234,
  "timestamp": "2025-10-10T10:00:00.000Z"
}
```

### Structured JSON (--structured flag)
```json
{
  "url": "https://example.com",
  "title": "Page Title",
  "headings": {"h1": ["Main"], "h2": ["Sub1", "Sub2"]},
  "paragraphs": ["Text..."],
  "links": [{"text": "Link", "href": "https://..."}],
  "lists": [{"type": "ul", "items": ["Item 1"]}],
  "images": [{"alt": "Desc", "src": "https://..."}]
}
```

### CSV (--format csv)
Comma-separated values with headers for bulk operations.

### TXT (--format txt)
Plain text concatenation for simple text output.


## 🛠️ CLI Command Reference

```bash
# Basic commands
npm run scrape "URL"                          # Basic scraping
npm run scrape "URL" --structured             # Structured extraction
npm run scrape "URL" --output file.json       # Save to file

# Advanced options
npm run scrape "URL" --browser firefox        # Use Firefox
npm run scrape "URL" --no-headless            # Show browser
npm run scrape "URL" --timeout 60000          # 60s timeout
npm run scrape "URL" --group-by "selector"    # Group content

# Bulk operations
npm run scrape "URL1" "URL2"                  # Multiple URLs
npm run scrape --file urls.txt --batch-size 3 # Custom batching
npm run scrape --file urls.txt --delay 2000   # 2s delay

# Preset operations
npm run list-presets                          # List presets
npm run show-preset news                      # Show preset config
npm run scrape --preset news "URL"            # Use preset
```

## 🚦 Best Practices

1. **Be respectful** - Use delays between requests (`--delay 2000`)
2. **Handle errors** - Always use try-catch blocks in code
3. **Close resources** - Call `await scraper.close()`
4. **Use presets** - Leverage optimized configurations
5. **Check robots.txt** - Respect website policies
6. **Test first** - Try single URL before bulk operations
7. **Save important results** - Use `--output` flag
8. **Optimize performance** - Use headless mode and appropriate batch sizes

## 🔍 Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| Timeout errors | Increase timeout: `--timeout 60000` |
| Empty results | Try preset or wait selector |
| Browser crashes | Reduce batch size: `--batch-size 2` |
| Memory issues | Process fewer URLs at once |
| Preset not found | Run `npm run list-presets` |

## 📄 License

MIT License - Feel free to use in your projects!

---
