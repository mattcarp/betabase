#!/usr/bin/env node

/**
 * JIRA Automated Export Script
 *
 * Logs into JIRA (no MFA) and automatically exports CSV files for all queries
 */

require("dotenv").config({ path: ".env.local" });
const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");

async function runAutomatedExport() {
  console.log("🚀 JIRA Automated Export Script");
  console.log("");

  const browser = await chromium.launch({
    headless: false,
    downloadsPath: path.join(__dirname, "../tmp/jira-exports"),
  });

  const context = await browser.newContext({
    acceptDownloads: true,
  });

  const page = await context.newPage();

  try {
    // Step 1: Navigate to JIRA login
    console.log("📋 Step 1: Navigating to JIRA login...");
    await page.goto("https://jira.smedigitalapps.com/jira/login.jsp");
    await page.waitForTimeout(2000);

    // Step 2: Fill login form
    console.log("🔐 Step 2: Logging in...");
    await page.fill("#login-form-username", process.env.JIRA_USERNAME);
    await page.fill("#login-form-password", process.env.JIRA_PASSWORD);
    await page.click("#login-form-submit");

    // Wait for login to complete
    await page.waitForTimeout(5000);
    console.log("✅ Logged in successfully!");
    console.log("");

    // Step 3: Define all queries
    // Updated November 2025: Using 60d to stay under JIRA's 5,000 result limit
    // Excludes automated reminder and offboarding tickets
    const queries = [
      {
        project: "DPSA",
        filename: "dpsa-tickets-60d.csv",
        jql: 'project = DPSA AND (created >= -60d OR updated >= -60d) AND summary !~ "REMINDER Notice to DL" AND summary !~ "Offboarding" ORDER BY updated DESC',
      },
      {
        project: "AOMA",
        filename: "aoma-tickets-60d.csv",
        jql: 'project = AOMA AND (created >= -60d OR updated >= -60d) AND summary !~ "REMINDER Notice to DL" AND summary !~ "Offboarding" ORDER BY updated DESC',
      },
      {
        project: "AOMA2",
        filename: "aoma2-tickets-60d.csv",
        jql: 'project = AOMA2 AND (created >= -60d OR updated >= -60d) AND summary !~ "REMINDER Notice to DL" AND summary !~ "Offboarding" ORDER BY updated DESC',
      },
      {
        project: "AOMA3",
        filename: "aoma3-tickets-60d.csv",
        jql: 'project = AOMA3 AND (created >= -60d OR updated >= -60d) AND summary !~ "REMINDER Notice to DL" AND summary !~ "Offboarding" ORDER BY updated DESC',
      },
      {
        project: "ITSM",
        filename: "itsm-tickets-60d.csv",
        jql: 'project = ITSM AND (created >= -60d OR updated >= -60d) AND summary !~ "REMINDER Notice to DL" AND summary !~ "Offboarding" ORDER BY updated DESC',
      },
      {
        project: "UST",
        filename: "ust-tickets-60d.csv",
        jql: 'project = UST AND (created >= -60d OR updated >= -60d) AND summary !~ "REMINDER Notice to DL" AND summary !~ "Offboarding" ORDER BY updated DESC',
      },
    ];

    console.log("📊 Step 3: Running queries and exporting CSVs...");
    console.log("");

    for (const query of queries) {
      console.log(`\n🔍 Processing ${query.project}...`);

      // Navigate to query
      const url = `https://jira.smedigitalapps.com/jira/issues/?jql=${encodeURIComponent(query.jql)}`;
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
      await page.waitForTimeout(3000);

      // Get result count
      const resultCount = await page.evaluate(() => {
        const countEl = document.querySelector(
          ".results-count-total, .showing-count, .issue-count, .results-count"
        );
        return countEl ? countEl.textContent.trim() : "unknown";
      });

      console.log(`   Results found: ${resultCount}`);

      // Click Export button
      console.log("   📥 Clicking Export button...");

      // Try different selectors for export button
      const exportButton = await page
        .locator('button:has-text("Export"), a:has-text("Export"), .export-button')
        .first();
      if ((await exportButton.count()) > 0) {
        await exportButton.click();
        await page.waitForTimeout(1000);

        // Click "CSV (All fields)" option
        console.log("   📋 Selecting CSV (All fields)...");
        const csvAllFieldsOption = await page
          .locator('text=/CSV.*All.*fields/i, a:has-text("CSV"), li:has-text("CSV")')
          .first();
        if ((await csvAllFieldsOption.count()) > 0) {
          await csvAllFieldsOption.click();
          await page.waitForTimeout(2000);
          console.log(`   ✅ Export initiated for ${query.filename}`);
        } else {
          console.log("   ⚠️  Could not find CSV export option");
        }
      } else {
        console.log("   ⚠️  Could not find Export button");
      }
    }

    console.log("");
    console.log("✅ All queries completed!");
    console.log("");
    console.log("📁 Check tmp/jira-exports/ for downloaded files");
  } catch (error) {
    console.error("❌ Error:", error.message);
    console.error(error.stack);
  } finally {
    console.log("");
    console.log("Press Ctrl+C to close the browser when done...");
    // Don't close browser automatically so user can verify downloads
    // await browser.close();
  }
}

runAutomatedExport().catch(console.error);
