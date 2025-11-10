import { chromium, firefox, webkit } from 'playwright';
import { RedirectError } from './errors/RedirectError.js';
import { SectionNotFoundError } from './errors/SectionNotFoundError.js';

export { RedirectError, SectionNotFoundError };

export class WebScraper {
  constructor(options = {}) {
    this.options = {
      browser: options.browser || 'chromium',
      headless: options.headless !== false,
      timeout: options.timeout || 30000,
      sectionSelectors: options.sectionSelectors || [],
      waitForSelector: options.waitForSelector || null,
      excludeSelectors: options.excludeSelectors || ['script', 'style', 'nav', 'footer', 'aside', '.ads', '.advertisement'],
      userAgent: options.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      followRedirects: options.followRedirects !== false
    };
    this.browser = null;
    this.context = null;
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
    try {
      await this.init();
      
      const page = await this.context.newPage();
      
      // Set timeout
      page.setDefaultTimeout(this.options.timeout);
      
      // Handle redirect detection if followRedirects is false
      let redirectInfo = null;
      if (!this.options.followRedirects) {
        // Listen for the initial response to capture redirect status codes
        page.on('response', (response) => {
          if (response.url() === url || response.request().redirectedFrom()) {
            const status = response.status();
            if (status === 301 || status === 302 || status === 303 || status === 307 || status === 308) {
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
      const response = await page.goto(url, { waitUntil: 'networkidle' });
      
      // Check if we detected a redirect when followRedirects is false
      if (!this.options.followRedirects && redirectInfo) {
        await page.close();
        throw new RedirectError(redirectInfo.status, redirectInfo.location, url);
      }
      
      // Wait for specific selector if provided
      if (this.options.waitForSelector) {
        await page.waitForSelector(this.options.waitForSelector);
      }
      
      // Remove excluded elements
      for (const selector of this.options.excludeSelectors) {
        await page.evaluate((sel) => {
          const elements = document.querySelectorAll(sel);
          elements.forEach(el => el.remove());
        }, selector);
      }
      
      // Extract all text content
      const textContent = await page.evaluate(() => {
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
      });
      
      await page.close();
      
      return {
        url,
        text: textContent,
        length: textContent.length,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      throw error;
    }
  }

  async scrapeTextStructured(url) {
    try {
      await this.init();
      
      const page = await this.context.newPage();
      page.setDefaultTimeout(this.options.timeout);
      
      // Handle redirect detection if followRedirects is false
      let redirectInfo = null;
      if (!this.options.followRedirects) {
        // Listen for the initial response to capture redirect status codes
        page.on('response', (response) => {
          if (response.url() === url || response.request().redirectedFrom()) {
            const status = response.status();
            if (status === 301 || status === 302 || status === 303 || status === 307 || status === 308) {
              redirectInfo = {
                status,
                location: response.headers()['location'] || response.url(),
                url: response.url()
              };
            }
          }
        });
      }
      
      const response = await page.goto(url, { waitUntil: 'networkidle' });
      
      // Check if we detected a redirect when followRedirects is false
      if (!this.options.followRedirects && redirectInfo) {
        await page.close();
        throw new RedirectError(redirectInfo.status, redirectInfo.location, url);
      }
      
      if (this.options.waitForSelector) {
        await page.waitForSelector(this.options.waitForSelector);
      }

      // Extract structured content
      const structuredContent = await page.evaluate(({ excludeSelectors, sectionSelectors }) => {
        // Remove excluded elements
        excludeSelectors.forEach(selector => {
          const elements = document.querySelectorAll(selector);
          elements.forEach(el => el.remove());
        });
        
        // Helper function to extract structured data from an element
        const extractFromElement = (element) => {
          const data = {
            headings: {},
            paragraphs: [],
            otherText: [],
            links: [],
            lists: [],
            images: [],
          };
          
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
        
        // If section selectors are provided, group by sections
        if (sectionSelectors && sectionSelectors.length > 0) {
          const allSections = [];
          
          // Try each selector and collect matching sections
          sectionSelectors.forEach(selector => {
            const sections = Array.from(document.querySelectorAll(selector));
            sections.forEach(section => {
              // Avoid duplicates if sections match multiple selectors
              if (!allSections.includes(section)) {
                allSections.push(section);
              }
            });
          });
          
          if (allSections.length > 0) {
            result.sections = allSections.map((section, index) => {
              // Try to find a section identifier (id, class, or first heading)
              let sectionId = section.id || section.className || `section-${index}`;
              
              // Try to get section title from first heading
              const firstHeading = section.querySelector('h1, h2, h3, h4, h5, h6');
              const sectionTitle = firstHeading ? firstHeading.textContent.trim() : null;
              
              return {
                id: sectionId,
                title: sectionTitle,
                ...extractFromElement(section)
              };
            });
          } else {
            // No sections found with any of the selectors
            return { error: 'SECTIONS_NOT_FOUND', selectors: sectionSelectors };
          }
        } else {
          // No section selectors provided, extract from entire document
          Object.assign(result, extractFromElement(document.body));
        }
        
        return result;
      }, { 
        excludeSelectors: this.options.excludeSelectors,
        sectionSelectors: this.options.sectionSelectors
      });
      
      // Check if sections were not found
      if (structuredContent.error === 'SECTIONS_NOT_FOUND') {
        await page.close();
        throw new SectionNotFoundError(structuredContent.selectors, url);
      }
      
      await page.close();
      
      return {
        url,
        ...structuredContent,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
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
        } else if (error instanceof SectionNotFoundError) {
          results.push({
            url: error.url,
            sectionsNotFound: true,
            selectors: error.selectors,
            message: error.message,
            timestamp: error.timestamp
          });
        } else {
          results.push({
            url,
            error: error.message,
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