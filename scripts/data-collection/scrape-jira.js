#!/usr/bin/env node

/**
 * JIRA Ticket Scraper
 *
 * Scrapes JIRA tickets using Playwright and JQL queries.
 * Generates embeddings and stores in Supabase.
 *
 * Requirements:
 * - Must be on corporate VPN
 * - Microsoft SSO credentials in environment (AAD_USERNAME, AAD_PASSWORD)
 * - 2FA device available for MFA approval
 *
 * Usage:
 *   npm run scrape:jira
 *   node scripts/data-collection/scrape-jira.js
 *   node scripts/data-collection/scrape-jira.js --headless  (runs in background)
 *
 * @module scripts/data-collection/scrape-jira
 */

// Load environment variables FIRST
require('dotenv').config({ path: '.env.local' });

const { chromium } = require('playwright');
const fs = require('fs').promises;
const path = require('path');

// Import utilities
const { authenticateWithMicrosoft, saveAuthState, loadAuthState } = require('../../utils/auth/microsoft-sso');
const { generateEmbeddingsBatch, createJiraEmbeddingText } = require('../../utils/embeddings/openai');
const { deduplicateJiraTickets, insertJiraTickets, updateJiraTickets, upsertJiraEmbeddings } = require('../../utils/supabase/deduplication');

// Configuration
const JIRA_BASE_URL = process.env.JIRA_BASE_URL || 'https://jira.smedigitalapps.com/jira';
const AUTH_STORAGE_PATH = path.join(__dirname, '../../tmp/jira-auth.json');
const LOG_FILE = path.join(__dirname, '../../logs/jira-scrape.log');

// JQL queries to run
// Last update was July 3, 2025 (99 days ago)
// Using 110d to cover gap + buffer
const JQL_QUERIES = [
  {
    name: 'All updates since last run (110 days)',
    jql: 'updated >= -110d ORDER BY updated DESC'
  },
  {
    name: 'Open tickets',
    jql: 'status in ("To Do", "In Progress", "In Review") AND updated >= -110d ORDER BY priority DESC, created DESC'
  },
  {
    name: 'Recent bugs',
    jql: 'type = Bug AND updated >= -110d ORDER BY priority DESC'
  },
  {
    name: 'AOMA project tickets',
    jql: 'project = AOMA AND updated >= -110d ORDER BY updated DESC'
  }
];

// Command line arguments
const args = process.argv.slice(2);
const headless = args.includes('--headless');
const maxTickets = args.includes('--limit') ?
  parseInt(args[args.indexOf('--limit') + 1]) : 1000;

/**
 * Log message to console and file
 */
async function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}`;
  console.log(message);

  try {
    const logDir = path.dirname(LOG_FILE);
    await fs.mkdir(logDir, { recursive: true });
    await fs.appendFile(LOG_FILE, logMessage + '\n');
  } catch (error) {
    // Fail silently if logging fails
  }
}

/**
 * Extract tickets from JIRA search results page
 */
async function extractTicketsFromPage(page) {
  return await page.evaluate(() => {
    const tickets = [];

    // Try different JIRA UI structures
    // Modern JIRA uses issue rows
    const issueRows = document.querySelectorAll('[data-issue-key], .issue-row, [data-testid="issue.views.issue-base.foundation.summary.heading"]');

    issueRows.forEach(row => {
      try {
        // Extract ticket key
        let key = row.getAttribute('data-issue-key');
        if (!key) {
          const keyElement = row.querySelector('.issue-link-key, [data-testid="issue-key"]');
          key = keyElement ? keyElement.textContent.trim() : null;
        }

        if (!key) return; // Skip if no key found

        // Extract summary/title
        const summaryElement = row.querySelector('.summary, [data-testid="issue-summary"]');
        const summary = summaryElement ? summaryElement.textContent.trim() : '';

        // Extract status
        const statusElement = row.querySelector('.status, [data-testid="issue-status"]');
        const status = statusElement ? statusElement.textContent.trim() : '';

        // Extract priority
        const priorityElement = row.querySelector('.priority, [data-testid="issue-priority"]');
        const priority = priorityElement ? priorityElement.textContent.trim() : '';

        tickets.push({
          key,
          summary,
          status,
          priority
        });
      } catch (error) {
        // Skip problematic rows
      }
    });

    return tickets;
  });
}

/**
 * Get ticket details from ticket page
 */
async function getTicketDetails(page, ticketKey) {
  const ticketUrl = `${JIRA_BASE_URL}/browse/${ticketKey}`;

  try {
    await page.goto(ticketUrl, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2000);

    // Extract detailed information
    const details = await page.evaluate(() => {
      // Description
      let description = '';
      const descriptionElement = document.querySelector('[data-testid="issue.views.field.rich-text.description"], .user-content-block, .description');
      if (descriptionElement) {
        description = descriptionElement.textContent.trim();
      }

      // Type
      const typeElement = document.querySelector('[data-testid="issue.views.field.issue-type"]');
      const type = typeElement ? typeElement.textContent.trim() : '';

      // Assignee
      const assigneeElement = document.querySelector('[data-testid="issue.views.field.user.assignee"]');
      const assignee = assigneeElement ? assigneeElement.textContent.trim() : '';

      // Reporter
      const reporterElement = document.querySelector('[data-testid="issue.views.field.user.reporter"]');
      const reporter = reporterElement ? reporterElement.textContent.trim() : '';

      // Project
      const projectElement = document.querySelector('[data-testid="issue.views.field.project"]');
      const project = projectElement ? projectElement.textContent.trim() : '';

      return {
        description,
        type,
        assignee,
        reporter,
        project
      };
    });

    return details;
  } catch (error) {
    console.log(`⚠️  Could not get details for ${ticketKey}: ${error.message}`);
    return null;
  }
}

/**
 * Run JQL query and extract tickets
 */
async function runJQLQuery(page, jql, queryName) {
  await log(`\n🔍 Running query: ${queryName}`);
  await log(`   JQL: ${jql}`);

  // Navigate to JIRA search with JQL
  const searchUrl = `${JIRA_BASE_URL}/issues/?jql=${encodeURIComponent(jql)}`;
  await page.goto(searchUrl, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);

  // Extract tickets from search results
  const tickets = await extractTicketsFromPage(page);
  await log(`   Found ${tickets.length} tickets`);

  return tickets;
}

/**
 * Main scraping function
 */
async function scrapeJira() {
  await log('🚀 Starting JIRA scraper');
  await log(`   Base URL: ${JIRA_BASE_URL}`);
  await log(`   Headless: ${headless}`);
  await log(`   Max tickets: ${maxTickets}`);

  const browser = await chromium.launch({
    headless,
    slowMo: headless ? 0 : 100
  });

  let allTickets = [];

  try {
    // Load existing authentication or create new context
    const authState = await loadAuthState(AUTH_STORAGE_PATH);
    const context = authState ?
      await browser.newContext({ storageState: authState }) :
      await browser.newContext();

    const page = await context.newPage();

    // Authenticate with Microsoft SSO
    const authenticated = await authenticateWithMicrosoft(page, {
      url: JIRA_BASE_URL,
      mfaTimeout: 180,
      onMFAPrompt: () => {
        console.log('\n🔔 Check your phone for MFA approval!');
      }
    });

    if (!authenticated) {
      throw new Error('Authentication failed!');
    }

    // Save authentication state
    await saveAuthState(context, AUTH_STORAGE_PATH);

    // Run all JQL queries
    await log('\n📊 Running JQL queries...');

    for (const query of JQL_QUERIES) {
      try {
        const tickets = await runJQLQuery(page, query.jql, query.name);
        allTickets.push(...tickets);
      } catch (error) {
        await log(`❌ Failed to run query "${query.name}": ${error.message}`);
      }
    }

    await log(`\n📦 Total tickets collected: ${allTickets.length}`);

    // De-duplicate tickets
    const uniqueTickets = [];
    const seenKeys = new Set();

    for (const ticket of allTickets) {
      if (!seenKeys.has(ticket.key)) {
        seenKeys.add(ticket.key);
        uniqueTickets.push(ticket);
      }
    }

    await log(`   Unique tickets: ${uniqueTickets.length}`);

    // Limit if specified
    const ticketsToProcess = uniqueTickets.slice(0, maxTickets);
    await log(`   Processing: ${ticketsToProcess.length} tickets`);

    // Get detailed information for each ticket (sample for now)
    await log('\n📝 Fetching ticket details...');
    const detailedTickets = [];

    // Only fetch details for first 50 tickets to avoid timeout
    // (In production, you might want to fetch all)
    const sampleSize = Math.min(50, ticketsToProcess.length);

    for (let i = 0; i < sampleSize; i++) {
      const ticket = ticketsToProcess[i];
      const details = await getTicketDetails(page, ticket.key);

      if (details) {
        detailedTickets.push({
          external_id: ticket.key,
          title: ticket.summary,
          description: details.description,
          status: ticket.status,
          priority: ticket.priority,
          metadata: {
            type: details.type,
            assignee: details.assignee,
            reporter: details.reporter,
            project: details.project || ticket.key.split('-')[0]
          }
        });
      }

      // Progress indicator
      if ((i + 1) % 10 === 0) {
        await log(`   Processed ${i + 1}/${sampleSize} tickets...`);
      }
    }

    await log(`✅ Collected details for ${detailedTickets.length} tickets`);

    // For remaining tickets without details, create basic entries
    for (let i = sampleSize; i < ticketsToProcess.length; i++) {
      const ticket = ticketsToProcess[i];
      detailedTickets.push({
        external_id: ticket.key,
        title: ticket.summary,
        description: '',
        status: ticket.status,
        priority: ticket.priority,
        metadata: {
          project: ticket.key.split('-')[0]
        }
      });
    }

    await log(`\n💾 Saving to Supabase...`);

    // Deduplicate against database
    const { new: newTickets, updated: updatedTickets, unchanged } =
      await deduplicateJiraTickets(detailedTickets);

    // Insert new tickets
    const inserted = await insertJiraTickets(newTickets);

    // Update existing tickets
    await updateJiraTickets(updatedTickets);

    // Generate embeddings for new and updated tickets
    const ticketsNeedingEmbeddings = [...inserted, ...updatedTickets];

    if (ticketsNeedingEmbeddings.length > 0) {
      await log(`\n🧠 Generating embeddings for ${ticketsNeedingEmbeddings.length} tickets...`);

      const textsForEmbedding = ticketsNeedingEmbeddings.map(ticket =>
        createJiraEmbeddingText(ticket)
      );

      const embeddings = await generateEmbeddingsBatch(textsForEmbedding, {
        batchSize: 100,
        delayMs: 1000,
        onProgress: (progress) => {
          console.log(`   Progress: ${progress.processed}/${progress.total}`);
        }
      });

      // Prepare embeddings for upsert
      const embeddingsWithKeys = embeddings.map((embedding, index) => ({
        external_id: ticketsNeedingEmbeddings[index].external_id,
        summary: ticketsNeedingEmbeddings[index].title,
        embedding
      }));

      await upsertJiraEmbeddings(embeddingsWithKeys);
    }

    await log('\n✅ JIRA scraping completed successfully!');
    await log(`\n📊 Summary:`);
    await log(`   New tickets: ${newTickets.length}`);
    await log(`   Updated tickets: ${updatedTickets.length}`);
    await log(`   Unchanged tickets: ${unchanged.length}`);
    await log(`   Embeddings generated: ${ticketsNeedingEmbeddings.length}`);

    // Keep browser open for inspection in non-headless mode
    if (!headless) {
      await log('\n📌 Browser will stay open for 30 seconds...');
      await page.waitForTimeout(30000);
    }

  } catch (error) {
    await log(`\n❌ Error: ${error.message}`);
    await log(error.stack);
    throw error;
  } finally {
    await browser.close();
    await log('👋 Browser closed');
  }
}

// Run the scraper
if (require.main === module) {
  scrapeJira()
    .then(() => {
      console.log('\n✅ Done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Failed:', error.message);
      process.exit(1);
    });
}

module.exports = { scrapeJira };
