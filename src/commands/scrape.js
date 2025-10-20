#!/usr/bin/env node

import { WebScraper, RedirectError } from '../scraper.js';
import { BulkScraper } from '../bulk-scraper.js';
import { ConfigurableScraper } from '../configurable-scraper.js';

function showHelp() {
  console.log(`
🕷️  Web Scraper CLI

Usage: 

node src/commands/scrape.js [command] [options] <url(s)>

Options:
  --structured, -s          - Extract structured content (headings, links, etc.)
  --browser <type>          - Browser to use: chromium, firefox, webkit (default: chromium)
  --timeout <ms>            - Timeout in milliseconds (default: 30000)
  --no-headless             - Run with browser window visible
  --no-follow-redirects     - Don't follow 301/302 redirects, return redirect info instead
  --output <file>           - Save output to file (JSON format)
  --file <path>             - Read URLs from file (triggers bulk mode)
  --help, -h                - Show this help message
  --preset <name>           - Use configuration preset (triggers config mode)
  --group-by <selector>     - CSS selector to group structured results by sections
  

Bulk Mode Options (when multiple URLs or --file used):
  --format <json|txt|csv>   - Output format (default: json)
  --batch-size <number>     - URLs per batch (default: 5)
  --delay <ms>              - Delay between batches (default: 1000)

Examples:
  # Single URL scraping
  node src/scrape.js "https://example.com"
  node src/scrape.js --structured "https://news-site.com"
  node src/scrape.js --group-by "article" "https://news-site.com"
  
  # Bulk scraping
  node src/scrape.js "https://example.com" "https://google.com"
  node src/scrape.js --file urls.txt --output results.json --structured
  
  # Configuration-based scraping
  node src/scrape.js --preset news "https://news-site.com"
`);
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    showHelp();
    process.exit(0);
  }

  // Automatic mode detection
  let mode = 'single';
  let actualArgs = args;

  // Check for file mode
  if (args.includes('--file')) {
    mode = 'bulk';
    const fileIndex = args.indexOf('--file');
    const filePath = args[fileIndex + 1];
    const otherArgs = args.filter((arg, i) => 
      arg !== '--file' && 
      i !== fileIndex + 1
    );
    actualArgs = ['file', filePath, ...otherArgs];
  }
  // Check for preset mode
  else if (args.includes('--preset')) {
    mode = 'config';
    const presetIndex = args.indexOf('--preset');
    const presetName = args[presetIndex + 1];
    const urls = args.filter(arg => arg.startsWith('http') || arg.startsWith('file://'));
    if (urls.length === 0) {
      console.error('❌ Error: URL is required when using --preset');
      process.exit(1);
    }
    // Rearrange args for config mode: ['scrape', url, preset, ...otherArgs]
    const otherArgs = args.filter((arg, i) => 
      arg !== '--preset' && 
      i !== presetIndex + 1 && 
      !arg.startsWith('http') && 
      !arg.startsWith('file://')
    );
    actualArgs = ['scrape', urls[0], presetName, ...otherArgs];
  }
  // Check for multiple URLs (bulk mode)
  else {
    const urls = args.filter(arg => arg.startsWith('http') || arg.startsWith('file://'));
    if (urls.length > 1) {
      mode = 'bulk';
      const nonUrlArgs = args.filter(arg => !arg.startsWith('http') && !arg.startsWith('file://'));
      actualArgs = ['urls', ...urls, ...nonUrlArgs];
    }
    // Single URL mode (default)
    else if (urls.length === 1) {
      mode = 'single';
      actualArgs = args;
    }
    else {
      console.error('❌ Error: At least one URL is required');
      showHelp();
      process.exit(1);
    }
  }

  try {
    switch (mode) {
      case 'single':
        await handleSingleMode(actualArgs);
        break;
      case 'bulk':
        await handleBulkMode(actualArgs);
        break;
      case 'config':
        await handleConfigMode(actualArgs);
        break;
      default:
        console.error(`❌ Unknown mode: ${mode}`);
        showHelp();
        process.exit(1);
    }
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

async function handleSingleMode(args) {
  let url = null;
  const options = {
    browser: 'chromium',
    headless: true,
    timeout: 30000,
    structured: false,
    outputFile: null,
    groupBy: [],
    followRedirects: true
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
      case '--no-headless':
        options.headless = false;
        break;
      case '--no-follow-redirects':
        options.followRedirects = false;
        break;
      case '--output':
        options.outputFile = args[++i];
        break;
      case '--group-by':
        options.groupBy.push(args[++i]);
        options.structured = true; // Auto-enable structured mode when grouping
        break;
      case '--preset':
        // Skip preset handling in single mode - this should be handled by mode detection
        i++; // Skip the preset name
        break;
      case '--file':
        // Skip file handling in single mode - this should be handled by mode detection
        i++; // Skip the file path
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

  if (!url.startsWith('http') && !url.startsWith('file://')) {
    console.error('❌ Error: URL must start with http://, https://, or file://');
    process.exit(1);
  }

  console.log(`🚀 Scraping: ${url}`);
  console.log(`🔧 Browser: ${options.browser}, Headless: ${options.headless}, Structured: ${options.structured}`);
  console.log(`🔄 Follow Redirects: ${options.followRedirects}`);
  if (options.groupBy.length > 0) {
    console.log(`📦 Grouping by selector: ${options.groupBy}`);
  }
  
  const scraper = new WebScraper({
    browser: options.browser,
    headless: options.headless,
    timeout: options.timeout,
    followRedirects: options.followRedirects,
    sectionSelectors: options.groupBy
  });

  let result;
  try {
    result = options.structured 
      ? await scraper.scrapeTextStructured(url)
      : await scraper.scrapeText(url);
  } catch (error) {
    await scraper.close();
    
    // Check if it's a redirect error
    if (error instanceof RedirectError) {
      console.log('\n🔄 Redirect Detected!');
      console.log(`   Status: ${error.status}`);
      console.log(`   Original URL: ${error.originalUrl}`);
      console.log(`   Redirects to: ${error.location}`);
      console.log(`   Message: ${error.message}`);
      
      // Save redirect info if output file requested
      if (options.outputFile) {
        const fs = await import('fs');
        const redirectResult = {
          url: error.originalUrl,
          redirect: true,
          status: error.status,
          location: error.location,
          message: error.message,
          timestamp: error.timestamp
        };
        fs.writeFileSync(options.outputFile, JSON.stringify(redirectResult, null, 2));
        console.log(`💾 Redirect info saved to: ${options.outputFile}`);
      }
      
      console.log('\n✅ Redirect detection completed!');
      return;
    }
    
    // Re-throw if it's not a redirect error
    throw error;
  }

  await scraper.close();

  // Display results
  console.log('\n📊 Results:');
  
  if (options.structured) {
    console.log(`📄 Title: ${result.title || 'N/A'}`);
    
    if (result.sections) {
      console.log(`📦 Sections: ${result.sections.length}`);
      result.sections.forEach((section, i) => {
        console.log(`\n  Section ${i + 1} (${section.id}):`);
        if (section.title) console.log(`    Title: ${section.title}`);
        console.log(`    Paragraphs: ${section.paragraphs.length}`);
        console.log(`    Links: ${section.links.length}`);
        console.log(`    Headings: ${Object.values(section.headings).flat().length}`);
        console.log(`    Lists: ${section.lists.length}`);
      });
    } else {
      console.log(`📝 Paragraphs: ${result.paragraphs.length}`);
      console.log(`🔗 Links: ${result.links.length}`);
      console.log(`📑 Headings: ${Object.values(result.headings).flat().length}`);
      console.log(`📋 Lists: ${result.lists.length}`);
    }
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
}

async function handleBulkMode(args) {
  if (args.length === 0) {
    console.error('❌ Error: Bulk mode requires "urls" or "file" subcommand');
    showHelp();
    process.exit(1);
  }

  const subMode = args[0];
  let urls = [];
  let scraperOptions = {
    headless: true,
    browser: 'chromium',
    timeout: 30000,
    followRedirects: true
  };
  let bulkOptions = {
    structured: false,
    outputFormat: 'json',
    batchSize: 5,
    delay: 1000,
    outputFile: null,
    groupBy: []
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
      case '--group-by':
        bulkOptions.groupBy.push(args[++i]);
        bulkOptions.structured = true; // Auto-enable structured mode when grouping
        break;
      case '--headless':
        scraperOptions.headless = true;
        break;
      case '--no-headless':
        scraperOptions.headless = false;
        break;
      case '--no-follow-redirects':
        scraperOptions.followRedirects = false;
        break;
      default:
        if (subMode === 'urls' && !args[i].startsWith('--')) {
          urls.push(args[i]);
        }
    }
  }

  // Validation
  if (subMode === 'urls' && urls.length === 0) {
    console.error('❌ Error: No URLs provided for "urls" mode');
    showHelp();
    process.exit(1);
  }

  if (subMode === 'file' && !args[1]) {
    console.error('❌ Error: File path required for "file" mode');
    showHelp();
    process.exit(1);
  }

  if (!['urls', 'file'].includes(subMode)) {
    console.error(`❌ Error: Unknown bulk submode "${subMode}"`);
    showHelp();
    process.exit(1);
  }

  if (!['json', 'txt', 'csv'].includes(bulkOptions.outputFormat)) {
    console.error(`❌ Error: Unsupported format "${bulkOptions.outputFormat}"`);
    process.exit(1);
  }

  // Validate URLs if in URLs mode
  if (subMode === 'urls') {
    const invalidUrls = urls.filter(url => !url.startsWith('http'));
    if (invalidUrls.length > 0) {
      console.error(`❌ Error: Invalid URLs (must start with http:// or https://): ${invalidUrls.join(', ')}`);
      process.exit(1);
    }
  }

  console.log('🚀 Initializing bulk scraper...');
  console.log(`🔧 Configuration:`);
  console.log(`   Browser: ${scraperOptions.browser}`);
  console.log(`   Headless: ${scraperOptions.headless}`);
  console.log(`   Timeout: ${scraperOptions.timeout}ms`);
  console.log(`   Batch size: ${bulkOptions.batchSize}`);
  console.log(`   Delay: ${bulkOptions.delay}ms`);
  console.log(`   Structured: ${bulkOptions.structured}`);
  console.log(`   Output format: ${bulkOptions.outputFormat}`);
  if (bulkOptions.groupBy.length > 0) {
    console.log(`   Group by selector: ${bulkOptions.groupBy}`);
  };
  
  const bulkScraper = new BulkScraper(scraperOptions);
  
  let results;
  if (subMode === 'file') {
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
  } else if (subMode === 'urls') {
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
}

async function handleConfigMode(args) {
  if (args.length === 0) {
    console.error('❌ Error: Config mode requires a command');
    showHelp();
    process.exit(1);
  }

  const command = args[0];

  switch (command) {
    case 'scrape':
      await handleConfigScrapeCommand(args.slice(1));
      break;

    default:
      console.error(`❌ Unknown config command: ${command}`);
      showHelp();
      process.exit(1);
  }
}

async function handleConfigScrapeCommand(args) {
  if (args.length === 0) {
    console.error('❌ Please specify a URL to scrape');
    console.log('\n💡 Usage: node src/scrape.js config scrape <url> [preset] [options]');
    process.exit(1);
  }

  const url = args[0];
  let preset = null;
  let options = {
    outputFile: null,
    format: 'full', // Always use full format
    customOptions: {},
    groupBy: []
  };

  // Parse arguments
  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--output':
        options.outputFile = args[++i];
        break;
      case '--browser':
        options.customOptions.browser = args[++i];
        break;
      case '--timeout':
        options.customOptions.timeout = parseInt(args[++i]);
        break;
      case '--headless':
        options.customOptions.headless = true;
        break;
      case '--no-headless':
        options.customOptions.headless = false;
        break;
      case '--no-follow-redirects':
        options.customOptions.followRedirects = false;
        break;
      case '--group-by':
        options.groupBy.push(args[++i]);
        break;
      default:
        if (!arg.startsWith('--') && preset === null) {
          // First non-option argument after URL is the preset
          preset = arg;
        }
    }
  }

  // Validate URL
  if (!url.startsWith('http') && !url.startsWith('file://')) {
    console.error('❌ URL must start with http://, https://, or file://');
    process.exit(1);
  }

  // Validate preset if provided
  if (preset && !ConfigurableScraper.listPresets().includes(preset)) {
    console.error(`❌ Unknown preset: ${preset}`);
    console.log('\n💡 Available presets:');
    ConfigurableScraper.listPresets().forEach(p => {
      console.log(`   - ${p}`);
    });
    process.exit(1);
  }

  console.log(`🚀 Scraping: ${url}`);
  if (preset) {
    console.log(`🎨 Using preset: ${preset}`);
  }
  if (Object.keys(options.customOptions).length > 0) {
    console.log(`🔧 Custom options: ${JSON.stringify(options.customOptions)}`);
  }
  if (options.groupBy.length > 0) {
    console.log(`📦 Grouping by selector: ${options.groupBy}`);
  }

  const scraper = new ConfigurableScraper(preset, {groupBy: options.groupBy, ...options.customOptions});
  const result = await scraper.scrapeTextStructured(url);
  
  // Display results based on format
  switch (options.format) {
    case 'summary':
      console.log('\n📊 Results Summary:');
      console.log(`📄 Title: ${result.title || 'N/A'}`);
      
      if (result.sections) {
        console.log(`� Sections: ${result.sections.length}`);
        const totalParagraphs = result.sections.reduce((sum, s) => sum + s.paragraphs.length, 0);
        const totalLinks = result.sections.reduce((sum, s) => sum + s.links.length, 0);
        const totalHeadings = result.sections.reduce((sum, s) => sum + Object.values(s.headings).flat().length, 0);
        const totalLists = result.sections.reduce((sum, s) => sum + s.lists.length, 0);
        
        console.log(`�📝 Total paragraphs: ${totalParagraphs}`);
        console.log(`🔗 Total links: ${totalLinks}`);
        console.log(`📑 Total headings: ${totalHeadings}`);
        console.log(`📋 Total lists: ${totalLists}`);
      } else {
        console.log(`📝 Text length: ${result.paragraphs.join(' ').length} characters`);
        console.log(`📑 Headings: ${Object.values(result.headings).flat().length}`);
        console.log(`🔗 Links: ${result.links.length}`);
        console.log(`📋 Lists: ${result.lists.length}`);
      }
      
      if (result.headings?.h1 && result.headings.h1.length > 0) {
        console.log(`\n🏷️  Main headings:`);
        result.headings.h1.forEach(h => console.log(`   - ${h}`));
      }
      break;
      
    case 'full':
      console.log('\n📊 Detailed Results:');
      console.log(`📄 Title: ${result.title || 'N/A'}`);
      console.log(`🌐 URL: ${result.url}`);
      
      if (result.sections) {
        console.log(`\n📦 Sections (${result.sections.length}):`);
        result.sections.forEach((section, i) => {
          console.log(`\n  Section ${i + 1} (${section.id}):`);
          if (section.title) {
            console.log(`    Title: ${section.title}`);
          }
          console.log(`    Paragraphs: ${section.paragraphs.length}`);
          console.log(`    Links: ${section.links.length}`);
          console.log(`    Headings: ${Object.values(section.headings).flat().length}`);
          console.log(`    Lists: ${section.lists.length}`);
          
          if (section.paragraphs.length > 0) {
            console.log(`\n    First paragraph:`);
            console.log(`    ${section.paragraphs[0].substring(0, 100)}...`);
          }
        });
      } else {
        console.log(`📝 Paragraphs (${result.paragraphs.length}):`);
        result.paragraphs.slice(0, 3).forEach((p, i) => {
          console.log(`   ${i + 1}. ${p.substring(0, 100)}${p.length > 100 ? '...' : ''}`);
        });
        if (result.paragraphs.length > 3) {
          console.log(`   ... and ${result.paragraphs.length - 3} more`);
        }
        
        console.log(`\n📑 All headings:`);
        Object.entries(result.headings).forEach(([tag, headings]) => {
          if (headings.length > 0) {
            console.log(`   ${tag.toUpperCase()}: ${headings.join(', ')}`);
          }
        });
        
        console.log(`\n🔗 Links (${result.links.length}):`);
        result.links.slice(0, 5).forEach((link, i) => {
          console.log(`   ${i + 1}. ${link.text} → ${link.href}`);
        });
        if (result.links.length > 5) {
          console.log(`   ... and ${result.links.length - 5} more`);
        }
      }
      break;
      
    case 'json':
      console.log('\n📄 Full JSON output:');
      console.log(JSON.stringify(result, null, 2));
      break;
  }
  
  // Save to file if requested
  if (options.outputFile) {
    const fs = await import('fs');
    fs.writeFileSync(options.outputFile, JSON.stringify(result, null, 2));
    console.log(`\n💾 Results saved to: ${options.outputFile}`);
  }
  
  await scraper.close();
  console.log('\n✅ Scraping completed successfully!');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { 
  main as scrapeCommand,
  handleSingleMode as singleScrapeCommand,
  handleBulkMode as bulkScrapeCommand,
  handleConfigMode as configScrapeCommand
};