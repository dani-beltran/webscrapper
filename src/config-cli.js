#!/usr/bin/env node

import { ConfigurableScraper } from './configurable-scraper.js';

function showHelp() {
  console.log(`
🔧 Configurable Web Scraper CLI

Usage: node src/config-cli.js <command> [options]

Commands:
  scrape <url> [preset]     - Scrape a single URL with optional preset
  list-presets             - List available configuration presets
  show-preset <name>       - Show configuration for a specific preset
  help, --help, -h         - Show this help message

Options for scrape command:
  --output <file>          - Save results to file (JSON format)
  --format <type>          - Output format: summary, full, json (default: summary)
  --browser <type>         - Browser to use: chromium, firefox, webkit
  --timeout <ms>           - Timeout in milliseconds
  --headless               - Run in headless mode (default: true)
  --no-headless            - Run with browser window visible

Available presets: ${ConfigurableScraper.listPresets().join(', ') || 'Loading...'}

Examples:
  node src/config-cli.js scrape https://news-site.com news
  node src/config-cli.js scrape https://docs.site.com documentation --output results.json
  node src/config-cli.js scrape https://example.com --browser firefox --no-headless
  node src/config-cli.js list-presets
  node src/config-cli.js show-preset news
`);
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args.includes('help') || args.includes('--help') || args.includes('-h')) {
    showHelp();
    process.exit(0);
  }

  const command = args[0];

  try {
    switch (command) {
      case 'list-presets':
        const presets = ConfigurableScraper.listPresets();
        console.log('\n📋 Available configuration presets:');
        if (presets.length === 0) {
          console.log('  No presets found. Check your config.json file.');
        } else {
          presets.forEach(preset => {
            console.log(`  • ${preset}`);
          });
        }
        console.log('\n💡 Use "show-preset <name>" to see configuration details');
        break;

      case 'show-preset':
        const presetName = args[1];
        if (!presetName) {
          console.error('❌ Please specify a preset name');
          console.log('\n💡 Available presets:');
          ConfigurableScraper.listPresets().forEach(preset => {
            console.log(`   • ${preset}`);
          });
          process.exit(1);
        }
        
        const presetConfig = ConfigurableScraper.getPresetConfig(presetName);
        if (presetConfig) {
          console.log(`\n⚙️  Configuration for preset "${presetName}":`);
          console.log(JSON.stringify(presetConfig, null, 2));
        } else {
          console.error(`❌ Preset "${presetName}" not found`);
          console.log('\n💡 Available presets:');
          ConfigurableScraper.listPresets().forEach(preset => {
            console.log(`   • ${preset}`);
          });
        }
        break;

      case 'scrape':
        await handleScrapeCommand(args.slice(1));
        break;

      default:
        console.error(`❌ Unknown command: ${command}`);
        showHelp();
        process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

async function handleScrapeCommand(args) {
  if (args.length === 0) {
    console.error('❌ Please specify a URL to scrape');
    console.log('\n💡 Usage: node src/config-cli.js scrape <url> [preset] [options]');
    process.exit(1);
  }

  const url = args[0];
  let preset = null;
  let options = {
    outputFile: null,
    format: 'summary', // summary, full, json
    customOptions: {}
  };

  // Parse arguments
  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--output':
        options.outputFile = args[++i];
        break;
      case '--format':
        options.format = args[++i];
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
      default:
        if (!arg.startsWith('--') && preset === null) {
          // First non-option argument after URL is the preset
          preset = arg;
        }
    }
  }

  // Validate URL
  if (!url.startsWith('http')) {
    console.error('❌ URL must start with http:// or https://');
    process.exit(1);
  }

  // Validate format
  if (!['summary', 'full', 'json'].includes(options.format)) {
    console.error('❌ Format must be: summary, full, or json');
    process.exit(1);
  }

  // Validate preset if provided
  if (preset && !ConfigurableScraper.listPresets().includes(preset)) {
    console.error(`❌ Unknown preset: ${preset}`);
    console.log('\n💡 Available presets:');
    ConfigurableScraper.listPresets().forEach(p => {
      console.log(`   • ${p}`);
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
  
  const scraper = new ConfigurableScraper(preset, options.customOptions);
  const result = await scraper.scrapeTextStructured(url);
  
  // Display results based on format
  switch (options.format) {
    case 'summary':
      console.log('\n📊 Results Summary:');
      console.log(`📄 Title: ${result.title || 'N/A'}`);
      console.log(`📝 Text length: ${result.paragraphs.join(' ').length} characters`);
      console.log(`📑 Headings: ${Object.values(result.headings).flat().length}`);
      console.log(`🔗 Links: ${result.links.length}`);
      console.log(`📋 Lists: ${result.lists.length}`);
      
      if (result.headings.h1 && result.headings.h1.length > 0) {
        console.log(`\n🏷️  Main headings:`);
        result.headings.h1.forEach(h => console.log(`   • ${h}`));
      }
      break;
      
    case 'full':
      console.log('\n📊 Detailed Results:');
      console.log(`📄 Title: ${result.title || 'N/A'}`);
      console.log(`🌐 URL: ${result.url}`);
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

export { main as configurableScrapeCLI };