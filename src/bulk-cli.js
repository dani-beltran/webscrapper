#!/usr/bin/env node

import { BulkScraper } from './bulk-scraper.js';

function showHelp() {
  console.log(`
🕷️  Bulk Web Scraper CLI

Usage: node src/bulk-cli.js <mode> [options]

Modes:
  urls <url1> <url2> ...     - Scrape specific URLs
  file <path>               - Scrape URLs from file (one per line)

Options:
  --structured              - Extract structured content
  --output <filename>       - Save results to file
  --format <json|txt|csv>   - Output format (default: json)
  --batch-size <number>     - URLs per batch (default: 5)
  --delay <ms>              - Delay between batches (default: 1000)
  --browser <type>          - Browser to use: chromium, firefox, webkit
  --timeout <ms>            - Timeout in milliseconds (default: 30000)
  --headless                - Run in headless mode (default: true)
  --no-headless             - Run with browser window visible
  --help, -h                - Show this help message

Examples:
  node src/bulk-cli.js urls https://example.com https://google.com
  node src/bulk-cli.js file urls.txt --output results.json --structured
  node src/bulk-cli.js urls https://news-site.com --browser firefox --format csv
  node src/bulk-cli.js file urls.txt --batch-size 3 --delay 2000 --no-headless
`);
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    showHelp();
    process.exit(0);
  }

  const mode = args[0];
  let urls = [];
  let scraperOptions = {
    headless: true,
    browser: 'chromium',
    timeout: 30000
  };
  let bulkOptions = {
    structured: false,
    outputFormat: 'json',
    batchSize: 5,
    delay: 1000,
    outputFile: null
  };

  // Parse arguments
  for (let i = 1; i < args.length; i++) {
    switch (args[i]) {
      case '--output':
        bulkOptions.outputFile = args[++i];
        break;
      case '--format':
        bulkOptions.outputFormat = args[++i];
        break;
      case '--batch-size':
        bulkOptions.batchSize = parseInt(args[++i]);
        break;
      case '--delay':
        bulkOptions.delay = parseInt(args[++i]);
        break;
      case '--browser':
        scraperOptions.browser = args[++i];
        break;
      case '--timeout':
        scraperOptions.timeout = parseInt(args[++i]);
        break;
      case '--structured':
        bulkOptions.structured = true;
        break;
      case '--headless':
        scraperOptions.headless = true;
        break;
      case '--no-headless':
        scraperOptions.headless = false;
        break;
      default:
        if (mode === 'urls' && !args[i].startsWith('--')) {
          urls.push(args[i]);
        }
    }
  }

  // Validation
  if (mode === 'urls' && urls.length === 0) {
    console.error('❌ Error: No URLs provided for "urls" mode');
    showHelp();
    process.exit(1);
  }

  if (mode === 'file' && !args[1]) {
    console.error('❌ Error: File path required for "file" mode');
    showHelp();
    process.exit(1);
  }

  if (!['urls', 'file'].includes(mode)) {
    console.error(`❌ Error: Unknown mode "${mode}"`);
    showHelp();
    process.exit(1);
  }

  if (!['json', 'txt', 'csv'].includes(bulkOptions.outputFormat)) {
    console.error(`❌ Error: Unsupported format "${bulkOptions.outputFormat}"`);
    process.exit(1);
  }

  // Validate URLs if in URLs mode
  if (mode === 'urls') {
    const invalidUrls = urls.filter(url => !url.startsWith('http'));
    if (invalidUrls.length > 0) {
      console.error(`❌ Error: Invalid URLs (must start with http:// or https://): ${invalidUrls.join(', ')}`);
      process.exit(1);
    }
  }

  try {
    console.log('🚀 Initializing bulk scraper...');
    console.log(`🔧 Configuration:`);
    console.log(`   Browser: ${scraperOptions.browser}`);
    console.log(`   Headless: ${scraperOptions.headless}`);
    console.log(`   Timeout: ${scraperOptions.timeout}ms`);
    console.log(`   Batch size: ${bulkOptions.batchSize}`);
    console.log(`   Delay: ${bulkOptions.delay}ms`);
    console.log(`   Structured: ${bulkOptions.structured}`);
    console.log(`   Output format: ${bulkOptions.outputFormat}`);
    
    const bulkScraper = new BulkScraper(scraperOptions);
    
    let results;
    if (mode === 'file') {
      const filePath = args[1];
      console.log(`📁 Reading URLs from file: ${filePath}`);
      
      // First, read and validate the file
      try {
        const fs = await import('fs');
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const fileUrls = fileContent
          .split('\n')
          .map(line => line.trim())
          .filter(line => line && line.startsWith('http'));
        
        if (fileUrls.length === 0) {
          throw new Error('No valid URLs found in file');
        }
        
        console.log(`📋 Found ${fileUrls.length} valid URLs in file`);
        results = await bulkScraper.scrapeUrls(fileUrls, bulkOptions);
      } catch (fileError) {
        throw new Error(`Failed to read file "${filePath}": ${fileError.message}`);
      }
    } else if (mode === 'urls') {
      console.log(`📋 Scraping ${urls.length} provided URLs`);
      results = await bulkScraper.scrapeUrls(urls, bulkOptions);
    }
    
    console.log(`\n🎉 Bulk scraping completed!`);
    console.log(`📊 Statistics:`);
    console.log(`   Total URLs: ${results.length}`);
    console.log(`   Successful: ${results.filter(r => !r.error).length}`);
    console.log(`   Failed: ${results.filter(r => r.error).length}`);
    console.log(`   Success rate: ${((results.filter(r => !r.error).length / results.length) * 100).toFixed(1)}%`);
    
    if (!bulkOptions.outputFile) {
      console.log('\n📋 Results summary:');
      results.forEach((result, index) => {
        const status = result.error ? '❌ Error' : '✅ Success';
        const length = result.error ? '' : ` (${result.length || result.text?.length || 0} chars)`;
        console.log(`${index + 1}. ${result.url} - ${status}${length}`);
        if (result.error) {
          console.log(`   └─ ${result.error}`);
        }
      });
      
      console.log('\n💡 Tip: Use --output <filename> to save results to a file');
    }
    
    await bulkScraper.close();
    
  } catch (error) {
    console.error('❌ Bulk scraping failed:', error.message);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { main as bulkScrapeCLI };