import { WebScraper } from './scraper.js';
import { writeFileSync } from 'fs';

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