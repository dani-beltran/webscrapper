import { ConfigurableScraper } from '../configurable-scraper.js';

/** Display the configuration for one preset. */
export async function runShowPreset(presetName) {
  const presetConfig = ConfigurableScraper.getPresetConfig(presetName);

  if (!presetConfig) {
    console.error(`❌ Preset "${presetName}" not found`);
    printAvailablePresets();
    process.exitCode = 1;
    return;
  }

  console.log(`\n⚙️  Configuration for preset "${presetName}":`);
  console.log(JSON.stringify(presetConfig, null, 2));
  console.log(`\n💡 Use this preset with: webscrapper scrape --preset ${presetName} <url>`);
}

function printAvailablePresets() {
  console.log('\n💡 Available presets:');
  const presets = ConfigurableScraper.listPresets();

  if (presets.length === 0) {
    console.log('  No presets found. Check your config.json file.');
    return;
  }

  presets.forEach(preset => console.log(`   - ${preset}`));
}
