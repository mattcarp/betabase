#!/usr/bin/env node

/**
 * Comprehensive JIRA Deduplication Script
 * 
 * Deduplicates both jira_tickets and jira_ticket_embeddings tables.
 * Replaces the old deduplicate-jira-embeddings.js script.
 * 
 * Strategy: Group by identifier → Sort by updated_at DESC → Keep most recent → Delete older ones
 * 
 * Usage:
 *   # Dry run on both tables
 *   node scripts/deduplicate-jira-all.js --dry-run
 * 
 *   # Dedupe both tables (live)
 *   node scripts/deduplicate-jira-all.js
 * 
 *   # Dedupe only embeddings table
 *   node scripts/deduplicate-jira-all.js --table=embeddings
 * 
 *   # Dedupe only tickets table
 *   node scripts/deduplicate-jira-all.js --table=tickets
 */

require('dotenv').config({ path: '.env.local' });
const fs = require('fs').promises;
const path = require('path');
const {
  deduplicateJiraTickets,
  deduplicateJiraEmbeddings,
  deduplicateAll,
} = require('../utils/supabase/deduplicate-jira');

// Parse command line arguments
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const tableArg = args.find(arg => arg.startsWith('--table='));
const targetTable = tableArg ? tableArg.split('=')[1] : 'all';

// Validate table argument
const validTables = ['all', 'tickets', 'embeddings'];
if (!validTables.includes(targetTable)) {
  console.error(`❌ Invalid table: ${targetTable}`);
  console.error(`   Valid options: ${validTables.join(', ')}`);
  process.exit(1);
}

// Log file
const LOG_FILE = path.join(__dirname, '../logs/jira-deduplicate.log');

/**
 * Logger that writes to both console and file
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
 * Main execution function
 */
async function main() {
  await log('🚀 JIRA Deduplication Script\n');
  await log(`   Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}`);
  await log(`   Target: ${targetTable}\n`);

  if (dryRun) {
    await log('⚠️  DRY RUN MODE - No changes will be made\n');
  } else {
    await log('⚠️  About to deduplicate JIRA data...');
    await log('   Press Ctrl+C to cancel, or continuing in 3 seconds...\n');
    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  const options = { dryRun, logger: log };
  let result;

  try {
    switch (targetTable) {
      case 'tickets':
        result = await deduplicateJiraTickets(options);
        break;
      
      case 'embeddings':
        result = await deduplicateJiraEmbeddings(options);
        break;
      
      case 'all':
      default:
        result = await deduplicateAll(options);
        break;
    }

    await log('\n✅ Deduplication script completed successfully!');
    
    if (dryRun) {
      await log('\n💡 Run without --dry-run to actually delete duplicates');
    }

    process.exit(0);
  } catch (error) {
    await log(`\n❌ Error: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { main };

