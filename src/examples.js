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

    console.log('=== Example 5: Multiple section selectors ===');
    const sectionScraper = new WebScraper({
      sectionSelectors: ['h1', 'p']
    });
    
    const sectionResult = await sectionScraper.scrapeTextStructured('https://example.com');
    console.log('Title:', sectionResult.title);
    console.log('Number of sections found:', sectionResult.sections?.length || 0);
    if (sectionResult.sections) {
      sectionResult.sections.forEach((section, idx) => {
        console.log(`  Section ${idx + 1}: ${section.title || section.id}`);
      });
    }
    await sectionScraper.close();

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