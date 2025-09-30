# 🕷️ Playwright Web Scraper

A comprehensive, production-ready web scraping solution built with Playwright. This scraper can extract all text content from websites, handle JavaScript-rendered pages, and provide both simple and structured data extraction.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Install browser binaries
npm run install-browsers

# Run basic scraper
npm start

# Run tests
npm test
```

## 📁 Project Structure

```
webscrapper/
├── src/
│   ├── scraper.js              # Main WebScraper class
│   ├── bulk-scraper.js         # Bulk scraping utilities
│   ├── configurable-scraper.js # Preset-based scraper
│   ├── examples.js             # Usage examples
│   └── test.js                 # Test suite
├── config.json                 # Configuration presets
├── sample-urls.txt            # Sample URLs for testing
├── package.json               # Dependencies and scripts
├── README.md                  # Project documentation
├── USAGE.md                   # Detailed usage guide
└── output/                    # Generated output files
```

## 🛠️ Features

### Core Functionality
- ✅ **Multi-browser support** (Chromium, Firefox, WebKit)
- ✅ **JavaScript rendering** - Handles dynamic content
- ✅ **Text extraction** - Clean, formatted text output
- ✅ **Structured extraction** - Headings, paragraphs, links, lists
- ✅ **Bulk processing** - Scrape multiple URLs efficiently
- ✅ **Configuration presets** - Optimized for different site types
- ✅ **Multiple output formats** - JSON, TXT, CSV
- ✅ **Error handling** - Robust error recovery
- ✅ **Rate limiting** - Respectful scraping with delays

### Advanced Features
- 🔧 **Custom selectors** - Wait for specific elements
- 🧹 **Content filtering** - Exclude unwanted elements
- 📊 **Progress tracking** - Real-time scraping progress
- 🎯 **Preset configurations** - News, blogs, docs, e-commerce
- 📈 **Performance monitoring** - Track success rates
- 🛡️ **User agent rotation** - Avoid detection

## 🎯 Use Cases

### 1. Content Migration
```bash
node src/bulk-scraper.js file old-site-urls.txt --structured --output migration.json
```

### 2. Competitive Research
```javascript
import { ConfigurableScraper } from './src/configurable-scraper.js';
const scraper = new ConfigurableScraper('news');
const result = await scraper.scrapeTextStructured('https://competitor.com');
```

### 3. Data Collection
```bash
node src/bulk-scraper.js urls https://site1.com https://site2.com --format csv
```

### 4. Documentation Scraping
```bash
node src/configurable-scraper.js scrape https://docs.example.com documentation
```

## 📊 Output Examples

### Basic Text Output
```json
{
  "url": "https://example.com",
  "text": "Example Domain This domain is for use in illustrative examples...",
  "length": 187,
  "timestamp": "2025-09-30T07:42:37.768Z"
}
```

### Structured Output
```json
{
  "url": "https://example.com",
  "title": "Example Domain",
  "headings": {
    "h1": ["Example Domain"],
    "h2": ["About This Domain"]
  },
  "paragraphs": ["This domain is for use in illustrative examples..."],
  "links": [{"text": "More information", "href": "https://example.org"}],
  "lists": []
}
```

## 🔧 Configuration

### Available Presets
- **news** - Optimized for news websites
- **ecommerce** - For online stores and product pages
- **blog** - Blog posts and articles
- **documentation** - Technical documentation

### Custom Configuration
```javascript
const scraper = new WebScraper({
  browser: 'chromium',
  headless: true,
  timeout: 30000,
  excludeSelectors: ['script', 'style', '.ads'],
  waitForSelector: '.main-content'
});
```

## 📚 API Reference

### WebScraper Class
- `scrapeText(url)` - Extract plain text
- `scrapeTextStructured(url)` - Extract structured content
- `scrapeMultiplePages(urls)` - Bulk scraping
- `close()` - Cleanup resources

### BulkScraper Class
- `scrapeUrls(urls, options)` - Batch processing
- `scrapeUrlsFromFile(filePath)` - File-based input
- `saveResults(results, filename, format)` - Export data

### ConfigurableScraper Class
- `new ConfigurableScraper(preset, options)` - Preset-based scraper
- `listPresets()` - Available presets
- `getPresetConfig(name)` - Preset configuration

## 🧪 Testing

```bash
# Run all tests
npm test

# Test specific functionality
node src/examples.js

# Test bulk scraping
node src/bulk-scraper.js urls https://example.com
```

## 🚦 Best Practices

1. **Be respectful** - Add delays between requests
2. **Handle errors** - Always use try-catch blocks
3. **Close resources** - Call `await scraper.close()`
4. **Use presets** - Leverage optimized configurations
5. **Validate data** - Check scraped content quality
6. **Monitor performance** - Track success rates
7. **Respect robots.txt** - Check site policies

## 🔍 Troubleshooting

### Common Issues
- **Timeout errors**: Increase timeout or check connection
- **Empty results**: Try different presets or selectors
- **Memory issues**: Reduce batch size
- **Browser crashes**: Add more delays between requests

### Debug Mode
```javascript
const scraper = new WebScraper({ headless: false });
// Browser window opens for visual debugging
```

## 📈 Performance Tips

- Use headless mode for faster scraping
- Process URLs in batches (3-5 at a time)
- Add 1-2 second delays between batches
- Exclude unnecessary elements early
- Use appropriate browser for the task

## 🤝 Contributing

1. Follow the existing code style
2. Add tests for new features
3. Update documentation
4. Test with multiple browsers
5. Consider performance impact

## 📄 License

MIT License - Feel free to use in your projects!

---

**Created with ❤️ using Playwright** - The reliable, fast, and modern web scraping solution.