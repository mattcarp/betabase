const { chromium } = require('playwright');
const fs = require('fs').promises;
const path = require('path');
const TurndownService = require('turndown');

console.log('🕷️ AOMA Quick Crawl - Using existing authentication\n');

async function quickCrawl() {
  const STORAGE_FILE = path.join(process.cwd(), 'tmp/aoma-stage-storage.json');
  
  // Check for auth file
  try {
    await fs.access(STORAGE_FILE);
    console.log('✅ Found authentication file\n');
  } catch {
    console.log('❌ No authentication found. Please login first.');
    return;
  }
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 50 
  });
  
  const context = await browser.newContext({
    storageState: STORAGE_FILE
  });
  
  const page = await context.newPage();
  const turndown = new TurndownService();
  
  console.log('Starting crawl...\n');
  
  const urls = [
    'https://aoma-stage.smcdp-de.net/aoma-ui/my-aoma-files',
    'https://aoma-stage.smcdp-de.net/aoma-ui/simple-upload',
    'https://aoma-stage.smcdp-de.net/aoma-ui/direct-upload'
  ];
  
  for (const url of urls) {
    console.log(`📄 ${url}`);
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    const title = await page.title();
    const html = await page.content();
    const markdown = turndown.turndown(html);
    
    console.log(`   Title: ${title}`);
    console.log(`   Size: ${html.length} chars\n`);
    
    // Save
    const name = url.split('/').pop();
    await fs.mkdir('tmp/crawled', { recursive: true });
    await fs.writeFile(`tmp/crawled/${name}.html`, html);
    await fs.writeFile(`tmp/crawled/${name}.md`, markdown);
  }
  
  console.log('✅ Done! Files in tmp/crawled/');
  
  await page.waitForTimeout(5000);
  await browser.close();
}

quickCrawl();
