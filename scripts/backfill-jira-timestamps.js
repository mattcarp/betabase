#!/usr/bin/env node

/**
 * Backfill JIRA Ticket Timestamps
 * 
 * Migrates created/updated timestamps from metadata JSON to proper columns.
 * Also pulls timestamps from jira_ticket_embeddings where available.
 * 
 * Usage:
 *   # Dry run (see what would be updated)
 *   node scripts/backfill-jira-timestamps.js --dry-run
 * 
 *   # Actually update timestamps
 *   node scripts/backfill-jira-timestamps.js
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const LOG_FILE = path.join(__dirname, '../logs/jira-timestamp-backfill.log');
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');

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
    // Fail silently
  }
}

/**
 * Parse JIRA date string to ISO timestamp
 */
function parseJiraDate(dateStr) {
  if (!dateStr || dateStr === 'N/A' || dateStr.trim() === '') {
    return null;
  }

  try {
    // JIRA exports typically use formats like:
    // "2025-10-21 09:26" or "21/Oct/25 9:26 AM" or ISO format
    const date = new Date(dateStr);
    
    if (isNaN(date.getTime())) {
      return null;
    }
    
    return date.toISOString();
  } catch (error) {
    return null;
  }
}

/**
 * Backfill timestamps from metadata and embeddings table
 */
async function backfillTimestamps() {
  await log('🚀 JIRA Timestamp Backfill Script\n');
  await log(`   Mode: ${dryRun ? 'DRY RUN' : 'LIVE UPDATE'}\n`);

  if (dryRun) {
    await log('⚠️  DRY RUN MODE - No changes will be made\n');
  } else {
    await log('⚠️  About to update timestamp data...');
    await log('   Press Ctrl+C to cancel, or continuing in 3 seconds...\n');
    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  // Fetch all tickets with pagination
  await log('📥 Fetching tickets from jira_tickets...');
  
  let allTickets = [];
  let offset = 0;
  const pageSize = 1000;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase
      .from('jira_tickets')
      .select('id, external_id, metadata, created_at, updated_at')
      .order('external_id')
      .range(offset, offset + pageSize - 1);

    if (error) {
      throw new Error(`Failed to fetch tickets: ${error.message}`);
    }

    if (data.length === 0) break;

    allTickets = allTickets.concat(data);
    await log(`   Fetched ${allTickets.length} tickets...`);

    offset += pageSize;
    hasMore = data.length === pageSize;
  }

  await log(`\n📊 Total tickets: ${allTickets.length}\n`);

  // Fetch timestamps from embeddings table for cross-reference
  await log('📥 Fetching timestamps from jira_ticket_embeddings...');
  
  let embeddingsData = [];
  let embOffset = 0;
  let hasMoreEmb = true;

  while (hasMoreEmb) {
    const { data, error } = await supabase
      .from('jira_ticket_embeddings')
      .select('ticket_key, created_at, updated_at')
      .range(embOffset, embOffset + pageSize - 1);

    if (error) {
      throw new Error(`Failed to fetch embeddings: ${error.message}`);
    }

    if (data.length === 0) break;

    embeddingsData = embeddingsData.concat(data);
    embOffset += pageSize;
    hasMoreEmb = data.length === pageSize;
  }

  // Create lookup map
  const embeddingsMap = new Map();
  embeddingsData.forEach(emb => {
    embeddingsMap.set(emb.ticket_key, {
      created_at: emb.created_at,
      updated_at: emb.updated_at,
    });
  });

  await log(`   Found ${embeddingsData.length} embeddings with timestamps\n`);

  // Process tickets and determine which need updates
  const updates = [];
  let metadataSource = 0;
  let embeddingsSource = 0;
  let noTimestamps = 0;

  for (const ticket of allTickets) {
    const update = {
      id: ticket.id,
      external_id: ticket.external_id,
      created_at: ticket.created_at,
      updated_at: ticket.updated_at,
      needsUpdate: false,
    };

    // Try to get timestamps from metadata
    if (ticket.metadata) {
      if (!update.created_at && ticket.metadata.created) {
        const parsed = parseJiraDate(ticket.metadata.created);
        if (parsed) {
          update.created_at = parsed;
          update.needsUpdate = true;
          metadataSource++;
        }
      }

      if (!update.updated_at && ticket.metadata.updated) {
        const parsed = parseJiraDate(ticket.metadata.updated);
        if (parsed) {
          update.updated_at = parsed;
          update.needsUpdate = true;
          metadataSource++;
        }
      }
    }

    // Try to get timestamps from embeddings table
    const embData = embeddingsMap.get(ticket.external_id);
    if (embData) {
      if (!update.created_at && embData.created_at) {
        update.created_at = embData.created_at;
        update.needsUpdate = true;
        embeddingsSource++;
      }

      if (!update.updated_at && embData.updated_at) {
        update.updated_at = embData.updated_at;
        update.needsUpdate = true;
        embeddingsSource++;
      }
    }

    if (update.needsUpdate) {
      updates.push(update);
    } else if (!update.created_at && !update.updated_at) {
      noTimestamps++;
    }
  }

  await log(`📊 Analysis:`);
  await log(`   Tickets needing timestamp updates: ${updates.length}`);
  await log(`   Timestamps from metadata: ${metadataSource}`);
  await log(`   Timestamps from embeddings table: ${embeddingsSource}`);
  await log(`   Tickets with no available timestamps: ${noTimestamps}\n`);

  if (updates.length === 0) {
    await log('✅ No updates needed! All timestamps are already populated.\n');
    return;
  }

  // Show sample of what will be updated
  await log('📋 Sample updates (first 5):');
  for (const u of updates.slice(0, 5)) {
    await log(`   ${u.external_id}:`);
    await log(`     created_at: ${u.created_at || 'null'}`);
    await log(`     updated_at: ${u.updated_at || 'null'}`);
  }
  await log('');

  if (dryRun) {
    await log('✅ DRY RUN COMPLETE\n');
    await log(`   Would update ${updates.length} tickets with timestamps`);
    await log('\n💡 Run without --dry-run to actually update');
    return;
  }

  // Perform updates
  await log('💾 Updating timestamps in database...\n');

  const batchSize = 100;
  let updated = 0;

  for (let i = 0; i < updates.length; i += batchSize) {
    const batch = updates.slice(i, i + batchSize);

    for (const item of batch) {
      const { error } = await supabase
        .from('jira_tickets')
        .update({
          created_at: item.created_at,
          updated_at: item.updated_at,
        })
        .eq('id', item.id);

      if (error) {
        await log(`   ⚠️  Failed to update ${item.external_id}: ${error.message}`);
      } else {
        updated++;
      }
    }

    await log(`   ✓ Updated ${Math.min(i + batchSize, updates.length)}/${updates.length} tickets`);
  }

  await log(`\n✅ BACKFILL COMPLETE\n`);
  await log(`   Total tickets updated: ${updated}`);
  await log(`   Timestamps from metadata: ${metadataSource}`);
  await log(`   Timestamps from embeddings: ${embeddingsSource}`);
  
  if (noTimestamps > 0) {
    await log(`\n⚠️  ${noTimestamps} tickets still have no timestamps`);
    await log(`   These may need to be manually populated from JIRA API`);
  }
}

// Run script
if (require.main === module) {
  backfillTimestamps()
    .then(() => {
      console.log('\n✅ Done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Error:', error.message);
      console.error(error.stack);
      process.exit(1);
    });
}

module.exports = { backfillTimestamps };

