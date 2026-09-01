import { ConfigurableScraper } from '../configurable-scraper.js';

/** List all preset names defined in config.json. */
export async function runListPresets() {
  const presets = ConfigurableScraper.listPresets();

  console.log('\n📋 Available configuration presets:');

  if (presets.length === 0) {
    console.log('  No presets found. Check your config.json file.');
    console.log('\n💡 Create presets by adding them to the "presets" section in config.json');
    return;
  }

  presets.forEach(preset => console.log(`  - ${preset}`));

  console.log(`\n📊 Total presets: ${presets.length}`);
  console.log('\n💡 Use "webscrapper show-preset <name>" to see configuration details');
  console.log('💡 Use "webscrapper scrape --preset <name> <url>" to scrape with a preset');
}
