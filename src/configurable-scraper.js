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

  async scrapeTextStructured(url, options = {}) {
    return await this.scraper.scrapeTextStructured(url, options);
  }

  async scrapeMultiplePages(urls, structured = false, options = {}) {
    return await this.scraper.scrapeMultiplePages(urls, structured, options);
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