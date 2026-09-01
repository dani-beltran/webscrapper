import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { BulkScraper } from '../bulk-scraper.js';
import { ConfigurableScraper } from '../configurable-scraper.js';
import { RedirectError, WebScraper } from '../scraper.js';
import { getErrorMessage } from '../utils/get-error-message.js';

const DEFAULT_BROWSER = 'chromium';
const DEFAULT_TIMEOUT = 30000;
const DEFAULT_BATCH_SIZE = 5;
const DEFAULT_DELAY = 1000;
const DEFAULT_FORMAT = 'json';

/**
 * Run the scrape command using values parsed by Commander.
 *
 * Mode selection is kept compatible with the previous CLI: --file takes
 * precedence, followed by --preset, multiple URLs, and one URL.
 */
export async function runScrape(urls = [], options = {}, command) {
  const groupBy = options.groupBy ?? [];
  const plugin = options.pluginFile
    ? await loadPluginFromFile(options.pluginFile)
    : undefined;
  const scraperOptions = {
    browser: options.browser ?? DEFAULT_BROWSER,
    headless: options.headless !== false,
    timeout: options.timeout ?? DEFAULT_TIMEOUT,
    followPermanentRedirect: options.followPermanentRedirect !== false,
    followTemporaryRedirect: options.followTemporaryRedirect !== false,
    plugin
  };

  if (options.file) {
    await runBulkScrape({
      source: { type: 'file', path: options.file },
      scraperOptions,
      bulkOptions: createBulkOptions(options, groupBy)
    });
    return;
  }

  if (options.preset) {
    if (urls.length === 0) {
      throw new Error('URL is required when using --preset');
    }

    await runPresetScrape({
      url: urls[0],
      preset: options.preset,
      options,
      command,
      groupBy,
      plugin
    });
    return;
  }

  if (urls.length > 1) {
    await runBulkScrape({
      source: { type: 'urls', urls },
      scraperOptions,
      bulkOptions: createBulkOptions(options, groupBy)
    });
    return;
  }

  if (urls.length === 1) {
    await runSingleScrape(urls[0], {
      ...scraperOptions,
      structured: Boolean(options.structured) || groupBy.length > 0,
      outputFile: options.output ?? null,
      groupBy
    });
    return;
  }

  throw new Error('At least one URL is required');
}

function createBulkOptions(options, groupBy) {
  return {
    structured: Boolean(options.structured) || groupBy.length > 0,
    outputFormat: options.format ?? DEFAULT_FORMAT,
    batchSize: options.batchSize ?? DEFAULT_BATCH_SIZE,
    delay: options.delay ?? DEFAULT_DELAY,
    outputFile: options.output ?? null,
    groupBy
  };
}

async function loadPluginFromFile(filePath) {
  let pluginModule;

  try {
    pluginModule = await import(pathToFileURL(resolve(filePath)).href);
  } catch (error) {
    throw new Error(`Could not load plugin file "${filePath}": ${getErrorMessage(error)}`);
  }

  if (typeof pluginModule.default !== 'function') {
    throw new Error(`Plugin file "${filePath}" must default export a function`);
  }

  return pluginModule.default;
}

function selectorsToGroups(selectors) {
  return selectors.map(selector => ({
    selector,
    required: true,
    wait: true,
    name: selector
  }));
}

function isSupportedSingleUrl(url) {
  return url.startsWith('http') || url.startsWith('file://');
}

async function runSingleScrape(url, options) {
  if (!isSupportedSingleUrl(url)) {
    throw new Error('URL must start with http://, https://, or file://');
  }

  console.log(`🚀 Scraping: ${url}`);
  console.log(`🔧 Settings:
    🌎 Browser: ${options.browser} in ${options.headless ? 'Headless' : 'Headful'} mode
    🔄 Follow Permanent Redirects: ${options.followPermanentRedirect}
    🔄 Follow Temporary Redirects: ${options.followTemporaryRedirect}
    ⏰ Timeout: ${options.timeout}ms
    💾 Output ${options.outputFile ? `file: ${options.outputFile}` : 'in console'}
    ${options.structured ? '📊 Structured mode enabled' : '📝 Plain text mode'}
    📦 Grouping by selector: ${options.groupBy.join(', ') || 'None'}
    🧩 Pre-scrape plugin: ${options.plugin ? 'Enabled' : 'None'}
  `);

  const scraper = new WebScraper({
    browser: options.browser,
    headless: options.headless,
    timeout: options.timeout,
    followPermanentRedirect: options.followPermanentRedirect,
    followTemporaryRedirect: options.followTemporaryRedirect,
    groups: selectorsToGroups(options.groupBy),
    plugin: options.plugin
  });

  try {
    let result;

    try {
      result = options.structured
        ? await scraper.scrapeTextStructured(url)
        : await scraper.scrapeText(url);
    } catch (error) {
      if (!(error instanceof RedirectError)) throw error;
      displayRedirect(error, options.outputFile);
      return;
    }

    displaySingleResult(result, options);
  } finally {
    await scraper.close();
  }
}

function displayRedirect(error, outputFile) {
  console.log('\n🔄 Redirect Detected!');
  console.log(`   Status: ${error.status}`);
  console.log(`   Original URL: ${error.originalUrl}`);
  console.log(`   Redirects to: ${error.location}`);
  console.log(`   Message: ${getErrorMessage(error)}`);

  if (outputFile) {
    const redirectResult = {
      url: error.originalUrl,
      redirect: true,
      status: error.status,
      location: error.location,
      message: getErrorMessage(error),
      timestamp: error.timestamp
    };
    writeFileSync(outputFile, JSON.stringify(redirectResult, null, 2));
    console.log(`💾 Redirect info saved to: ${outputFile}`);
  }

  console.log('\n✅ Redirect detection completed!');
}

function displaySingleResult(result, options) {
  console.log('\n📊 Results:');

  if (options.structured) {
    console.log(`📄 Title: ${result.title || 'N/A'}`);

    if (result.groups) {
      console.log(`📦 Groups: ${result.groups.length}`);
      result.groups.forEach((group, index) => {
        console.log(`\n  Group ${index + 1} (${group.id}):`);
        if (group.title) console.log(`    Title: ${group.title}`);
        console.log(`    Paragraphs: ${group.paragraphs.length}`);
        console.log(`    Links: ${group.links.length}`);
        console.log(`    Headings: ${Object.values(group.headings).flat().length}`);
        console.log(`    Lists: ${group.lists.length}`);
      });
    } else {
      console.log(`📝 Paragraphs: ${result.paragraphs.length}`);
      console.log(`🔗 Links: ${result.links.length}`);
      console.log(`📑 Headings: ${Object.values(result.headings).flat().length}`);
      console.log(`📋 Lists: ${result.lists.length}`);
    }
  } else {
    console.log(`📝 Text length: ${result.length} characters`);
    console.log(`📄 Preview: ${result.text.substring(0, 150)}...`);
  }

  if (options.outputFile) {
    writeFileSync(options.outputFile, JSON.stringify(result, null, 2));
    console.log(`💾 Results saved to: ${options.outputFile}`);
  } else {
    console.log('\n📄 Full output:');
    console.log(JSON.stringify(result, null, 2));
  }

  console.log('\n✅ Scraping completed successfully!');
}

async function runBulkScrape({ source, scraperOptions, bulkOptions }) {
  if (!['json', 'txt', 'csv'].includes(bulkOptions.outputFormat)) {
    throw new Error(`Unsupported format "${bulkOptions.outputFormat}"`);
  }

  const urls = source.type === 'file'
    ? readUrlsFromFile(source.path)
    : validateBulkUrls(source.urls);

  console.log('🚀 Initializing bulk scraper...');
  console.log('🔧 Configuration:');
  console.log(`   Browser: ${scraperOptions.browser}`);
  console.log(`   Headless: ${scraperOptions.headless}`);
  console.log(`   Timeout: ${scraperOptions.timeout}ms`);
  console.log(`   Batch size: ${bulkOptions.batchSize}`);
  console.log(`   Delay: ${bulkOptions.delay}ms`);
  console.log(`   Structured: ${bulkOptions.structured}`);
  console.log(`   Output format: ${bulkOptions.outputFormat}`);
  if (bulkOptions.groupBy.length > 0) {
    console.log(`   Group by selector: ${bulkOptions.groupBy}`);
  }

  const bulkScraper = new BulkScraper({
    ...scraperOptions,
    groups: selectorsToGroups(bulkOptions.groupBy)
  });

  try {
    if (source.type === 'file') {
      console.log(`📁 Reading URLs from file: ${source.path}`);
      console.log(`📋 Found ${urls.length} valid URLs in file`);
    } else {
      console.log(`📋 Scraping ${urls.length} provided URLs`);
    }

    const results = await bulkScraper.scrapeUrls(urls, bulkOptions);
    displayBulkResult(results, bulkOptions.outputFile);
  } finally {
    await bulkScraper.close();
  }
}

function readUrlsFromFile(filePath) {
  let fileContent;

  try {
    fileContent = readFileSync(filePath, 'utf8');
  } catch (error) {
    throw new Error(`Failed to read file "${filePath}": ${getErrorMessage(error)}`);
  }

  const urls = fileContent
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && line.startsWith('http'));

  if (urls.length === 0) {
    throw new Error(`Failed to read file "${filePath}": No valid URLs found in file`);
  }

  return urls;
}

function validateBulkUrls(urls) {
  const invalidUrls = urls.filter(url => !url.startsWith('http'));

  if (invalidUrls.length > 0) {
    throw new Error(`Invalid URLs (must start with http:// or https://): ${invalidUrls.join(', ')}`);
  }

  return urls;
}

function displayBulkResult(results, outputFile) {
  const successful = results.filter(result => !result.error).length;

  console.log('\n🎉 Bulk scraping completed!');
  console.log('📊 Statistics:');
  console.log(`   Total URLs: ${results.length}`);
  console.log(`   Successful: ${successful}`);
  console.log(`   Failed: ${results.length - successful}`);
  console.log(`   Success rate: ${((successful / results.length) * 100).toFixed(1)}%`);

  if (outputFile) return;

  console.log('\n📋 Results summary:');
  results.forEach((result, index) => {
    const status = result.error ? '❌ Error' : '✅ Success';
    const length = result.error ? '' : ` (${result.length || result.text?.length || 0} chars)`;
    console.log(`${index + 1}. ${result.url} - ${status}${length}`);
    if (result.error) console.log(`   └─ ${result.error}`);
  });

  console.log('\n💡 Tip: Use --output <filename> to save results to a file');
}

async function runPresetScrape({ url, preset, options, command, groupBy, plugin }) {
  if (!isSupportedSingleUrl(url)) {
    throw new Error('URL must start with http://, https://, or file://');
  }

  const presets = ConfigurableScraper.listPresets();
  if (!presets.includes(preset)) {
    throw new Error(
      `Unknown preset: ${preset}\n\nAvailable presets:\n${presets.map(name => `   - ${name}`).join('\n')}`
    );
  }

  const customOptions = {};
  copyExplicitOption(customOptions, 'browser', options, command);
  copyExplicitOption(customOptions, 'timeout', options, command);
  copyExplicitOption(customOptions, 'headless', options, command);
  copyExplicitOption(customOptions, 'followPermanentRedirect', options, command);
  copyExplicitOption(customOptions, 'followTemporaryRedirect', options, command);
  if (plugin) customOptions.plugin = plugin;

  console.log(`🚀 Scraping: ${url}`);
  console.log(`🎨 Using preset: ${preset}`);
  if (Object.keys(customOptions).length > 0) {
    const printableOptions = { ...customOptions };
    if (printableOptions.plugin) printableOptions.plugin = '[Function]';
    console.log(`🔧 Custom options: ${JSON.stringify(printableOptions)}`);
  }
  if (groupBy.length > 0) console.log(`📦 Grouping by selector: ${groupBy}`);

  const scraper = new ConfigurableScraper(preset, {
    groups: selectorsToGroups(groupBy),
    ...customOptions
  });

  try {
    const result = await scraper.scrapeTextStructured(url);
    displayPresetResult(result);

    if (options.output) {
      writeFileSync(options.output, JSON.stringify(result, null, 2));
      console.log(`\n💾 Results saved to: ${options.output}`);
    }

    console.log('\n✅ Scraping completed successfully!');
  } finally {
    await scraper.close();
  }
}

function copyExplicitOption(target, name, options, command) {
  const isExplicit = command
    ? command.getOptionValueSource(name) === 'cli'
    : options[name] !== undefined;

  if (isExplicit) target[name] = options[name];
}

function displayPresetResult(result) {
  console.log('\n📊 Detailed Results:');
  console.log(`📄 Title: ${result.title || 'N/A'}`);
  console.log(`🌐 URL: ${result.url}`);

  if (result.groups) {
    console.log(`\n📦 Groups (${result.groups.length}):`);
    result.groups.forEach((group, index) => {
      console.log(`\n  Group ${index + 1} (${group.id}):`);
      if (group.title) console.log(`    Title: ${group.title}`);
      console.log(`    Paragraphs: ${group.paragraphs.length}`);
      console.log(`    Links: ${group.links.length}`);
      console.log(`    Headings: ${Object.values(group.headings).flat().length}`);
      console.log(`    Lists: ${group.lists.length}`);

      if (group.paragraphs.length > 0) {
        console.log('\n    First paragraph:');
        console.log(`    ${group.paragraphs[0].substring(0, 100)}...`);
      }
    });
    return;
  }

  console.log(`📝 Paragraphs (${result.paragraphs.length}):`);
  result.paragraphs.slice(0, 3).forEach((paragraph, index) => {
    const suffix = paragraph.length > 100 ? '...' : '';
    console.log(`   ${index + 1}. ${paragraph.substring(0, 100)}${suffix}`);
  });
  if (result.paragraphs.length > 3) {
    console.log(`   ... and ${result.paragraphs.length - 3} more`);
  }

  console.log('\n📑 All headings:');
  Object.entries(result.headings).forEach(([tag, headings]) => {
    if (headings.length > 0) console.log(`   ${tag.toUpperCase()}: ${headings.join(', ')}`);
  });

  console.log(`\n🔗 Links (${result.links.length}):`);
  result.links.slice(0, 5).forEach((link, index) => {
    console.log(`   ${index + 1}. ${link.text} → ${link.href}`);
  });
  if (result.links.length > 5) console.log(`   ... and ${result.links.length - 5} more`);
}
