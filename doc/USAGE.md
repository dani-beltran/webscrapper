# Web Scraper Usage Guide

## Quick Start

### 1. Basic Text Extraction

```javascript
import { WebScraper } from './src/scraper.js';

const scraper = new WebScraper();
const result = await scraper.scrapeText('https://example.com');
console.log(result.text);
await scraper.close();
```

### 2. Interactive CLI Mode

```bash
npm start
# or
npm run cli
# Enter URL when prompted
# Choose between basic or structured extraction
```

### 3. Command Line Interface

```bash
# Basic scraping
npm run scrape https://example.com

# Structured content extraction  
npm run scrape -- --structured https://example.com

# Save to file
npm run scrape -- --structured --output results.json https://example.com

# Use different browser
npm run scrape -- --browser firefox https://example.com

# Run with browser window visible (for debugging)
npm run scrape -- --no-headless https://example.com
```

### 4. Bulk Scraping

```bash
# Scrape multiple URLs
npm run bulk -- urls https://example.com https://google.com

# Scrape URLs from file
npm run bulk -- file sample-urls.txt --structured --output results.json

# With custom configuration
npm run bulk -- file urls.txt --batch-size 3 --delay 2000 --format csv --browser firefox
```

### 5. Preset-based Configuration

```bash
# List available presets
npm run config list-presets

# Show specific preset configuration
npm run config show-preset news

# Use preset for scraping
npm run config -- scrape https://news-site.com news

# Use preset with custom options
npm run config -- scrape https://blog.example.com blog --format full --output blog-content.json

# Use preset with browser options
npm run config -- scrape https://docs.site.com documentation --browser firefox --no-headless
```

## Configuration Options

```javascript
const scraper = new WebScraper({
  browser: 'chromium',        // 'chromium', 'firefox', 'webkit'
  headless: true,             // Run without browser window
  timeout: 30000,             // Page load timeout (ms)
  waitForSelector: '.content', // Wait for specific element
  excludeSelectors: [         // Elements to remove before scraping
    'script', 'style', 'nav', 'footer', 'aside', '.ads'
  ],
  userAgent: 'Custom User Agent String'
});
```

## Output Formats

### JSON Output
```json
{
  "url": "https://example.com",
  "text": "All extracted text content...",
  "length": 1234,
  "timestamp": "2025-09-30T10:00:00.000Z"
}
```

### Structured Output
```json
{
  "url": "https://example.com",
  "title": "Example Domain",
  "headings": {
    "h1": ["Main Heading"],
    "h2": ["Subheading 1", "Subheading 2"]
  },
  "paragraphs": ["First paragraph", "Second paragraph"],
  "links": [
    {"text": "Link text", "href": "https://link.com"}
  ],
  "lists": [
    {"type": "ul", "items": ["Item 1", "Item 2"]}
  ]
}
```

## Advanced Usage

### Custom Text Processing

```javascript
const scraper = new WebScraper({
  excludeSelectors: ['script', 'style', '.sidebar', '#comments']
});

const result = await scraper.scrapeText('https://example.com');
const cleanText = result.text
  .replace(/\s+/g, ' ')
  .trim()
  .toLowerCase();
```

### Multiple Browser Support

```javascript
// Use Firefox
const firefoxScraper = new WebScraper({ browser: 'firefox' });

// Use WebKit (Safari)
const webkitScraper = new WebScraper({ browser: 'webkit' });
```

### Batch Processing with Rate Limiting

```javascript
import { BulkScraper } from './src/bulk-scraper.js';

const bulkScraper = new BulkScraper();
const results = await bulkScraper.scrapeUrls(urls, {
  batchSize: 3,     // Process 3 URLs at a time
  delay: 2000,      // Wait 2 seconds between batches
  structured: true,
  outputFormat: 'csv'
});
```

## Error Handling

```javascript
try {
  const result = await scraper.scrapeText('https://example.com');
  console.log('Success:', result.text.length + ' characters');
} catch (error) {
  console.error('Scraping failed:', error.message);
  // Handle timeout, network errors, etc.
}
```

## Performance Tips

1. **Use headless mode** for faster scraping
2. **Set appropriate timeouts** for slow websites
3. **Exclude unnecessary elements** to reduce processing time
4. **Use batch processing** for multiple URLs
5. **Add delays** between requests to be respectful

## Common Use Cases

### 1. Content Migration
```bash
node src/bulk-scraper.js file old-site-urls.txt --structured --output migration-data.json
```

### 2. Competitive Analysis
```javascript
const competitors = ['https://competitor1.com', 'https://competitor2.com'];
const results = await scraper.scrapeMultiplePages(competitors, true);
```

### 3. Research Data Collection
```bash
node src/bulk-scraper.js file research-urls.txt --format txt --output research-text.txt
```

### 4. SEO Content Analysis
```javascript
const result = await scraper.scrapeTextStructured('https://target-site.com');
console.log('Headings:', result.headings);
console.log('Internal links:', result.links.filter(l => l.href.includes('target-site.com')));
```

## Troubleshooting

### Common Issues

1. **Timeout errors**: Increase timeout or check internet connection
2. **Empty text**: Website might be JavaScript-heavy, try waiting for specific selectors
3. **Browser crashes**: Reduce batch size or add more delays
4. **Memory issues**: Process fewer URLs at once

### Debug Mode
```javascript
const scraper = new WebScraper({ headless: false });
// Browser window will open so you can see what's happening
```

## Best Practices

1. Always close scraper instances: `await scraper.close()`
2. Be respectful with request frequency
3. Check robots.txt before scraping
4. Handle errors gracefully
5. Validate scraped data before using
6. Use appropriate user agents
7. Consider website terms of service