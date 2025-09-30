#!/usr/bin/env node

import { WebScraper } from './scraper.js';

function showHelp() {
  console.log(`
🕷️  Web Scraper CLI

Usage: node src/scrape.js [options] <url>

Options:
  --structured, -s    Extract structured content (headings, links, etc.)
  --browser <type>    Browser to use: chromium, firefox, webkit (default: chromium)
  --timeout <ms>      Timeout in milliseconds (default: 30000)
  --headless          Run in headless mode (default: true)
  --no-headless       Run with browser window visible
  --output <file>     Save output to file (JSON format)
  --help, -h          Show this help message

Examples:
  node src/scrape.js https://example.com
  node src/scrape.js --structured https://news-site.com
  node src/scrape.js --browser firefox --no-headless https://example.com
  node src/scrape.js --structured --output results.json https://example.com
`);
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    showHelp();
    process.exit(0);
  }

  let url = null;
  const options = {
    browser: 'chromium',
    headless: true,
    timeout: 30000,
    structured: false,
    outputFile: null
  };

  // Parse arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--structured':
      case '-s':
        options.structured = true;
        break;
      case '--browser':
        options.browser = args[++i];
        break;
      case '--timeout':
        options.timeout = parseInt(args[++i]);
        break;
      case '--headless':
        options.headless = true;
        break;
      case '--no-headless':
        options.headless = false;
        break;
      case '--output':
        options.outputFile = args[++i];
        break;
      default:
        if (!arg.startsWith('--') && !url) {
          url = arg;
        }
    }
  }

  if (!url) {
    console.error('❌ Error: URL is required');
    showHelp();
    process.exit(1);
  }

  if (!url.startsWith('http')) {
    console.error('❌ Error: URL must start with http:// or https://');
    process.exit(1);
  }

  try {
    console.log(`🚀 Scraping: ${url}`);
    console.log(`🔧 Browser: ${options.browser}, Headless: ${options.headless}, Structured: ${options.structured}`);
    
    const scraper = new WebScraper({
      browser: options.browser,
      headless: options.headless,
      timeout: options.timeout
    });

    const result = options.structured 
      ? await scraper.scrapeTextStructured(url)
      : await scraper.scrapeText(url);

    await scraper.close();

    // Display results
    console.log('\n📊 Results:');
    if (options.structured) {
      console.log(`📄 Title: ${result.title || 'N/A'}`);
      console.log(`📝 Paragraphs: ${result.paragraphs.length}`);
      console.log(`🔗 Links: ${result.links.length}`);
      console.log(`📑 Headings: ${Object.values(result.headings).flat().length}`);
      console.log(`📋 Lists: ${result.lists.length}`);
    } else {
      console.log(`📝 Text length: ${result.length} characters`);
      console.log(`📄 Preview: ${result.text.substring(0, 150)}...`);
    }

    // Save to file if requested
    if (options.outputFile) {
      const fs = await import('fs');
      fs.writeFileSync(options.outputFile, JSON.stringify(result, null, 2));
      console.log(`💾 Results saved to: ${options.outputFile}`);
    } else {
      console.log('\n📄 Full output:');
      console.log(JSON.stringify(result, null, 2));
    }

    console.log('\n✅ Scraping completed successfully!');

  } catch (error) {
    console.error(`❌ Scraping failed: ${error.message}`);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { main as scrapeCommand };