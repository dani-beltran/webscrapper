#!/usr/bin/env node

import { WebScraper } from './scraper.js';
import readline from 'readline';

async function runInteractiveCLI() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  console.log('🕷️  Interactive Web Scraper\n');

  const askQuestion = (question) => {
    return new Promise((resolve) => {
      rl.question(question, resolve);
    });
  };

  try {
    const url = await askQuestion('Enter the URL to scrape: ');
    
    if (!url || !url.startsWith('http')) {
      console.error('❌ Please enter a valid URL starting with http:// or https://');
      rl.close();
      return;
    }

    const structured = await askQuestion('Extract structured content? (y/n): ');
    const headless = await askQuestion('Run in headless mode? (y/n): ');

    console.log('\n🚀 Starting scraper...\n');

    const scraper = new WebScraper({
      headless: headless.toLowerCase() !== 'n'
    });

    const result = structured.toLowerCase() === 'y' 
      ? await scraper.scrapeTextStructured(url)
      : await scraper.scrapeText(url);

    console.log('\n📊 --- SCRAPING RESULTS ---');
    
    if (structured.toLowerCase() === 'y') {
      console.log(`📄 Title: ${result.title}`);
      console.log(`📝 Text Length: ${result.paragraphs.join(' ').length} characters`);
      console.log(`📑 Headings: ${Object.values(result.headings).flat().length}`);
      console.log(`🔗 Links: ${result.links.length}`);
      console.log(`📋 Lists: ${result.lists.length}`);
      
      if (result.headings.h1 && result.headings.h1.length > 0) {
        console.log(`\n🏷️  Main Headings:`);
        result.headings.h1.forEach(h => console.log(`   • ${h}`));
      }
      
      console.log('\n📄 Full structured data:');
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log(`📝 Text Length: ${result.length} characters`);
      console.log(`📄 Content Preview: ${result.text.substring(0, 200)}...`);
      console.log('\n📄 Full result:');
      console.log(JSON.stringify(result, null, 2));
    }

    await scraper.close();
    console.log('\n✅ Scraping completed successfully!');

  } catch (error) {
    console.error('\n❌ Scraping failed:', error.message);
  } finally {
    rl.close();
  }
}

// Run the interactive CLI
if (import.meta.url === `file://${process.argv[1]}`) {
  runInteractiveCLI().catch(console.error);
}

export { runInteractiveCLI };