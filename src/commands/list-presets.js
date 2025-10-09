#!/usr/bin/env node

import { ConfigurableScraper } from '../configurable-scraper.js';

/**
 * List all available configuration presets
 * This command displays all preset names defined in config.json
 */
export async function listPresets() {
  const presets = ConfigurableScraper.listPresets();
  
  console.log('\n📋 Available configuration presets:');
  
  if (presets.length === 0) {
    console.log('  No presets found. Check your config.json file.');
    console.log('\n💡 Create presets by adding them to the "presets" section in config.json');
    return;
  }
  
  presets.forEach(preset => {
    console.log(`  - ${preset}`);
  });
  
  console.log(`\n📊 Total presets: ${presets.length}`);
  console.log('\n💡 Use "show-preset <name>" to see configuration details');
  console.log('💡 Use "scrape --preset <name> <url>" to scrape with a preset');
}

/**
 * Main function for standalone execution
 */
async function main() {
  const args = process.argv.slice(2);
  
  // Show help if requested
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
🕷️  List Presets Command

Usage: 
  node src/commands/list-presets.js [options]

Options:
  --help, -h    - Show this help message

Description:
  Lists all available configuration presets defined in config.json.
  Presets allow you to define reusable scraping configurations with
  specific selectors and options.

Example:
  node src/commands/list-presets.js
`);
    process.exit(0);
  }
  
  try {
    await listPresets();
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
