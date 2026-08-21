import { WebScraper } from './scraper.js';

async function runExamples() {
  const scraper = new WebScraper({
    headless: false, // Set to true to run without opening browser window
    timeout: 30000
  });

  try {
    console.log('=== Example 1: Basic text scraping ===');
    const basicResult = await scraper.scrapeText('https://example.com');
    console.log('URL:', basicResult.url);
    console.log('Text length:', basicResult.length);
    console.log('First 200 characters:', basicResult.text.substring(0, 200) + '...');
    console.log('---\n');

    console.log('=== Example 2: Structured content scraping ===');
    const structuredResult = await scraper.scrapeTextStructured('https://example.com');
    console.log('Title:', structuredResult.title);
    console.log('Headings:', structuredResult.headings);
    console.log('Number of paragraphs:', structuredResult.paragraphs.length);
    console.log('Number of links:', structuredResult.links.length);
    console.log('---\n');

    console.log('=== Example 3: Multiple pages ===');
    const urls = [
      'https://example.com',
      'https://httpbin.org/html'
    ];
    const multipleResults = await scraper.scrapeMultiplePages(urls);
    multipleResults.forEach((result, index) => {
      console.log(`Page ${index + 1}: ${result.url}`);
      console.log(`Success: ${!result.error}`);
      if (result.error) {
        console.log(`Error: ${result.error}`);
      } else {
        console.log(`Text length: ${result.length}`);
      }
    });
    console.log('---\n');

    console.log('=== Example 4: Custom configuration ===');
    const customScraper = new WebScraper({
      browser: 'firefox',
      excludeSelectors: ['script', 'style', 'nav', 'footer', 'header'],
      timeout: 15000
    });

    const customResult = await customScraper.scrapeText('https://example.com');
    console.log('Custom scraper result length:', customResult.length);
    await customScraper.close();
    console.log('---\n');

    console.log('=== Example 5: Named groups ===');
    const groupScraper = new WebScraper({
      groups: [
        { selector: 'h1', required: true, wait: true, name: 'main-heading' },
        { selector: 'p', required: false, wait: false, name: 'paragraph' }
      ]
    });
    
    const groupResult = await groupScraper.scrapeTextStructured('https://example.com');
    console.log('Title:', groupResult.title);
    console.log('Number of groups found:', groupResult.groups?.length || 0);
    if (groupResult.groups) {
      groupResult.groups.forEach((group, idx) => {
        console.log(`  Group ${idx + 1}: ${group.title || group.id}`);
      });
    }
    await groupScraper.close();

  } catch (error) {
    console.error('Example failed:', error.message);
  } finally {
    await scraper.close();
    process.exit(0);
  }
}

// Run examples if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runExamples();
}
