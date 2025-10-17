import { WebScraper } from './scraper.js';

async function runTests() {
  console.log('🧪 Running Web Scraper Tests...\n');

  let passed = 0;
  let failed = 0;

  const test = async (name, testFn) => {
    try {
      console.log(`🔍 Testing: ${name}`);
      await testFn();
      console.log(`✅ PASSED: ${name}\n`);
      passed++;
    } catch (error) {
      console.log(`❌ FAILED: ${name}`);
      console.log(`   Error: ${error.message}\n`);
      failed++;
    }
  };

  // Test 1: Basic scraper initialization
  await test('Scraper initialization', async () => {
    const scraper = new WebScraper();
    if (!scraper.options.browser) throw new Error('Browser option not set');
    if (scraper.options.timeout !== 30000) throw new Error('Default timeout not correct');
    await scraper.close();
  });

  // Test 2: Basic text scraping
  await test('Basic text scraping', async () => {
    const scraper = new WebScraper({ headless: true });
    const result = await scraper.scrapeText('https://example.com');
    
    if (!result.url) throw new Error('URL not in result');
    if (!result.text) throw new Error('No text extracted');
    if (result.length <= 0) throw new Error('Text length is 0');
    if (!result.timestamp) throw new Error('Timestamp not in result');
    
    await scraper.close();
  });

  // Test 3: Structured content scraping
  await test('Structured content scraping', async () => {
    const scraper = new WebScraper({ headless: true });
    const result = await scraper.scrapeTextStructured('https://example.com');
    
    if (!result.title) throw new Error('Title not extracted');
    if (!result.headings) throw new Error('Headings not extracted');
    if (!result.paragraphs) throw new Error('Paragraphs not extracted');
    if (!result.links) throw new Error('Links not extracted');
    
    await scraper.close();
  });

  // Test 4: Multiple pages scraping
  await test('Multiple pages scraping', async () => {
    const scraper = new WebScraper({ headless: true });
    const urls = ['https://example.com'];
    const results = await scraper.scrapeMultiplePages(urls);
    
    if (results.length !== 1) throw new Error('Results length mismatch');
    if (!results[0].url) throw new Error('URL not in results');
    
    await scraper.close();
  });

  // Test 5: Custom configuration
  await test('Custom configuration', async () => {
    const scraper = new WebScraper({
      browser: 'chromium',
      headless: true,
      timeout: 15000,
      excludeSelectors: ['script', 'style']
    });
    
    if (scraper.options.timeout !== 15000) throw new Error('Custom timeout not set');
    if (scraper.options.excludeSelectors.length < 2) throw new Error('Exclude selectors not set');
    
    await scraper.close();
  });

  // Test 6: Error handling
  await test('Error handling for invalid URL', async () => {
    const scraper = new WebScraper({ headless: true, timeout: 5000 });
    
    try {
      await scraper.scrapeText('https://this-domain-definitely-does-not-exist-12345.com');
      throw new Error('Should have thrown an error for invalid URL');
    } catch (error) {
      if (error.message.includes('Should have thrown')) throw error;
      // Expected error - test passes
    }
    
    await scraper.close();
  });

  // Test 7: Multiple section selectors (array)
  await test('Multiple section selectors as array', async () => {
    const scraper = new WebScraper({
      headless: true,
      sectionSelectors: ['article', 'section', '.content', 'main', 'div']
    });
    
    if (!Array.isArray(scraper.options.sectionSelectors)) {
      throw new Error('sectionSelectors should be an array');
    }
    if (scraper.options.sectionSelectors.length !== 5) {
      throw new Error('sectionSelectors array length mismatch');
    }
    
    const result = await scraper.scrapeTextStructured('https://example.com');
    if (!result.sections) throw new Error('Sections not extracted');
    if (!Array.isArray(result.sections)) throw new Error('Sections should be an array');
    
    await scraper.close();
  });

  // Test 9: Override section selectors per request
  await test('Override section selectors per request', async () => {
    const scraper = new WebScraper({
      headless: true,
      sectionSelectors: ['div', 'article']
    });
    
    const result = await scraper.scrapeTextStructured('https://example.com');
    
    if (!result.sections) throw new Error('Sections not extracted');
    
    await scraper.close();
  });

  console.log('📊 Test Results:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

  if (failed === 0) {
    console.log('\n🎉 All tests passed!');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the errors above.');
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().catch(console.error);
}