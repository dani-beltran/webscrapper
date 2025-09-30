import { WebScraper } from './scraper.js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class ConfigurableScraper {
  constructor(preset = null, customOptions = {}) {
    this.config = this.loadConfig();
    
    let options = { ...this.config.defaultOptions };
    
    // Apply preset if specified
    if (preset && this.config.presets[preset]) {
      options = { ...options, ...this.config.presets[preset] };
    }
    
    // Apply custom options
    options = { ...options, ...customOptions };
    
    this.scraper = new WebScraper(options);
    this.preset = preset;
  }

  loadConfig() {
    try {
      const configPath = join(__dirname, '..', 'config.json');
      const configData = readFileSync(configPath, 'utf-8');
      return JSON.parse(configData);
    } catch (error) {
      console.warn('Could not load config.json, using defaults');
      return {
        defaultOptions: {
          browser: 'chromium',
          headless: true,
          timeout: 30000
        },
        presets: {}
      };
    }
  }

  async scrapeText(url) {
    return await this.scraper.scrapeText(url);
  }

  async scrapeTextStructured(url) {
    return await this.scraper.scrapeTextStructured(url);
  }

  async scrapeMultiplePages(urls, structured = false) {
    return await this.scraper.scrapeMultiplePages(urls, structured);
  }

  async close() {
    await this.scraper.close();
  }

  static listPresets() {
    try {
      const configPath = join(dirname(fileURLToPath(import.meta.url)), '..', 'config.json');
      const config = JSON.parse(readFileSync(configPath, 'utf-8'));
      return Object.keys(config.presets);
    } catch (error) {
      return [];
    }
  }

  static getPresetConfig(presetName) {
    try {
      const configPath = join(dirname(fileURLToPath(import.meta.url)), '..', 'config.json');
      const config = JSON.parse(readFileSync(configPath, 'utf-8'));
      return config.presets[presetName] || null;
    } catch (error) {
      return null;
    }
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`
🔧 Configurable Web Scraper

Usage: node src/configurable-scraper.js <command> [options]

Commands:
  scrape <url> [preset]     - Scrape a single URL with optional preset
  list-presets             - List available configuration presets
  show-preset <name>       - Show configuration for a specific preset

Available presets: ${ConfigurableScraper.listPresets().join(', ')}

Examples:
  node src/configurable-scraper.js scrape https://news-site.com news
  node src/configurable-scraper.js scrape https://docs.site.com documentation
  node src/configurable-scraper.js list-presets
`);
    process.exit(0);
  }

  const command = args[0];

  try {
    switch (command) {
      case 'list-presets':
        const presets = ConfigurableScraper.listPresets();
        console.log('\n📋 Available presets:');
        presets.forEach(preset => {
          console.log(`  • ${preset}`);
        });
        break;

      case 'show-preset':
        const presetName = args[1];
        if (!presetName) {
          console.error('❌ Please specify a preset name');
          process.exit(1);
        }
        const presetConfig = ConfigurableScraper.getPresetConfig(presetName);
        if (presetConfig) {
          console.log(`\n⚙️  Configuration for preset "${presetName}":`);
          console.log(JSON.stringify(presetConfig, null, 2));
        } else {
          console.error(`❌ Preset "${presetName}" not found`);
        }
        break;

      case 'scrape':
        const url = args[1];
        const preset = args[2] || null;
        
        if (!url) {
          console.error('❌ Please specify a URL to scrape');
          process.exit(1);
        }

        console.log(`🚀 Scraping ${url}${preset ? ` with preset "${preset}"` : ''}`);
        
        const scraper = new ConfigurableScraper(preset);
        const result = await scraper.scrapeTextStructured(url);
        
        console.log('\n📊 Results:');
        console.log(`Title: ${result.title}`);
        console.log(`Text length: ${result.paragraphs.join(' ').length} characters`);
        console.log(`Headings: ${Object.values(result.headings).flat().length}`);
        console.log(`Links: ${result.links.length}`);
        console.log(`Lists: ${result.lists.length}`);
        
        if (result.headings.h1) {
          console.log(`\nMain headings: ${result.headings.h1.join(', ')}`);
        }
        
        await scraper.close();
        break;

      default:
        console.error(`❌ Unknown command: ${command}`);
        process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}