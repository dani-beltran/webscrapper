import { WebScraper } from '../src/scraper.js';
import { mkdtempSync, writeFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { pathToFileURL } from 'url';

async function runTests() {
  console.log('🧪 Running Web Scraper Tests...\n');

  let passed = 0;
  let failed = 0;
  const testDir = mkdtempSync(join(tmpdir(), 'webscrapper-tests-'));
  const pluginFixturePath = join(testDir, 'plugin-fixture.html');
  const redirectFixturePath = join(testDir, 'redirect-fixture.html');
  const sectionFixturePath = join(testDir, 'section-fixture.html');
  writeFileSync(pluginFixturePath, `<!doctype html>
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
  writeFileSync(sectionFixturePath, `<!doctype html>
<html>
  <body>
    <script>
      setTimeout(() => {
        document.body.insertAdjacentHTML('beforeend', '<section class="first"><h2>First</h2></section>');
      }, 50);
      setTimeout(() => {
        document.body.insertAdjacentHTML('beforeend', '<article class="second"><h2>Second</h2></article>');
      }, 100);
    </script>
  </body>
</html>`);
  const pluginFixtureUrl = pathToFileURL(pluginFixturePath).href;
  const redirectFixtureUrl = pathToFileURL(redirectFixturePath).href;
  const sectionFixtureUrl = pathToFileURL(sectionFixturePath).href;

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
    const scraper = new WebScraper({ waitForSelector: '#removed-option' });
    if (!scraper.options.browser) throw new Error('Browser option not set');
    if (scraper.options.timeout !== 30000) throw new Error('Default timeout not correct');
    if (Object.hasOwn(scraper.options, 'waitForSelector')) {
      throw new Error('waitForSelector should not be a scraper option');
    }

    try {
      new WebScraper({ groups: ['#legacy-string'] });
      throw new Error('String group entries should be rejected');
    } catch (error) {
      if (!(error instanceof TypeError) || !error.message.includes('group object')) {
        throw error;
      }
    }
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

  // Test 7: Multiple named groups
  await test('Multiple named groups', async () => {
    const scraper = new WebScraper({
      headless: true,
      groups: [
        { selector: '.first', required: true, name: 'first-section' },
        { selector: '.second', required: true, name: 'second-section' }
      ]
    });
    
    if (!Array.isArray(scraper.options.groups)) {
      throw new Error('groups should be an array');
    }
    if (scraper.options.groups.length !== 2) {
      throw new Error('groups array length mismatch');
    }
    if (!scraper.options.groups.every(group => group.wait === true)) {
      throw new Error('Group wait should default to true');
    }
    
    const result = await scraper.scrapeTextStructured(sectionFixtureUrl);
    if (!result.groups) throw new Error('Groups not extracted');
    if (!Array.isArray(result.groups)) throw new Error('Groups should be an array');
    if (result.groups.length !== 2) throw new Error('Did not wait for every group selector');
    if (result.groups[0].id !== 'first-section') throw new Error('First group name was not used as its id');
    if (result.groups[1].id !== 'second-section') throw new Error('Second group name was not used as its id');
    
    await scraper.close();
  });

  // Test 9: Static groups
  await test('Static groups', async () => {
    const scraper = new WebScraper({
      headless: true,
      groups: [
        { selector: '#expand', required: false, wait: false, name: 'expand-control' },
        { selector: '#content', required: false, wait: false, name: 'content' }
      ]
    });
    
    const result = await scraper.scrapeTextStructured(pluginFixtureUrl);
    
    if (!result.groups) throw new Error('Groups not extracted');
    
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

  // Test 12: Missing optional groups produce empty group values
  await test('Missing optional group returns an empty group', async () => {
    const scraper = new WebScraper({
      groups: [
        { selector: '.first', required: true, name: 'first-section' },
        { selector: '.non-existent-section', required: false, name: 'missing-section' },
        { selector: '.optional-section', required: false, wait: false, name: 'optional-section' }
      ],
      headless: true,
      timeout: 100
    });

    const result = await scraper.scrapeTextStructured(sectionFixtureUrl);
    const emptyGroup = result.groups?.find(group => group.id === 'missing-section');
    const optionalGroup = result.groups?.find(group => group.id === 'optional-section');

    if (!emptyGroup) throw new Error('Missing selector should produce a group entry');
    if (!optionalGroup) throw new Error('Missing optional selector should produce a group entry');
    if (emptyGroup.title !== null) throw new Error('Empty group title should be null');
    if (Object.keys(emptyGroup.headings).length !== 0) throw new Error('Empty group headings should be empty');
    for (const field of ['paragraphs', 'otherText', 'links', 'lists', 'images']) {
      if (!Array.isArray(emptyGroup[field]) || emptyGroup[field].length !== 0) {
        throw new Error(`Empty group ${field} should be an empty array`);
      }
    }

    await scraper.close();
  });

  await test('Missing required group throws an error', async () => {
    const scraper = new WebScraper({
      groups: [
        { selector: '.non-existent-section', required: true, name: 'required-section' }
      ],
      headless: true,
      timeout: 100
    });

    let thrownError = null;
    try {
      await scraper.scrapeTextStructured(sectionFixtureUrl);
    } catch (error) {
      thrownError = error;
    } finally {
      await scraper.close();
    }

    if (!(thrownError instanceof Error)) throw new Error('Missing required group should throw an Error');
    if (!thrownError.message.includes('required-section')) {
      throw new Error('Required group error should identify the group name');
    }
  });

  // Test 13: Plugin failures propagate unchanged
  await test('Plugin failures propagate unchanged', async () => {
    const pluginError = new Error('Plugin failed');
    let pluginPage = null;
    const scraper = new WebScraper({
      headless: true,
      plugin: async (page) => {
        pluginPage = page;
        if (page.url() !== pluginFixtureUrl) {
          throw new Error('Plugin should run after navigation');
        }
        throw pluginError;
      }
    });

    try {
      await scraper.scrapeText(pluginFixtureUrl);
      throw new Error('Should have propagated the plugin error');
    } catch (error) {
      if (error !== pluginError) throw error;
      if (!pluginPage?.isClosed()) {
        throw new Error('Page should close after a plugin failure');
      }
    } finally {
      await scraper.close();
    }
  });

  // Test 13.5: Bulk plugin failures always produce a serializable error
  await test('Bulk mode records arbitrary plugin rejections as failures', async () => {
    const rejectionCases = [
      { name: 'string', value: 'plugin rejected', expected: 'plugin rejected' },
      { name: 'null', value: null },
      { name: 'undefined', value: undefined },
      { name: 'empty string', value: '' },
      { name: 'zero', value: 0, expected: '0' },
      { name: 'false', value: false, expected: 'false' },
      { name: 'empty Error', value: new Error('') },
      { name: 'message object', value: { message: 'object rejection' }, expected: 'object rejection' }
    ];
    let rejection;
    const scraper = new WebScraper({
      headless: true,
      plugin: async () => {
        throw rejection;
      }
    });

    try {
      for (const structured of [false, true]) {
        for (const rejectionCase of rejectionCases) {
          rejection = rejectionCase.value;
          const results = await scraper.scrapeMultiplePages([pluginFixtureUrl], structured);
          const result = results[0];
          const mode = structured ? 'structured' : 'plain';

          if (typeof result.error !== 'string' || result.error.length === 0) {
            throw new Error(`${mode} ${rejectionCase.name} rejection should have a non-empty error`);
          }
          if (rejectionCase.expected && result.error !== rejectionCase.expected) {
            throw new Error(`${mode} ${rejectionCase.name} rejection message was not preserved`);
          }
          if (!JSON.stringify(result).includes('"error"')) {
            throw new Error(`${mode} ${rejectionCase.name} rejection error should be serialized`);
          }
          if (results.filter(item => item.error).length !== 1) {
            throw new Error(`${mode} ${rejectionCase.name} rejection should be counted as failed`);
          }
        }
      }
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

  // Test 15: Plugin runs before plain-text extraction
  await test('Plugin receives Page and runs before text scraping', async () => {
    let pluginUrl = null;
    const scraper = new WebScraper({
      headless: true,
      plugin: async (page) => {
        pluginUrl = page.url();
        await page.click('#expand');
        await page.hover('#info');
      }
    });

    const result = await scraper.scrapeText(pluginFixtureUrl);
    if (pluginUrl !== pluginFixtureUrl) {
      throw new Error('Plugin did not receive the navigated page');
    }
    if (!result.text.includes('Expanded content visible')) {
      throw new Error('Expected expanded content to be present after plugin click');
    }
    if (!result.text.includes('Hovered details')) {
      throw new Error('Expected hover content to be present after plugin hover');
    }

    await scraper.close();
  });

  // Test 16: Plugin runs before structured extraction
  await test('Plugin runs before structured scraping', async () => {
    const scraper = new WebScraper({
      headless: true,
      plugin: (page) => page.evaluate(() => {
        const paragraph = document.createElement('p');
        paragraph.textContent = 'Content added by plugin';
        document.body.appendChild(paragraph);
      })
    });

    const result = await scraper.scrapeTextStructured(pluginFixtureUrl);
    if (!result.paragraphs.includes('Content added by plugin')) {
      throw new Error('Expected plugin content in structured result');
    }

    await scraper.close();
  });

  // Test 17: Invalid plugins fail during initialization
  await test('Plugin option must be a function', async () => {
    for (const plugin of ['not-a-function', null]) {
      try {
        new WebScraper({ plugin });
        throw new Error('Should have rejected a non-function plugin');
      } catch (error) {
        if (!(error instanceof TypeError) || error.message !== 'plugin must be a function') {
          throw error;
        }
      }
    }
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
