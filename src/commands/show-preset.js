#!/usr/bin/env node

import { ConfigurableScraper } from '../configurable-scraper.js';

/**
 * Show configuration details for a specific preset
 * @param {string} presetName - The name of the preset to display
 */
export async function showPreset(presetName) {
  if (!presetName) {
    console.error('❌ Please specify a preset name');
    console.log('\n💡 Available presets:');
    const presets = ConfigurableScraper.listPresets();
    if (presets.length === 0) {
      console.log('  No presets found. Check your config.json file.');
    } else {
      presets.forEach(preset => {
        console.log(`   - ${preset}`);
      });
    }
    process.exit(1);
  }
  
  const presetConfig = ConfigurableScraper.getPresetConfig(presetName);
  
  if (presetConfig) {
    console.log(`\n⚙️  Configuration for preset "${presetName}":`);
    console.log(JSON.stringify(presetConfig, null, 2));
    
    // Display some additional helpful info
    console.log(`\n💡 Use this preset with: node src/scrape.js --preset ${presetName} <url>`);
  } else {
    console.error(`❌ Preset "${presetName}" not found`);
    console.log('\n💡 Available presets:');
    const presets = ConfigurableScraper.listPresets();
    presets.forEach(preset => {
      console.log(`   - ${preset}`);
    });
    process.exit(1);
  }
}

/**
 * Main function for standalone execution
 */
async function main() {
  const args = process.argv.slice(2);
  
  // Show help if requested
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
🕷️  Show Preset Command

Usage: 
  node src/commands/show-preset.js <preset-name> [options]

Arguments:
  <preset-name>    - The name of the preset to display

Options:
  --help, -h       - Show this help message

Description:
  Displays the complete configuration for a specific preset defined
  in config.json. This includes selectors, browser options, and any
  other configuration settings for the preset.

Examples:
  node src/commands/show-preset.js news
  node src/commands/show-preset.js blog
  node src/commands/show-preset.js --help
`);
    process.exit(0);
  }
  
  const presetName = args[0];
  
  try {
    await showPreset(presetName);
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
