#!/usr/bin/env node

/**
 * JIRA Manual Export Script
 *
 * Opens browser, lets you login manually, then automatically runs queries and exports CSVs
 */

require('dotenv').config({ path: '.env.local' });
const { chromium } = require('playwright');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function runJiraExport() {
  console.log('🚀 JIRA Manual Export Script');
  console.log('');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Step 1: Navigate to JIRA login
    console.log('📋 Step 1: Opening JIRA login page...');
    await page.goto('https://jira.smedigitalapps.com/jira/login.jsp');
    console.log('✅ JIRA login page opened in browser');
    console.log('');

    // Step 2: Wait for manual login
    console.log('🔐 Step 2: Please log in manually in the browser window');
    console.log('   Username: mcarpent');
    console.log('   Password: (from .env.local)');
    console.log('');

    await askQuestion('Press ENTER after you have logged in successfully...');
    console.log('');

    // Step 3: Define queries
    const queries = [
      { project: 'DPSA', jql: 'project = DPSA AND (created >= "2025-07-04" OR updated >= "2025-07-04") ORDER BY updated DESC' },
      { project: 'AOMA', jql: 'project = AOMA AND (created >= "2025-07-04" OR updated >= "2025-07-04") ORDER BY updated DESC' },
      { project: 'AOMA-2', jql: 'project = "AOMA-2" AND (created >= "2025-07-04" OR updated >= "2025-07-04") ORDER BY updated DESC' },
      { project: 'AOMA-3', jql: 'project = "AOMA-3" AND (created >= "2025-07-04" OR updated >= "2025-07-04") ORDER BY updated DESC' },
      { project: 'ITSM', jql: 'project = ITSM AND (created >= "2025-07-04" OR updated >= "2025-07-04") ORDER BY updated DESC' },
      { project: 'UST', jql: 'project = UST AND (created >= "2025-07-04" OR updated >= "2025-07-04") ORDER BY updated DESC' },
    ];

    console.log('📊 Step 3: Running queries and preparing exports...');
    console.log('');

    for (const query of queries) {
      console.log(`\n🔍 Processing ${query.project}...`);

      // Navigate to query
      const url = `https://jira.smedigitalapps.com/jira/issues/?jql=${encodeURIComponent(query.jql)}`;
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(3000);

      // Get result count
      const resultCount = await page.evaluate(() => {
        const countEl = document.querySelector('.results-count-total, .showing-count, .issue-count, .results-count');
        return countEl ? countEl.textContent.trim() : 'unknown';
      });

      console.log(`   Results found: ${resultCount}`);
      console.log(`   Query URL: ${url}`);

      // Pause for manual export
      console.log('');
      console.log(`   📥 Please export to CSV:`);
      console.log(`      1. Click "Export" button`);
      console.log(`      2. Select "Export CSV (All fields)"`);
      console.log(`      3. Save as: tmp/jira-exports/${query.project.toLowerCase()}-tickets-since-2025-07-04.csv`);
      console.log('');

      await askQuestion('   Press ENTER after you have saved the CSV file...');
    }

    console.log('');
    console.log('✅ All queries completed!');
    console.log('');
    console.log('📁 Expected files in tmp/jira-exports/:');
    queries.forEach(q => {
      console.log(`   - ${q.project.toLowerCase()}-tickets-since-2025-07-04.csv`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    console.log('');
    console.log('🔚 Closing browser...');
    rl.close();
    await browser.close();
  }
}

runJiraExport().catch(console.error);
