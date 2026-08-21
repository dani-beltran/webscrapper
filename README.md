# 🕷️ Web Scraper with Playwright

A production-ready web scraping solution built with Playwright that extracts text content from websites with multiple operation modes and intelligent content filtering.

## ✨ Features

- **Multi-browser support** (Chromium, Firefox, WebKit)
- **Unified CLI** - Auto-detects operation mode (single URL, bulk, or preset-based)
- **JavaScript rendering** - Handles dynamic content
- **Structured extraction** - Headings, paragraphs, links, lists, images
- **Bulk processing** - Scrape multiple URLs efficiently with rate limiting
- **Configuration presets** - Optimized for news, blogs, docs, e-commerce
- **Pre-scrape plugins** - Run custom Playwright code before extraction
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

# Run a JavaScript plugin before scraping
npm run scrape "https://example.com" -- --plugin-file plugin-example.js

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
  waitUntil: 'domcontentloaded',   // Navigation wait strategy (default: 'domcontentloaded')
  excludeSelectors: ['script', 'style', '.ads', 'nav', 'footer'],
  followPermanentRedirect: false,  // Don't follow permanent redirects 301/308 (default: true)
  followTemporaryRedirect: false,  // Don't follow temporary redirects 302/303/307 (default: true)
  plugin: async (page) => {
    await page.click('a');
    await page.waitForTimeout(1000);
    await page.hover('#example-domains');
  }
});

// Structured extraction
const structured = await scraper.scrapeTextStructured('https://example.com');
console.log(structured.headings, structured.links);

// Named section groups
const sectionScraper = new WebScraper({
  groups: [
    { selector: 'article', required: true, wait: true, name: 'article' },
    { selector: '.article-content', required: false, wait: false, name: 'content' }
  ]
});
const sections = await sectionScraper.scrapeTextStructured('https://news-site.com/article');
console.log(sections.sections); // Array of matched sections
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

### Pre-scrape Plugin

Pass a `plugin` function to run custom Playwright code on every URL. The function receives the real Playwright [`Page`](https://playwright.dev/docs/api/class-page) object and can click controls, fill forms, wait for dynamic content, navigate, or modify the DOM.

```javascript
const scraper = new WebScraper({
  plugin: async (page) => {
    await page.getByRole('button', { name: 'Accept cookies' }).click();
    await page.fill('#search', 'Playwright');
    await page.press('#search', 'Enter');
    await page.waitForSelector('.search-results');
  }
});
```

The plugin is awaited once per scraped URL after `page.goto()`, before section groups with `wait` enabled are awaited and content is extracted. If it throws, that scrape fails with the same error. Handle optional actions inside the plugin when they should not abort scraping:

```javascript
plugin: async (page) => {
  try {
    await page.click('#optional-banner-close', { timeout: 2000 });
  } catch {
    // The banner was not present; continue scraping.
  }
}
```

For CLI usage, create an `.mjs` ES module whose default export is the plugin function. The `.mjs` extension keeps the plugin in ESM format even when your project uses `"type": "commonjs"`:

```javascript
// plugin.mjs
export default async function plugin(page) {
  await page.click('#expand');
  await page.waitForTimeout(1000);
}
```

For CommonJS, create a `.cjs` file and assign the plugin function directly to `module.exports`:

```javascript
// plugin.cjs
module.exports = async function plugin(page) {
  await page.click('#expand');
  await page.waitForTimeout(1000);
};
```

Then pass either trusted local script with `--plugin-file`:

```bash
# ES module
npm run scrape "https://example.com" -- --plugin-file ./plugin.mjs

# CommonJS
npm run scrape "https://example.com" -- --plugin-file ./plugin.cjs
```

Plugin files execute as local JavaScript with the permissions of the CLI process, so only load code you trust.

### Redirect Handling

Control how the scraper handles HTTP redirects independently for permanent (301, 308) and temporary (302, 303, 307) redirects:

```javascript
import { WebScraper, RedirectError } from './src/scraper.js';

// Throw on all redirects
const scraper = new WebScraper({
  followPermanentRedirect: false,  // Don't follow 301/308 (default: true)
  followTemporaryRedirect: false   // Don't follow 302/303/307 (default: true)
});

// Follow permanent redirects only
const permanentOnlyScraper = new WebScraper({
  followPermanentRedirect: true,
  followTemporaryRedirect: false
});

try {
  const result = await scraper.scrapeText('https://example.com/old-page');
  // Normal scraping if no redirect
  console.log(result.text);
} catch (error) {
  // Redirect detected - throws RedirectError
  if (error instanceof RedirectError) {
    console.log(`Redirect ${error.status}: ${error.originalUrl} -> ${error.location}`);
    console.log(error.message);
    // error.status - HTTP status code (301, 302, etc.)
    // error.location - redirect target URL
    // error.originalUrl - original URL that redirected
    // error.timestamp - ISO timestamp
  }
}
```

**Use cases:**
- ✅ Detect moved or deprecated URLs
- ✅ Track redirect chains in bulk operations
- ✅ Validate URL structure without following redirects
- ✅ Audit SEO redirect configurations

### Named Section Groups

`groups` accepts objects with a CSS `selector`, a stable output `name`, a `required` flag, and a `wait` flag. `wait` defaults to `true`; set it to `false` to sample the group without a selector-specific wait. `required` defaults to `false`. A missing required group throws a standard `Error`, while a missing optional group returns its `name` as `id`, a `null` title, and empty content collections.

If one selector matches several elements, their IDs use the group name followed by a number: `article`, `article-2`, and so on.

```javascript
const scraper = new WebScraper({
  groups: [
    { selector: 'article', required: true, wait: true, name: 'article' },
    { selector: '.article-content', required: false, wait: false, name: 'content' }
  ]
});

const result = await scraper.scrapeTextStructured('https://news-site.com/article');
// Waiting is enabled by default. Missing required groups throw;
// missing optional groups return empty sections.
```

This is useful when:
- Required page sections render asynchronously
- You want to capture multiple types of content sections without failing on missing ones
- Content is split across various semantic elements

**Benefits:**
- ✅ More flexible scraping across different page layouts
- ✅ Combine multiple content areas (e.g., main article + sidebars)

### Navigation Wait Strategy (`waitUntil`)

Control when Playwright considers navigation complete. Useful for pages that load content at different stages:

| Value | Wait for | Best for |
|-------|----------|----------|
| `'domcontentloaded'` | HTML parsed, DOM ready (default) | Most pages — fast and reliable |
| `'load'` | All resources (images, scripts, stylesheets) | Pages where initial layout matters |
| `'networkidle'` | No network activity for 500ms | Heavy SPAs that fetch data on load |
| `'commit'` | First byte received | Fast link-following / redirect detection |

```javascript
// Default — fastest, works for most pages
const scraper = new WebScraper({ waitUntil: 'domcontentloaded' });

// Wait for all assets (images, fonts, etc.)
const scraper = new WebScraper({ waitUntil: 'load' });

// Wait for API calls to finish on a SPA
const scraper = new WebScraper({ waitUntil: 'networkidle' });
```

**Tips:**
- `'domcontentloaded'` is the default — prefer it unless content is missing.
- Use `'networkidle'` for SPAs that render after async data fetches, but expect slower scraping.
- Use `groups` to name sections and independently control waiting and required behavior.

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
npm run scrape "URL" -- --structured          # Structured extraction
npm run scrape "URL" -- --output file.json    # Save to file

# Advanced options
npm run scrape "URL" -- --browser firefox        # Use Firefox
npm run scrape "URL" -- --no-headless            # Show browser
npm run scrape "URL" -- --timeout 60000          # 60s timeout
npm run scrape "URL" -- --group-by "selector"    # Group content
npm run scrape "URL" -- --plugin-file plugin.mjs # Run a pre-scrape plugin

# Bulk operations
npm run scrape "URL1" "URL2"                  # Multiple URLs
npm run scrape -- --file urls.txt --batch-size 3 # Custom batching
npm run scrape -- --file urls.txt --delay 2000   # 2s delay

# Preset operations
npm run list-presets                          # List presets
npm run show-preset news                      # Show preset config
npm run scrape -- --preset news "URL"         # Use preset
```

## Migrating from v3 to v4

Version 4 replaces the `sectionSelectors` string array with named `groups` and removes the standalone `waitForSelector` option. Each group now controls its own waiting and missing-selector behavior.

Before (v3):

```javascript
const scraper = new WebScraper({
  waitForSelector: '.article-ready',
  sectionSelectors: ['article', '.sidebar']
});

const result = await scraper.scrapeTextStructured(url);
```

After (v4):

```javascript
const scraper = new WebScraper({
  groups: [
    {
      name: 'article',
      selector: 'article',
      wait: true,
      required: true
    },
    {
      name: 'sidebar',
      selector: '.sidebar',
      wait: false,
      required: false
    }
  ]
});

const result = await scraper.scrapeTextStructured(url);
```

Group fields work as follows:

| Field | Default | Behavior |
|-------|---------|----------|
| `selector` | Required | CSS selector used to locate the section. |
| `name` | `selector` | Stable section `id` in the result. Multiple matches use `name-2`, `name-3`, and so on. |
| `wait` | `true` | Wait up to the scraper `timeout` before extraction. Set to `false` to check without a selector-specific wait. |
| `required` | `false` | When `true`, throw a standard `Error` if missing. Otherwise return an empty section. |

### Replacing `waitForSelector`

The `waitForSelector` constructor option and `--wait-for-selector` CLI flag no longer exist. If the selector represents content you want in structured output, make it a group:

```javascript
const scraper = new WebScraper({
  groups: [
    { name: 'article', selector: '.article-ready', wait: true, required: true }
  ]
});
```

If the selector is only a page-readiness signal, or you use `scrapeText`, wait in a plugin instead. Groups are only processed by `scrapeTextStructured`:

```javascript
const scraper = new WebScraper({
  plugin: async (page) => {
    await page.waitForSelector('.article-ready');
  }
});
```

### Migrating fallback selectors

Groups are independent output slots. If the old array contained alternative selectors for the same section, combine them into one CSS selector so any match satisfies the group:

```javascript
const scraper = new WebScraper({
  groups: [
    {
      name: 'article',
      selector: 'article, .article-content, .post-content',
      wait: true,
      required: true
    }
  ]
});
```

### Removed errors and CLI behavior

`SelectorTimeoutError` and `SectionNotFoundError` were removed. Missing required groups now throw a standard `Error`; missing optional groups return empty structured data. Remove imports and `instanceof` checks for those custom classes.

The `--group-by <selector>` CLI option remains available. Each CLI selector is converted to a group whose `name` is the selector and whose `wait` and `required` values are both `true`. Remove any use of `--wait-for-selector`.

## Migrating from v2 to v3

Version 3.0.0 replaces the declarative `interactionSteps` option with the `plugin` callback. Move each old step into an awaited Playwright call on the supplied `Page`.

Before (v2):

```javascript
const scraper = new WebScraper({
  interactionSteps: [
    { event: 'click', target: '#expand', wait: 1000, timeout: 5000 },
    { event: 'mouseover', target: '#info', required: false }
  ]
});
```

After (v3):

```javascript
const scraper = new WebScraper({
  plugin: async (page) => {
    await page.click('#expand', { timeout: 5000 });
    await page.waitForTimeout(1000);

    try {
      await page.hover('#info');
    } catch {
      // Equivalent to required: false.
    }
  }
});
```

Use these direct equivalents when migrating events:

| v2 event | v3 plugin call |
|----------|----------------|
| `click` | `await page.click(target, { timeout })` |
| `dblclick` | `await page.dblclick(target, { timeout })` |
| `mouseover` or `hover` | `await page.hover(target, { timeout })` |
| `focus` | `await page.focus(target, { timeout })` |
| `fill` | `await page.fill(target, value, { timeout })` |
| `type` | `await page.locator(target).pressSequentially(value, { timeout })` |
| `press` | `await page.press(target, value, { timeout })` |

The old `wait` field becomes `await page.waitForTimeout(wait)`, and per-step `timeout` values move into the relevant Playwright call. Wrap optional actions in `try/catch`; v3 no longer returns `interactionWarnings`. The `InteractionStepError`, `InteractionStep`, `InteractionWarning`, and `InteractionEvent` exports have also been removed, and plugin errors now propagate unchanged.

For the CLI, replace the v2 JSON file and flag:

```bash
npm run scrape "URL" -- --interaction-steps-file interactions.json
```

with a JavaScript module that default exports the callback and the v3 flag:

```bash
npm run scrape "URL" -- --plugin-file plugin.mjs
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
| Empty results | Configure a structured `group` or wait in a plugin |
| Browser crashes | Reduce batch size: `--batch-size 2` |
| Memory issues | Process fewer URLs at once |
| Preset not found | Run `npm run list-presets` |

## 📄 License

MIT License - Feel free to use in your projects!

---
