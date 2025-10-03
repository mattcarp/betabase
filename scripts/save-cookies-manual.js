#!/usr/bin/env node

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const STORAGE_FILE = path.join(process.cwd(), 'tmp/aoma-stage-storage.json');
const COOKIE_FILE = path.join(process.cwd(), 'tmp/aoma-cookie.txt');

(async () => {
  console.log('🔓 Connecting to existing browser...');

  // Connect to existing browser on the debugging port
  const browser = await chromium.connectOverCDP('http://localhost:9222');
  const contexts = browser.contexts();

  if (contexts.length === 0) {
    console.log('❌ No browser contexts found');
    process.exit(1);
  }

  const context = contexts[0];
  const pages = context.pages();

  if (pages.length === 0) {
    console.log('❌ No pages found');
    process.exit(1);
  }

  const page = pages[0];
  const url = page.url();

  console.log(`📍 Current page: ${url}`);

  if (url.includes('aoma-stage.smcdp-de.net')) {
    // Save storage state
    await context.storageState({ path: STORAGE_FILE });
    console.log(`✅ Saved storage to ${STORAGE_FILE}`);

    // Save cookies
    const cookies = await context.cookies();
    const cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join('; ');
    fs.writeFileSync(COOKIE_FILE, cookieHeader);
    console.log(`✅ Saved ${cookies.length} cookies to ${COOKIE_FILE}`);

    console.log('🎉 Authentication captured successfully!');
  } else {
    console.log('⚠️  Not at AOMA stage site. Please navigate there first.');
  }

  await browser.close();
})();
