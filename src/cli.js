#!/usr/bin/env node

import { createRequire } from 'node:module';
import { InvalidArgumentError, program } from 'commander';
import { runListPresets } from './commands/list-presets.js';
import { runScrape } from './commands/scrape.js';
import { runShowPreset } from './commands/show-preset.js';
import { getErrorMessage } from './utils/get-error-message.js';

const require = createRequire(import.meta.url);
const packageJson = require('../package.json');

program
  .name('webscrapper')
  .description('Scrape text and structured content from websites with Playwright')
  .version(packageJson.version, '-v, --version', 'Output the current version');

program
  .command('scrape [urls...]', { isDefault: true })
  .description('Scrape one or more URLs')
  .option('-s, --structured', 'Extract structured content')
  .option('--browser <type>', 'Browser to use: chromium, firefox, or webkit (default: chromium)')
  .option('--timeout <ms>', 'Timeout in milliseconds (default: 30000)', parsePositiveInteger)
  .option('--headless', 'Run headlessly (default)')
  .option('--no-headless', 'Run with the browser window visible')
  .option('--no-follow-permanent-redirect', "Don't follow permanent redirects (301, 308)")
  .option('--no-follow-temporary-redirect', "Don't follow temporary redirects (302, 303, 307)")
  .option('--output <file>', 'Save output to a file')
  .option('--file <path>', 'Read URLs from a file (bulk mode)')
  .option('--preset <name>', 'Use a configuration preset')
  .option('--group-by <selector>', 'Create a structured result group (repeatable)', collect)
  .option('--plugin-file <path>', 'JavaScript module whose default export runs before scraping')
  .option('--format <format>', 'Bulk output format: json, txt, or csv (default: json)')
  .option('--batch-size <number>', 'URLs per batch (default: 5)', parsePositiveInteger)
  .option('--delay <ms>', 'Delay between batches in milliseconds (default: 1000)', parseNonNegativeInteger)
  .action(runScrape);

program
  .command('list-presets')
  .description('List available configuration presets')
  .action(runListPresets);

program
  .command('show-preset <name>')
  .description('Show the configuration for a preset')
  .action(runShowPreset);

if (process.argv.length === 2) {
  program.outputHelp();
} else {
  try {
    await program.parseAsync();
  } catch (error) {
    console.error(`❌ Error: ${getErrorMessage(error)}`);
    process.exitCode = 1;
  }
}

function collect(value, previous = []) {
  return previous.concat(value);
}

function parsePositiveInteger(value) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new InvalidArgumentError('must be a positive integer');
  }

  return parsed;
}

function parseNonNegativeInteger(value) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new InvalidArgumentError('must be a non-negative integer');
  }

  return parsed;
}
