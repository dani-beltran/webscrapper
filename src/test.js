import { WebScraper, InteractionStepError } from './scraper.js';
import { SectionNotFoundError } from './errors/index.js';
import { mkdtempSync, writeFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { pathToFileURL } from 'url';

async function runTests() {
  console.log('🧪 Running Web Scraper Tests...\n');

  let passed = 0;
  let failed = 0;
  const testDir = mkdtempSync(join(tmpdir(), 'webscrapper-tests-'));
  const interactionFixturePath = join(testDir, 'interaction-fixture.html');
  const redirectFixturePath = join(testDir, 'redirect-fixture.html');
  writeFileSync(interactionFixturePath, `<!doctype html>
<html>
  <body>
    <button id="expand" onclick="document.querySelector('#content').textContent='Expanded content visible';">Expand</button>
    <div id="content">Collapsed</div>
    <div id="info" onmouseover="document.querySelector('#hover-output').textContent='Hovered details';">Info</div>
    <div id="hover-output">No hover yet</div>
  </body>
</html>`);
  writeFileSync(redirectFixturePath, `<!doctype html>
<html>
  <body>
    <div id="content">Initial content</div>
    <script>
      setTimeout(() => {
        location.hash = 'settled';
        document.body.innerHTML = '<div id="content">Settled content</div>';
      }, 50);
    </script>
  </body>
</html>`);
  const interactionFixtureUrl = pathToFileURL(interactionFixturePath).href;
  const redirectFixtureUrl = pathToFileURL(redirectFixturePath).href;

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

  // Test 3.5: Image extraction
  await test('Image extraction from structured content', async () => {
    const scraper = new WebScraper({ headless: true });
    const result = await scraper.scrapeTextStructured('https://google.com');
    
    if (!result.images) throw new Error('Images array not in result');
    if (!Array.isArray(result.images)) throw new Error('Images should be an array');

    if (result.images.length < 1) {
      throw new Error('No images extracted from the page');
    }
    
    // If there are images, verify their structure
    if (result.images.length > 0) {
      const img = result.images[0];
      if (!img.hasOwnProperty('src')) throw new Error('Image should have src property');
      if (!img.hasOwnProperty('alt')) throw new Error('Image should have alt property');
      if (!img.hasOwnProperty('title')) throw new Error('Image should have title property');
      if (typeof img.src !== 'string') throw new Error('Image src should be a string');
      if (typeof img.alt !== 'string') throw new Error('Image alt should be a string');
      if (typeof img.title !== 'string') throw new Error('Image title should be a string');
    }
    
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

  // Test 10: Redirect handling disabled
  await test('Redirect handling disabled', async () => {
    const scraper = new WebScraper({
      headless: true,
      followPermanentRedirect: false,
      followTemporaryRedirect: false
    });

    if (scraper.options.followPermanentRedirect !== false) {
      throw new Error('followPermanentRedirect should be false');
    }
    if (scraper.options.followTemporaryRedirect !== false) {
      throw new Error('followTemporaryRedirect should be false');
    }

    // Note: This test validates the option is set correctly
    // A real redirect test would require a server that returns 301/302
    await scraper.close();
  });

  // Test 11: Redirect handling enabled (default)
  await test('Redirect handling enabled by default', async () => {
    const scraper = new WebScraper({
      headless: true
    });

    if (scraper.options.followPermanentRedirect !== true) {
      throw new Error('followPermanentRedirect should be true by default');
    }
    if (scraper.options.followTemporaryRedirect !== true) {
      throw new Error('followTemporaryRedirect should be true by default');
    }

    await scraper.close();
  });

  // Test 12: SectionNotFoundError handling
  await test('SectionNotFoundError for non-existent sections', async () => {
    const scraper = new WebScraper({
      sectionSelectors: ['.non-existent-section', '#another-non-existent-section'],
      headless: true
    });
    
    try {
      // This should throw a SectionNotFoundError
      await scraper.scrapeTextStructured('https://example.com');
      throw new Error('Should have thrown SectionNotFoundError');
    } catch (error) {
      if (!(error instanceof SectionNotFoundError)) {
        throw new Error(`Expected SectionNotFoundError, got ${error.constructor.name}: ${error.message}`);
      }
      
      // Verify error properties
      if (!error.message) throw new Error('Error should have a message');
      if (!error.selectors) throw new Error('Error should have selectors property');
      if (!error.url) throw new Error('Error should have url property');
      if (!error.timestamp) throw new Error('Error should have timestamp property');
      
      // Verify selectors match what we passed in
      if (!Array.isArray(error.selectors)) throw new Error('Error selectors should be an array');
      if (error.selectors.length !== 2) throw new Error('Error selectors should contain 2 elements');
    } finally {
      await scraper.close();
    }
  });

  // Test 13: Required interaction step fails fast
  await test('Required interaction step fails fast', async () => {
    const scraper = new WebScraper({
      headless: true,
      interactionSteps: [{ event: 'click', target: '#does-not-exist' }]
    });

    try {
      await scraper.scrapeText(interactionFixtureUrl);
      throw new Error('Should have thrown InteractionStepError');
    } catch (error) {
      if (!(error instanceof InteractionStepError)) {
        throw new Error(`Expected InteractionStepError, got ${error.constructor.name}: ${error.message}`);
      }
      if (error.stepIndex !== 0) throw new Error('Step index should be 0');
      if (error.event !== 'click') throw new Error('Error event should be click');
    } finally {
      await scraper.close();
    }
  });

  // Test 14: Late navigation before evaluation is retried
  await test('Late navigation settles before extraction', async () => {
    const scraper = new WebScraper({ headless: true });

    const result = await scraper.scrapeText(redirectFixtureUrl);

    if (!result.text.includes('Settled content')) {
      throw new Error(`Expected settled content, got: ${result.text}`);
    }

    await scraper.close();
  });

  // Test 14: Optional interaction step is skipped with warning
  await test('Optional interaction step skip with warning', async () => {
    const scraper = new WebScraper({
      headless: true,
      interactionSteps: [{ event: 'click', target: '#does-not-exist', required: false }]
    });

    const result = await scraper.scrapeText(interactionFixtureUrl);
    if (!Array.isArray(result.interactionWarnings)) {
      throw new Error('interactionWarnings should be an array');
    }
    if (result.interactionWarnings.length !== 1) {
      throw new Error('Should contain exactly one interaction warning');
    }

    await scraper.close();
  });

  // Test 15: Interaction steps execute in order before scraping
  await test('Interaction steps execute before scraping', async () => {
    const scraper = new WebScraper({
      headless: true,
      interactionSteps: [
        { event: 'click', target: '#expand', wait: 100 },
        { event: 'mouseover', target: '#info' }
      ]
    });

    const result = await scraper.scrapeText(interactionFixtureUrl);
    if (!result.text.includes('Expanded content visible')) {
      throw new Error('Expected expanded content to be present after click step');
    }
    if (!result.text.includes('Hovered details')) {
      throw new Error('Expected hover content to be present after mouseover step');
    }

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

  rmSync(testDir, { recursive: true, force: true });
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().catch(console.error);
}
