#!/usr/bin/env node

/**
 * AOMA Aggressive Crawler - Direct to Fresh Database
 * Creates minimal schema and starts crawling
 */

const { chromium } = require('playwright');
const fs = require('fs').promises;
const crypto = require('crypto');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');

dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('🚀 AOMA Crawler - Fresh Start');
console.log('📊 Database: mc-tk\n');

const AOMA_ENDPOINTS = [
  '/aoma-ui/my-aoma-files',
  '/aoma-ui/simple-upload',
  '/aoma-ui/direct-upload',
  '/aoma-ui/product-metadata-viewer',
  '/aoma-ui/unified-submission-tool',
  '/aoma-ui/registration-job-status',
  '/aoma-ui/unregister-assets',
  '/aoma-ui/video-metadata',
  '/aoma-ui/qc-notes',
  '/servlet/com.sonymusic.aoma.AOMADispatcherServlet?chain=CustomHomePageViewAction',
  '/servlet/com.sonymusic.aoma.AOMADispatcherServlet?chain=ProductSearchDisplayChain',
  '/servlet/com.sonymusic.aoma.AOMADispatcherServlet?chain=GlobalAssetSearch'
];

async function crawlAndStore() {
  // First, let's just store in a simple documents table
  // We'll create proper tables via Supabase dashboard later
  
  const storageState = JSON.parse(
    await fs.readFile('tmp/aoma-stage-storage.json', 'utf8')
  );
  
  const browser = await chromium.launch({
    headless: false,
    slowMo: 50
  });
  
  const context = await browser.newContext({
    storageState,
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
  // Store all crawled data in memory first
  const crawledData = [];
  
  console.log('🕷️ Crawling AOMA...\n');
  
  for (const endpoint of AOMA_ENDPOINTS) {
    try {
      const url = `https://aoma-stage.smcdp-de.net${endpoint}`;
      console.log(`📄 ${endpoint}`);
      
      await page.goto(url, {
        waitUntil: 'networkidle',
        timeout: 30000
      });
      
      await page.waitForTimeout(3000);
      
      // Try to expand content
      await page.evaluate(() => {
        // Click expandables
        document.querySelectorAll('[aria-expanded="false"]').forEach(el => el.click());
        // Scroll to load lazy content
        window.scrollTo(0, document.body.scrollHeight);
      });
      
      await page.waitForTimeout(2000);
      
      // Extract everything
      const content = await page.evaluate(() => {
        document.querySelectorAll('script, style').forEach(el => el.remove());
        
        return {
          title: document.title,
          content: document.body.innerText || '',
          url: window.location.href,
          html: document.documentElement.outerHTML,
          tables: Array.from(document.querySelectorAll('table')).length,
          forms: Array.from(document.querySelectorAll('form')).length,
          links: Array.from(document.querySelectorAll('a[href*="aoma"]')).map(a => a.href)
        };
      });
      
      if (content.content && content.content.length > 500) {
        crawledData.push({
          endpoint,
          ...content,
          crawled_at: new Date().toISOString()
        });
        console.log(`  ✅ Captured (${content.content.length} chars)`);
      } else {
        console.log(`  ⏭️ Skip (too short or login page)`);
      }
      
    } catch (error) {
      console.error(`  ❌ Error: ${error.message}`);
    }
  }
  
  await browser.close();
  
  // Save to local file for now
  const outputPath = `tmp/aoma-crawled-${Date.now()}.json`;
  await fs.writeFile(outputPath, JSON.stringify(crawledData, null, 2));
  
  console.log('\n' + '='.repeat(60));
  console.log(`✅ Crawled ${crawledData.length} meaningful pages`);
  console.log(`📁 Data saved to: ${outputPath}`);
  console.log('='.repeat(60));
  
  console.log('\n📋 Next Steps:');
  console.log('1. Go to Supabase SQL Editor');
  console.log('2. Run: sql/create-all-knowledge-tables.sql');
  console.log('3. Then run: scripts/upload-crawled-to-supabase.js');
  
  return crawledData;
}

crawlAndStore().catch(console.error);