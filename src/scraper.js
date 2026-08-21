import { chromium, firefox, webkit } from 'playwright';
import { RedirectError } from './errors/RedirectError.js';
import { getErrorMessage } from './utils/get-error-message.js';

export { RedirectError };

function normalizeGroups(groups) {
  if (!Array.isArray(groups)) {
    throw new TypeError('groups must be an array of group objects');
  }

  return groups.map((group, index) => {
    if (!group || typeof group !== 'object' || Array.isArray(group)) {
      throw new TypeError(`groups[${index}] must be a group object`);
    }

    const { selector, required = false, wait = true, name = selector } = group;

    if (typeof selector !== 'string' || selector.trim().length === 0) {
      throw new TypeError(`groups[${index}].selector must be a non-empty string`);
    }
    if (typeof required !== 'boolean') {
      throw new TypeError(`groups[${index}].required must be a boolean`);
    }
    if (typeof wait !== 'boolean') {
      throw new TypeError(`groups[${index}].wait must be a boolean`);
    }
    if (typeof name !== 'string' || name.trim().length === 0) {
      throw new TypeError(`groups[${index}].name must be a non-empty string`);
    }

    return { selector, required, wait, name };
  });
}

export class WebScraper {
  constructor(options = {}) {
    if (options.plugin !== undefined && typeof options.plugin !== 'function') {
      throw new TypeError('plugin must be a function');
    }

    this.options = {
      browser: options.browser || 'chromium',
      headless: options.headless !== false,
      timeout: options.timeout || 30000,
      groups: normalizeGroups(options.groups ?? []),
      waitUntil: options.waitUntil || 'domcontentloaded',
      excludeSelectors: options.excludeSelectors || ['script', 'style', 'nav', 'footer', 'aside', '.ads', '.advertisement'],
      userAgent: options.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      followPermanentRedirect: options.followPermanentRedirect !== false,
      followTemporaryRedirect: options.followTemporaryRedirect !== false,
      plugin: options.plugin
    };
    this.browser = null;
    this.context = null;
  }

  isExecutionContextDestroyedError(error) {
    return typeof error?.message === 'string' && error.message.includes('Execution context was destroyed');
  }

  async waitForPageToSettle(page, attempts = 3) {
    let previousUrl = null;

    for (let attempt = 0; attempt < attempts; attempt++) {
      await page.waitForLoadState('domcontentloaded');

      const currentUrl = page.url();
      await page.waitForTimeout(250);

      if (currentUrl === page.url() && currentUrl === previousUrl) {
        return;
      }

      previousUrl = currentUrl;
    }
  }

  async runOnStablePage(page, callback, retries = 2) {
    for (let attempt = 0; attempt <= retries; attempt++) {
      await this.waitForPageToSettle(page);

      try {
        return await callback();
      } catch (error) {
        if (!this.isExecutionContextDestroyedError(error) || attempt === retries) {
          throw error;
        }
      }
    }
  }

  async init() {
    if (this.browser) return;

    const browserOptions = {
      headless: this.options.headless,
    };

    switch (this.options.browser) {
      case 'firefox':
        this.browser = await firefox.launch(browserOptions);
        break;
      case 'webkit':
        this.browser = await webkit.launch(browserOptions);
        break;
      default:
        this.browser = await chromium.launch(browserOptions);
    }

    this.context = await this.browser.newContext({
      userAgent: this.options.userAgent
    });
  }

  async scrapeText(url) {
    let page = null;

    try {
      await this.init();
      
      page = await this.context.newPage();
      
      // Set timeout
      page.setDefaultTimeout(this.options.timeout);
      
      let redirectInfo = null;
      if (!this.options.followPermanentRedirect || !this.options.followTemporaryRedirect) {
        page.on('response', async (response) => {
          if (response.url() === url || response.request().redirectedFrom()) {
            const status = response.status();
            const isPermanent = status === 301 || status === 308;
            const isTemporary = status === 302 || status === 303 || status === 307;
            if ((isPermanent && !this.options.followPermanentRedirect) ||
                (isTemporary && !this.options.followTemporaryRedirect)) {
              redirectInfo = {
                status,
                location: response.headers()['location'] || response.url(),
                url: response.url()
              };
            }
          }
        });
      }

      // Navigate to the page
      await page.goto(url, { waitUntil: this.options.waitUntil });

      if (redirectInfo) {
        await page.close();
        throw new RedirectError(redirectInfo.status, redirectInfo.location, url);
      }
      
      if (this.options.plugin) {
        await this.options.plugin(page);
      }
      
      // Remove excluded elements
      for (const selector of this.options.excludeSelectors) {
        await this.runOnStablePage(page, () => page.evaluate((sel) => {
          const elements = document.querySelectorAll(sel);
          elements.forEach(el => el.remove());
        }, selector));
      }
      
      // Extract all text content
      const textContent = await this.runOnStablePage(page, () => page.evaluate(() => {
        // Get all text nodes and clean them up
        const walker = document.createTreeWalker(
          document.body,
          NodeFilter.SHOW_TEXT,
          null,
          false
        );
        
        const textNodes = [];
        let node;
        
        while (node = walker.nextNode()) {
          const text = node.textContent.trim();
          if (text && text.length > 0) {
            textNodes.push(text);
          }
        }
        
        return textNodes.join(' ').replace(/\s+/g, ' ').trim();
      }));
      
      await page.close();
      
      return {
        url,
        text: textContent,
        length: textContent.length,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      if (page && !page.isClosed()) {
        await page.close().catch(() => {});
      }
      throw error;
    }
  }

  async scrapeTextStructured(url) {
    let page = null;

    try {
      await this.init();
      
      page = await this.context.newPage();
      page.setDefaultTimeout(this.options.timeout);
      
      let redirectInfo = null;
      if (!this.options.followPermanentRedirect || !this.options.followTemporaryRedirect) {
        page.on('response', async (response) => {
          if (response.url() === url || response.request().redirectedFrom()) {
            const status = response.status();
            const isPermanent = status === 301 || status === 308;
            const isTemporary = status === 302 || status === 303 || status === 307;
            if ((isPermanent && !this.options.followPermanentRedirect) ||
                (isTemporary && !this.options.followTemporaryRedirect)) {
              redirectInfo = {
                status,
                location: response.headers()['location'] || response.url(),
                url: response.url()
              };
            }
          }
        });
      }

      await page.goto(url, { waitUntil: this.options.waitUntil });

      if (redirectInfo) {
        await page.close();
        throw new RedirectError(redirectInfo.status, redirectInfo.location, url);
      }
      
      if (this.options.plugin) {
        await this.options.plugin(page);
      }

      // Wait for groups that opt into waiting. Required groups fail if their
      // selector is still unavailable; optional groups return empty values.
      for (const { selector, required, wait, name } of this.options.groups) {
        if (!wait) {
          continue;
        }

        try {
          await page.waitForSelector(selector, {
            state: 'attached',
            timeout: this.options.timeout
          });
        } catch (error) {
          if (error?.name !== 'TimeoutError') {
            throw error;
          }
          if (required) {
            throw new Error(`Required group "${name}" (${selector}) was not found on page ${url} after ${this.options.timeout}ms.`);
          }
          console.warn(`Warning: Group "${name}" (${selector}) was not found on page ${url} after ${this.options.timeout}ms. It will be empty.`);
        }
      }

      // Extract structured content
      const structuredContent = await this.runOnStablePage(page, () => page.evaluate(({ excludeSelectors, groups }) => {
        // Remove excluded elements
        excludeSelectors.forEach(selector => {
          const elements = document.querySelectorAll(selector);
          elements.forEach(el => el.remove());
        });
        
        const createEmptyStructuredData = () => ({
          headings: {},
          paragraphs: [],
          otherText: [],
          links: [],
          lists: [],
          images: [],
        });

        // Helper function to extract structured data from an element
        const extractFromElement = (element) => {
          const data = createEmptyStructuredData();
          
          // Extract headings
          ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].forEach(tag => {
            const headings = Array.from(element.querySelectorAll(tag))
              .map(h => h.textContent.trim())
              .filter(text => text.length > 0);
            if (headings.length > 0) {
              data.headings[tag] = headings;
            }
          });
          
          // Extract paragraphs
          data.paragraphs = Array.from(element.querySelectorAll('p'))
            .map(p => p.textContent.trim())
            .filter(text => text.length > 0);
          
          // Extract links
          data.links = Array.from(element.querySelectorAll('a[href]'))
            .map(a => ({
              text: a.textContent.trim(),
              href: a.href
            }))
            .filter(link => link.text.length > 0);
          
          // Extract lists
          data.lists = Array.from(element.querySelectorAll('ul, ol'))
            .map(list => ({
              type: list.tagName.toLowerCase(),
              items: Array.from(list.querySelectorAll('li'))
                .map(li => li.textContent.trim())
                .filter(text => text.length > 0)
            }))
            .filter(list => list.items.length > 0);
          
            
          // Extract images
          data.images = Array.from(element.querySelectorAll('img[src]'))
            .map(img => ({
              src: img.src,
              alt: img.alt || '',
              title: img.title || ''
            }))
            .filter(img => img.src.length > 0);
          
          // Extract all text nodes whose parent is not <p>, <a>, <li> or <h>
          const excludedTags = [ 'P', 'A', 'LI', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6' ];
          const walker = document.createTreeWalker(
            element,
            NodeFilter.SHOW_TEXT,
            {
              acceptNode: function(node) {
                // Skip if parent is a excluded tag
                if (node.parentElement && 
                  excludedTags.includes(node.parentElement.tagName)) {
                  return NodeFilter.FILTER_REJECT;
                }
                // Skip empty or whitespace-only text nodes
                const text = node.textContent.trim();
                if (!text || text.length === 0) {
                  return NodeFilter.FILTER_REJECT;
                }
                return NodeFilter.FILTER_ACCEPT;
              }
            },
            false
          );
          
          let textNode;
          while (textNode = walker.nextNode()) {
            const text = textNode.textContent.trim();
            if (text) {
              data.otherText.push(text);
            }
          }
          
          return data;
        };
        
        const result = {
          title: document.title || ''
        };
        
        // If groups are provided, extract their matching elements.
        if (groups && groups.length > 0) {
          const allGroups = [];
          
          // Collect matches and retain an empty entry for each missing selector.
          groups.forEach(({ selector, required, name }) => {
            const matches = Array.from(document.querySelectorAll(selector));

            if (matches.length === 0) {
              if (required) {
                throw new Error(`Required group "${name}" (${selector}) was not found.`);
              }
              allGroups.push({ name, element: null, matchIndex: 0 });
              return;
            }

            matches.forEach((element, matchIndex) => {
              allGroups.push({ name, element, matchIndex });
            });
          });
          
          result.groups = allGroups.map(({ name, element, matchIndex }) => {
            if (!element) {
              return {
                id: name,
                title: null,
                ...createEmptyStructuredData()
              };
            }

            const groupId = matchIndex === 0 ? name : `${name}-${matchIndex + 1}`;

            // Try to get the group title from its first heading.
            const firstHeading = element.querySelector('h1, h2, h3, h4, h5, h6');
            const groupTitle = firstHeading ? firstHeading.textContent.trim() : null;

            return {
              id: groupId,
              title: groupTitle,
              ...extractFromElement(element)
            };
          });
        } else {
          // No groups provided, extract from the entire document.
          Object.assign(result, extractFromElement(document.body));
        }
        
        return result;
      }, { 
        excludeSelectors: this.options.excludeSelectors,
        groups: this.options.groups
      }));
      
      await page.close();
      
      return {
        url,
        ...structuredContent,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      if (page && !page.isClosed()) {
        await page.close().catch(() => {});
      }
      throw error;
    }
  }

  async scrapeMultiplePages(urls, structured = false) {
    const results = [];
    
    for (const url of urls) {
      try {
        const result = structured 
          ? await this.scrapeTextStructured(url)
          : await this.scrapeText(url);
        results.push(result);
        
        // Add small delay between requests to be respectful
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        // Check if it's a redirect error
        if (error instanceof RedirectError) {
          results.push({
            url: error.originalUrl,
            redirect: true,
            status: error.status,
            location: error.location,
            message: error.message,
            timestamp: error.timestamp
          });
        } else {
          results.push({
            url,
            error: getErrorMessage(error),
            timestamp: new Date().toISOString()
          });
        }
      }
    }
    
    return results;
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.context = null;
    }
  }
}
