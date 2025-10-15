#!/usr/bin/env node

/**
 * JIRA Automated Export Script
 *
 * Logs into JIRA (no MFA) and automatically exports CSV files for all queries
 */

require('dotenv').config({ path: '.env.local' });
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function runAutomatedExport() {
  console.log('🚀 JIRA Automated Export Script');
  console.log('');

  const browser = await chromium.launch({
    headless: false,
    downloadsPath: path.join(__dirname, '../tmp/jira-exports')
  });

  const context = await browser.newContext({
    acceptDownloads: true
  });

  const page = await context.newPage();

  try {
    // Step 1: Navigate to JIRA login
    console.log('📋 Step 1: Navigating to JIRA login...');
    await page.goto('https://jira.smedigitalapps.com/jira/login.jsp');
    await page.waitForTimeout(2000);

    // Step 2: Fill login form
    console.log('🔐 Step 2: Logging in...');
    await page.fill('#login-form-username', process.env.JIRA_USERNAME);
    await page.fill('#login-form-password', process.env.JIRA_PASSWORD);
    await page.click('#login-form-submit');

    // Wait for login to complete
    await page.waitForTimeout(5000);
    console.log('✅ Logged in successfully!');
    console.log('');

    // Step 3: Define all queries
    const queries = [
      { project: 'DPSA', filename: 'dpsa-tickets-since-2025-07-04.csv', jql: 'project = DPSA AND (created >= "2025-07-04" OR updated >= "2025-07-04") ORDER BY updated DESC' },
      { project: 'AOMA', filename: 'aoma-tickets-since-2025-07-04.csv', jql: 'project = AOMA AND (created >= "2025-07-04" OR updated >= "2025-07-04") ORDER BY updated DESC' },
      { project: 'AOMA2', filename: 'aoma2-tickets-since-2025-07-04.csv', jql: 'project = AOMA2 AND (created >= "2025-07-04" OR updated >= "2025-07-04") ORDER BY updated DESC' },
      { project: 'AOMA3', filename: 'aoma3-tickets-since-2025-07-04.csv', jql: 'project = AOMA3 AND (created >= "2025-07-04" OR updated >= "2025-07-04") ORDER BY updated DESC' },
      { project: 'ITSM-1', filename: 'itsm-tickets-2025-07-04-to-2025-08-15.csv', jql: 'project = ITSM AND (created >= "2025-07-04" OR updated >= "2025-07-04") AND (created <= "2025-08-15" AND updated <= "2025-08-15") ORDER BY updated DESC' },
      { project: 'ITSM-2', filename: 'itsm-tickets-2025-08-16-to-2025-09-20.csv', jql: 'project = ITSM AND (created >= "2025-07-04" OR updated >= "2025-07-04") AND ((created > "2025-08-15" AND created <= "2025-09-20") OR (updated > "2025-08-15" AND updated <= "2025-09-20")) ORDER BY updated DESC' },
      { project: 'ITSM-3', filename: 'itsm-tickets-2025-09-21-to-2025-10-12.csv', jql: 'project = ITSM AND (created >= "2025-07-04" OR updated >= "2025-07-04") AND (created > "2025-09-20" OR updated > "2025-09-20") ORDER BY updated DESC' },
      { project: 'UST', filename: 'ust-tickets-since-2025-07-04.csv', jql: 'project = UST AND (created >= "2025-07-04" OR updated >= "2025-07-04") ORDER BY updated DESC' },
    ];

    console.log('📊 Step 3: Running queries and exporting CSVs...');
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

      // Click Export button
      console.log('   📥 Clicking Export button...');

      // Try different selectors for export button
      const exportButton = await page.locator('button:has-text("Export"), a:has-text("Export"), .export-button').first();
      if (await exportButton.count() > 0) {
        await exportButton.click();
        await page.waitForTimeout(1000);

        // Click "CSV (All fields)" option
        console.log('   📋 Selecting CSV (All fields)...');
        const csvAllFieldsOption = await page.locator('text=/CSV.*All.*fields/i, a:has-text("CSV"), li:has-text("CSV")').first();
        if (await csvAllFieldsOption.count() > 0) {
          await csvAllFieldsOption.click();
          await page.waitForTimeout(2000);
          console.log(`   ✅ Export initiated for ${query.filename}`);
        } else {
          console.log('   ⚠️  Could not find CSV export option');
        }
      } else {
        console.log('   ⚠️  Could not find Export button');
      }
    }

    console.log('');
    console.log('✅ All queries completed!');
    console.log('');
    console.log('📁 Check tmp/jira-exports/ for downloaded files');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    console.log('');
    console.log('Press Ctrl+C to close the browser when done...');
    // Don't close browser automatically so user can verify downloads
    // await browser.close();
  }
}

runAutomatedExport().catch(console.error);
