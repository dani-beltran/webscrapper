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

### 2. Unified Command Line Interface

The scraper automatically detects the operation mode based on your arguments:

#### Single URL Scraping

```bash
# Basic scraping
npm run scrape "https://example.com"

# Structured content extraction  
npm run scrape "https://example.com" --structured

# Save to file
npm run scrape "https://example.com" --structured --output results.json

# Use different browser
npm run scrape "https://example.com" --browser firefox

# Run with browser window visible (for debugging)
npm run scrape "https://example.com" --no-headless

# Group structured results by sections
npm run scrape "https://example.com" --structured --group-by "article"
```

#### Bulk Scraping (Multiple URLs)

```bash
# Scrape multiple URLs (automatically detected)
npm run scrape "https://example.com" "https://google.com"

# Scrape URLs from file
npm run scrape --file sample-urls.txt --structured --output results.json

# With custom batch configuration
npm run scrape --file urls.txt --batch-size 3 --delay 2000 --format csv

# Bulk scraping with different browser
npm run scrape "https://example.com" "https://google.com" --browser firefox --format json
```

#### Preset-based Configuration

```bash
# List available presets
npm run list-presets

# Show specific preset configuration
npm run show-preset news

# Use preset for scraping (automatically uses ConfigurableScraper)
npm run scrape --preset news "https://news-site.com"

# Use preset with custom output
npm run scrape --preset blog "https://blog.example.com" --output blog-content.json

# Use preset with browser options
npm run scrape --preset documentation "https://docs.site.com" --browser firefox --no-headless
```

## Configuration Options

The scraper can be configured with the following options:

```javascript
const scraper = new WebScraper({
  browser: 'chromium',        // 'chromium', 'firefox', 'webkit'
  headless: true,             // Run without browser window
  timeout: 30000,             // Page load timeout (ms)
  waitForSelector: '.content', // Wait for specific element
  excludeSelectors: [         // Elements to remove before scraping
    'script', 'style', 'nav', 'footer', 'aside', 
    '.ads', '.advertisement', '.sidebar', '.comments'
  ],
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
});
```

### Available Presets

The scraper includes built-in presets optimized for different content types:

- **news**: Optimized for news articles (excludes related articles, newsletters)
- **blog**: For blog posts (excludes author bio, related posts, comments)
- **ecommerce**: For product pages (excludes reviews, recommendations, cart)
- **documentation**: For technical docs (excludes edit buttons, breadcrumbs, page navigation)

Each preset has custom `excludeSelectors` and `waitForSelector` configurations.


## Output Formats

### JSON Output (default)
```json
{
  "url": "https://example.com",
  "text": "All extracted text content...",
  "length": 1234,
  "timestamp": "2025-10-10T10:00:00.000Z"
}
```

### Structured Output (with --structured flag)
```json
{
  "url": "https://example.com",
  "title": "Example Domain",
  "headings": {
    "h1": ["Main Heading"],
    "h2": ["Subheading 1", "Subheading 2"],
    "h3": ["Detail 1", "Detail 2"]
  },
  "paragraphs": ["First paragraph", "Second paragraph"],
  "links": [
    {"text": "Link text", "href": "https://link.com"}
  ],
  "lists": [
    {"type": "ul", "items": ["Item 1", "Item 2"]}
  ],
  "images": [
    {"alt": "Image description", "src": "https://example.com/image.jpg"}
  ]
}
```

### Grouped Structured Output (with --group-by flag)
```json
{
  "url": "https://example.com",
  "title": "Example Domain",
  "sections": [
    {
      "headings": {"h2": ["Section Title"]},
      "paragraphs": ["Section content..."],
      "links": [{"text": "Read more", "href": "..."}]
    }
  ]
}
```

### Bulk Scraping Formats

- **JSON** (default): Array of structured results
- **CSV**: Comma-separated values with headers
- **TXT**: Plain text concatenation


## Advanced Usage

### Custom Text Processing

```javascript
const scraper = new WebScraper({
  excludeSelectors: ['script', 'style', '.sidebar', '#comments', '.cookie-notice']
});

const result = await scraper.scrapeText('https://example.com');
const cleanText = result.text
  .replace(/\s+/g, ' ')
  .trim()
  .toLowerCase();
```

### Using Configuration Presets Programmatically

```javascript
import { ConfigurableScraper } from './src/configurable-scraper.js';

const scraper = new ConfigurableScraper();

// Use preset
const newsResult = await scraper.scrapeWithPreset(
  'https://news-site.com', 
  'news',
  { structured: true }
);

// Get preset configuration
const preset = scraper.getPreset('blog');
console.log(preset);
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

### Grouped Content Extraction

```javascript
// Extract content grouped by sections
const result = await scraper.scrapeTextStructured('https://example.com', {
  groupBySelector: 'article'  // Group content by article tags
});

console.log(result.sections); // Array of grouped content
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
# Scrape all URLs from file with structured output
npm run scrape --file old-site-urls.txt --structured --output migration-data.json

# Or use a preset for specific content type
npm run scrape --file blog-urls.txt --preset blog --output blog-migration.json
```

### 2. Competitive Analysis
```bash
# Scrape multiple competitor sites with structured extraction
npm run scrape "https://competitor1.com" "https://competitor2.com" --structured --output analysis.json

# Using specific browser for compatibility
npm run scrape --file competitors.txt --browser firefox --format csv
```

### 3. Research Data Collection
```bash
# Extract plain text from research sources
npm run scrape --file research-urls.txt --format txt --output research-text.txt

# Structured extraction for better organization
npm run scrape --file research-urls.txt --structured --batch-size 3 --delay 2000
```

### 4. SEO Content Analysis
```bash
# Extract structured content with headings and links
npm run scrape "https://target-site.com" --structured --output seo-analysis.json

# Using documentation preset for tech content
npm run scrape --preset documentation "https://target-site.com" --output docs-analysis.json
```

### 5. News Aggregation
```bash
# Use news preset for clean article extraction
npm run scrape --file news-urls.txt --preset news --output news-articles.json

# Group articles by sections
npm run scrape "https://news-site.com" --structured --group-by "article" --output grouped-news.json
```


## Troubleshooting

### Common Issues

1. **Timeout errors**: 
   - Increase timeout: `npm run scrape "https://slow-site.com" --timeout 60000`
   - Check internet connection
   - Try with visible browser: `--no-headless`

2. **Empty or incomplete text**: 
   - Website might be JavaScript-heavy
   - Use presets with appropriate wait selectors
   - Try: `npm run scrape "https://example.com" --preset documentation`

3. **Browser crashes**: 
   - Reduce batch size: `--batch-size 2`
   - Add more delays: `--delay 3000`
   - Try different browser: `--browser firefox`

4. **Memory issues**: 
   - Process fewer URLs at once
   - Use smaller batch sizes
   - Close and restart scraper between large batches

5. **Preset not found**:
   - List available presets: `npm run list-presets`
   - Check preset name spelling
   - Available: news, blog, ecommerce, documentation

### Debug Mode
```bash
# Run with browser window visible to see what's happening
npm run scrape "https://example.com" --no-headless

# Use different browser if having compatibility issues
npm run scrape "https://example.com" --browser firefox --no-headless
```

### Getting Help
```bash
# Show all available options and examples
npm run scrape --help

# List available presets
npm run list-presets

# Show specific preset details
npm run show-preset news
```


## Best Practices

1. **Always close scraper instances**: 
   ```javascript
   await scraper.close();
   ```

2. **Be respectful with request frequency**:
   - Use appropriate delays between requests
   - Default batch delay is 1000ms, increase for sensitive sites
   - Example: `--delay 3000` for 3-second delays

3. **Check robots.txt before scraping**:
   - Respect website policies
   - Some sites explicitly disallow scraping

4. **Handle errors gracefully**:
   ```javascript
   try {
     const result = await scraper.scrapeText(url);
   } catch (error) {
     console.error('Scraping failed:', error.message);
   }
   ```

5. **Validate scraped data before using**:
   - Check for empty results
   - Verify structure matches expectations
   - Look for error indicators in content

6. **Use appropriate user agents**:
   - Default user agent is set in config.json
   - Identifies as a standard browser
   - Configurable per scraper instance

7. **Consider website terms of service**:
   - Review and comply with ToS
   - Some sites prohibit automated access
   - Use presets to extract only relevant content

8. **Optimize for performance**:
   - Use headless mode (default)
   - Set appropriate timeouts
   - Exclude unnecessary elements with presets
   - Process in batches for multiple URLs

9. **Save important results**:
   - Always use `--output` flag for important scrapes
   - Default output directory: `./output`
   - Supports JSON, CSV, and TXT formats

10. **Test before bulk operations**:
    - Test on single URL first
    - Verify output format and content
    - Then scale to bulk operations

## CLI Command Reference

### Single URL Commands
```bash
npm run scrape "URL"                           # Basic scraping
npm run scrape "URL" --structured              # Structured extraction
npm run scrape "URL" --output file.json        # Save to file
npm run scrape "URL" --browser firefox         # Use Firefox
npm run scrape "URL" --no-headless             # Show browser
npm run scrape "URL" --timeout 60000           # 60s timeout
npm run scrape "URL" --group-by "selector"     # Group by CSS selector
```

### Bulk Commands
```bash
npm run scrape "URL1" "URL2" "URL3"            # Multiple URLs
npm run scrape --file urls.txt                 # From file
npm run scrape --file urls.txt --batch-size 3  # Custom batch size
npm run scrape --file urls.txt --delay 2000    # 2s delay between batches
npm run scrape --file urls.txt --format csv    # CSV output
```

### Preset Commands
```bash
npm run list-presets                           # List all presets
npm run show-preset NAME                       # Show preset config
npm run scrape --preset news "URL"             # Use news preset
npm run scrape --preset blog "URL" --output file.json  # Preset + save
```

## Installation & Setup

### Initial Setup
```bash
# Install dependencies
npm install

# Install browser binaries
npm run install-browsers
```

### Testing
```bash
# Run test suite
npm test

# Test single URL
npm run scrape "https://example.com"

# Test with structured output
npm run scrape "https://example.com" --structured
```
