import { WebScraper } from './scraper.js';
import { writeFileSync } from 'fs';
import { join } from 'path';

export class BulkScraper {
  constructor(options = {}) {
    this.scraper = new WebScraper(options);
    this.outputDir = options.outputDir || './output';
  }

  async scrapeUrlsFromFile(filePath) {
    const fs = await import('fs');
    const urls = fs.readFileSync(filePath, 'utf-8')
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && line.startsWith('http'));
    
    return this.scrapeUrls(urls);
  }

  async scrapeUrls(urls, options = {}) {
    const {
      structured = false,
      outputFormat = 'json', // 'json', 'txt', 'csv'
      outputFile = null,
      batchSize = 5,
      delay = 1000
    } = options;

    const results = [];
    
    console.log(`📋 Starting bulk scraping of ${urls.length} URLs...`);
    
    // Process URLs in batches
    for (let i = 0; i < urls.length; i += batchSize) {
      const batch = urls.slice(i, i + batchSize);
      console.log(`🔄 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(urls.length / batchSize)}`);
      
      const batchResults = await this.scraper.scrapeMultiplePages(batch, structured);
      results.push(...batchResults);
      
      // Delay between batches
      if (i + batchSize < urls.length) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    // Save results if requested
    if (outputFile) {
      await this.saveResults(results, outputFile, outputFormat);
    }

    return results;
  }

  async saveResults(results, filename, format) {
    const fs = await import('fs');
    const path = await import('path');
    
    // Ensure output directory exists
    const outputPath = path.join(this.outputDir, filename);
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });

    switch (format.toLowerCase()) {
      case 'json':
        writeFileSync(outputPath, JSON.stringify(results, null, 2));
        break;
        
      case 'txt':
        const textContent = results
          .filter(r => !r.error)
          .map(r => `=== ${r.url} ===\n${r.text || this.extractTextFromStructured(r)}\n\n`)
          .join('');
        writeFileSync(outputPath, textContent);
        break;
        
      case 'csv':
        const csvContent = this.resultsToCSV(results);
        writeFileSync(outputPath, csvContent);
        break;
        
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
    
    console.log(`💾 Results saved to: ${outputPath}`);
  }

  extractTextFromStructured(result) {
    if (result.text) return result.text;
    
    let text = result.title ? `${result.title}\n\n` : '';
    
    if (result.headings) {
      Object.values(result.headings).flat().forEach(heading => {
        text += `${heading}\n`;
      });
      text += '\n';
    }
    
    if (result.paragraphs) {
      text += result.paragraphs.join('\n\n');
    }
    
    return text;
  }

  resultsToCSV(results) {
    const headers = ['url', 'success', 'text_length', 'title', 'error', 'timestamp'];
    const csvRows = [headers.join(',')];
    
    results.forEach(result => {
      const row = [
        `"${result.url || ''}"`,
        result.error ? 'false' : 'true',
        result.length || result.text?.length || 0,
        `"${result.title || ''}"`,
        `"${result.error || ''}"`,
        `"${result.timestamp || ''}"`
      ];
      csvRows.push(row.join(','));
    });
    
    return csvRows.join('\n');
  }

  async close() {
    await this.scraper.close();
  }
}

// CLI interface for bulk scraping
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`
Usage: node src/bulk-scraper.js <mode> [options]

Modes:
  urls <url1> <url2> ...     - Scrape specific URLs
  file <path>               - Scrape URLs from file (one per line)

Options:
  --structured              - Extract structured content
  --output <filename>       - Save results to file
  --format <json|txt|csv>   - Output format (default: json)
  --batch-size <number>     - URLs per batch (default: 5)
  --delay <ms>              - Delay between batches (default: 1000)

Examples:
  node src/bulk-scraper.js urls https://example.com https://google.com
  node src/bulk-scraper.js file urls.txt --output results.json --structured
`);
    process.exit(1);
  }

  const mode = args[0];
  let urls = [];
  let options = {
    structured: args.includes('--structured'),
    outputFormat: 'json',
    batchSize: 5,
    delay: 1000
  };

  // Parse arguments
  for (let i = 1; i < args.length; i++) {
    switch (args[i]) {
      case '--output':
        options.outputFile = args[++i];
        break;
      case '--format':
        options.outputFormat = args[++i];
        break;
      case '--batch-size':
        options.batchSize = parseInt(args[++i]);
        break;
      case '--delay':
        options.delay = parseInt(args[++i]);
        break;
      case '--structured':
        // Already handled above
        break;
      default:
        if (mode === 'urls' && !args[i].startsWith('--')) {
          urls.push(args[i]);
        }
    }
  }

  try {
    const bulkScraper = new BulkScraper({ headless: true });
    
    let results;
    if (mode === 'file') {
      const filePath = args[1];
      results = await bulkScraper.scrapeUrlsFromFile(filePath);
    } else if (mode === 'urls') {
      results = await bulkScraper.scrapeUrls(urls, options);
    } else {
      throw new Error(`Unknown mode: ${mode}`);
    }
    
    console.log(`\n✅ Completed scraping ${results.length} URLs`);
    console.log(`📊 Success rate: ${((results.filter(r => !r.error).length / results.length) * 100).toFixed(1)}%`);
    
    if (!options.outputFile) {
      console.log('\n📋 Results summary:');
      results.forEach((result, index) => {
        console.log(`${index + 1}. ${result.url} - ${result.error ? '❌ Error' : '✅ Success'}`);
      });
    }
    
    await bulkScraper.close();
  } catch (error) {
    console.error('❌ Bulk scraping failed:', error.message);
    process.exit(1);
  }
}