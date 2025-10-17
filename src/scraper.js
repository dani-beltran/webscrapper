import { chromium, firefox, webkit } from 'playwright';

export class WebScraper {
  constructor(options = {}) {
    this.options = {
      browser: options.browser || 'chromium',
      headless: options.headless !== false,
      timeout: options.timeout || 30000,
      sectionSelectors: options.sectionSelectors || [],
      waitForSelector: options.waitForSelector || null,
      excludeSelectors: options.excludeSelectors || ['script', 'style', 'nav', 'footer', 'aside', '.ads', '.advertisement'],
      userAgent: options.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
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
      
      console.log(`Scraping text from: ${url}`);
      
      const page = await this.context.newPage();
      
      // Set timeout
      page.setDefaultTimeout(this.options.timeout);
      
      // Navigate to the page
      await page.goto(url, { waitUntil: 'networkidle' });
      
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
      console.error(`Error scraping ${url}:`, error.message);
      throw error;
    }
  }

  async scrapeTextStructured(url, options = {}) {
    try {
      await this.init();
      
      console.log(`Scraping structured text from: ${url}`);
      
      const page = await this.context.newPage();
      page.setDefaultTimeout(this.options.timeout);
      
      await page.goto(url, { waitUntil: 'networkidle' });
      
      if (this.options.waitForSelector) {
        await page.waitForSelector(this.options.waitForSelector);
      }

      // Extract structured content
      const structuredContent = await page.evaluate(({ excludeSelectors, sectionSelectors }) => {
        console.log('Extracting structured content...', sectionSelectors);
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
            links: [],
            lists: []
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
            throw new Error(`No sections found with selectors: ${sectionSelectors.join(', ')}`);
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
      
      await page.close();
      
      return {
        url,
        ...structuredContent,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error(`Error scraping structured content from ${url}:`, error.message);
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
        results.push({
          url,
          error: error.message,
          timestamp: new Date().toISOString()
        });
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