#!/usr/bin/env node

/**
 * Manual JIRA Ticket Upsert Script
 *
 * Updated: October 11, 2025
 *
 * This script processes manually exported JIRA tickets (CSV or JSON)
 * and upserts them to Supabase with proper deduplication.
 *
 * IMPROVEMENTS FROM JULY 2025:
 * - Better deduplication (checks ticket_key to avoid duplicates)
 * - Batch processing with progress tracking
 * - Resume capability (checkpoints)
 * - Better error handling
 * - Dry-run mode
 *
 * Usage:
 *   # Dry run (shows what would be done):
 *   node scripts/data-collection/manual-jira-upsert.js --file jira-export.csv --dry-run
 *
 *   # Actual upsert:
 *   node scripts/data-collection/manual-jira-upsert.js --file jira-export.csv
 *
 *   # With custom batch size:
 *   node scripts/data-collection/manual-jira-upsert.js --file jira-export.json --batch-size 50
 *
 * Input Formats:
 *
 * CSV format:
 *   ticket_key,summary,description,status,priority,project
 *   ITSM-12345,"Issue title","Issue description","Open","High","ITSM"
 *
 * JSON format:
 *   [
 *     {
 *       "key": "ITSM-12345",
 *       "summary": "Issue title",
 *       "description": "Issue description",
 *       "status": "Open",
 *       "priority": "High",
 *       "fields": { ... }
 *     }
 *   ]
 */

const { createClient } = require('@supabase/supabase-js');
const { embed } = require('ai');
const { openai } = require('@ai-sdk/openai');
const fs = require('fs').promises;
const path = require('path');
const csv = require('csv-parser');
const { createReadStream } = require('fs');

require('dotenv').config({ path: '.env.local' });

// Configuration
const BATCH_SIZE = 100; // Embeddings per batch (OpenAI rate limit friendly)
const CHECKPOINT_FILE = 'tmp/jira-upsert-checkpoint.json';
const LOG_FILE = 'logs/jira-upsert.log';

// Parse arguments
const args = process.argv.slice(2);
const fileIndex = args.indexOf('--file');
const dryRun = args.includes('--dry-run');
const batchSizeIndex = args.indexOf('--batch-size');
const resumeFlag = args.includes('--resume');

const inputFile = fileIndex !== -1 ? args[fileIndex + 1] : null;
const customBatchSize = batchSizeIndex !== -1 ? parseInt(args[batchSizeIndex + 1]) : BATCH_SIZE;

// Validate arguments
if (!inputFile && !resumeFlag) {
  console.error('❌ Usage: node manual-jira-upsert.js --file <path-to-jira-export> [--dry-run] [--batch-size N] [--resume]');
  process.exit(1);
}

// Initialize Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

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
 * Parse CSV file
 */
async function parseCSV(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', reject);
  });
}

/**
 * Parse JSON file
 */
async function parseJSON(filePath) {
  const content = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(content);
}

/**
 * Normalize ticket format (handles both CSV and JSON)
 */
function normalizeTicket(rawTicket) {
  return {
    ticket_key: rawTicket.key || rawTicket.ticket_key || rawTicket.Key,
    summary: rawTicket.summary || rawTicket.Summary || rawTicket.title || '',
    description: rawTicket.description || rawTicket.Description || '',
    status: rawTicket.status || rawTicket.Status || '',
    priority: rawTicket.priority || rawTicket.Priority || '',
    project: rawTicket.project || rawTicket.Project || (rawTicket.ticket_key || rawTicket.key || '').split('-')[0],
    metadata: rawTicket.fields || rawTicket.metadata || {}
  };
}

/**
 * Generate embedding for a ticket
 */
async function generateEmbedding(ticket) {
  const model = openai.embedding('text-embedding-3-small');

  // Create embedding text from ticket
  const text = [
    `Ticket: ${ticket.ticket_key}`,
    `Summary: ${ticket.summary}`,
    ticket.description ? `Description: ${ticket.description.substring(0, 2000)}` : '',
    `Status: ${ticket.status}`,
    `Priority: ${ticket.priority}`,
    `Project: ${ticket.project}`
  ].filter(Boolean).join('\n');

  const result = await embed({
    model,
    value: text
  });

  return result.embedding;
}

/**
 * Check which tickets already exist in database
 */
async function checkExistingTickets(ticketKeys) {
  const { data, error } = await supabase
    .from('jira_ticket_embeddings')
    .select('ticket_key, updated_at')
    .in('ticket_key', ticketKeys);

  if (error) {
    throw new Error(`Failed to check existing tickets: ${error.message}`);
  }

  const existing = new Map();
  data.forEach(row => {
    existing.set(row.ticket_key, new Date(row.updated_at));
  });

  return existing;
}

/**
 * Upsert ticket embeddings (avoids duplicates)
 */
async function upsertTickets(ticketsWithEmbeddings) {
  const records = ticketsWithEmbeddings.map(t => ({
    ticket_key: t.ticket_key,
    summary: t.summary,
    embedding: `[${t.embedding.join(',')}]`, // Store as TEXT format (current schema)
    metadata: {
      ...t.metadata,
      status: t.status,
      priority: t.priority,
      project: t.project,
      description: t.description ? t.description.substring(0, 500) : '',
      generated_at: new Date().toISOString()
    }
  }));

  // Upsert in batches to avoid timeout
  const batchSize = 500;
  let inserted = 0;
  let updated = 0;

  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);

    // Use upsert to handle both inserts and updates
    const { data, error } = await supabase
      .from('jira_ticket_embeddings')
      .upsert(batch, {
        onConflict: 'ticket_key',
        ignoreDuplicates: false
      })
      .select();

    if (error) {
      throw new Error(`Failed to upsert batch ${i / batchSize + 1}: ${error.message}`);
    }

    // Count inserts vs updates (approximate)
    const batchResult = data || [];
    updated += batchResult.length;

    await log(`   Batch ${Math.floor(i / batchSize) + 1}: Upserted ${batch.length} tickets`);
  }

  return { inserted, updated: records.length };
}

/**
 * Save checkpoint for resume capability
 */
async function saveCheckpoint(checkpoint) {
  const dir = path.dirname(CHECKPOINT_FILE);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(CHECKPOINT_FILE, JSON.stringify(checkpoint, null, 2));
}

/**
 * Load checkpoint
 */
async function loadCheckpoint() {
  try {
    const content = await fs.readFile(CHECKPOINT_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    return null;
  }
}

/**
 * Main upsert function
 */
async function main() {
  const startTime = Date.now();

  await log('🚀 JIRA Manual Upsert - October 2025');
  await log(`   Mode: ${dryRun ? 'DRY RUN' : 'LIVE UPSERT'}`);
  await log(`   Batch size: ${customBatchSize}`);
  await log('');

  let tickets;
  let processedKeys = new Set();

  // Check for resume
  if (resumeFlag) {
    const checkpoint = await loadCheckpoint();
    if (checkpoint) {
      await log(`📂 Resuming from checkpoint...`);
      await log(`   Processed: ${checkpoint.processed.length} tickets`);
      processedKeys = new Set(checkpoint.processed);
      tickets = checkpoint.remaining;
    } else {
      await log(`⚠️  No checkpoint found. Starting fresh...`);
    }
  }

  // Load tickets if not resuming
  if (!tickets) {
    await log(`📂 Loading tickets from: ${inputFile}`);

    const ext = path.extname(inputFile).toLowerCase();
    const rawTickets = ext === '.csv'
      ? await parseCSV(inputFile)
      : await parseJSON(inputFile);

    tickets = rawTickets.map(normalizeTicket);
    await log(`   Loaded: ${tickets.length} tickets`);
  }

  // Validate ticket format
  const invalidTickets = tickets.filter(t => !t.ticket_key || !t.summary);
  if (invalidTickets.length > 0) {
    await log(`⚠️  Found ${invalidTickets.length} tickets without key or summary`);
    await log(`   First invalid: ${JSON.stringify(invalidTickets[0])}`);
  }

  const validTickets = tickets.filter(t => t.ticket_key && t.summary);
  await log(`   Valid tickets: ${validTickets.length}`);

  // Check for existing tickets
  await log(`\n🔍 Checking for existing tickets...`);
  const ticketKeys = validTickets.map(t => t.ticket_key);
  const existing = await checkExistingTickets(ticketKeys);

  const newTickets = validTickets.filter(t => !existing.has(t.ticket_key));
  const existingTickets = validTickets.filter(t => existing.has(t.ticket_key));

  await log(`   New tickets: ${newTickets.length}`);
  await log(`   Existing tickets (will update): ${existingTickets.length}`);

  if (dryRun) {
    await log(`\n✅ DRY RUN COMPLETE`);
    await log(`\n📊 Summary:`);
    await log(`   Would insert: ${newTickets.length} new tickets`);
    await log(`   Would update: ${existingTickets.length} existing tickets`);
    await log(`   Total operations: ${validTickets.length}`);
    await log(`\n💡 Run without --dry-run to execute`);
    return;
  }

  // Process tickets in batches
  await log(`\n🧠 Generating embeddings and upserting...`);

  const ticketsToProcess = validTickets.filter(t => !processedKeys.has(t.ticket_key));
  const totalBatches = Math.ceil(ticketsToProcess.length / customBatchSize);

  for (let i = 0; i < ticketsToProcess.length; i += customBatchSize) {
    const batch = ticketsToProcess.slice(i, i + customBatchSize);
    const batchNum = Math.floor(i / customBatchSize) + 1;

    await log(`\n📦 Batch ${batchNum}/${totalBatches} (${batch.length} tickets)`);

    // Generate embeddings
    await log(`   Generating embeddings...`);
    const ticketsWithEmbeddings = [];

    for (let j = 0; j < batch.length; j++) {
      const ticket = batch[j];

      try {
        const embedding = await generateEmbedding(ticket);
        ticketsWithEmbeddings.push({
          ...ticket,
          embedding
        });

        if ((j + 1) % 10 === 0) {
          await log(`   Progress: ${j + 1}/${batch.length}`);
        }

        // Rate limit: 1000 requests/min = ~60ms delay
        await new Promise(resolve => setTimeout(resolve, 70));
      } catch (error) {
        await log(`   ⚠️  Failed to generate embedding for ${ticket.ticket_key}: ${error.message}`);
      }
    }

    // Upsert to database
    await log(`   Upserting ${ticketsWithEmbeddings.length} tickets...`);
    const { inserted, updated } = await upsertTickets(ticketsWithEmbeddings);

    await log(`   ✅ Batch complete: ${updated} tickets upserted`);

    // Update checkpoint
    batch.forEach(t => processedKeys.add(t.ticket_key));
    await saveCheckpoint({
      processed: Array.from(processedKeys),
      remaining: ticketsToProcess.slice(i + customBatchSize),
      timestamp: new Date().toISOString()
    });
  }

  // Final stats
  const duration = Math.round((Date.now() - startTime) / 1000);
  await log(`\n✅ UPSERT COMPLETE`);
  await log(`\n📊 Final Summary:`);
  await log(`   Total processed: ${validTickets.length} tickets`);
  await log(`   Duration: ${duration}s`);
  await log(`   Average: ${(duration / validTickets.length).toFixed(2)}s per ticket`);

  // Clean up checkpoint
  await fs.unlink(CHECKPOINT_FILE).catch(() => {});
}

// Run script
if (require.main === module) {
  main()
    .then(() => {
      console.log('\n✅ Done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Failed:', error.message);
      console.error(error.stack);
      process.exit(1);
    });
}

module.exports = { main };
