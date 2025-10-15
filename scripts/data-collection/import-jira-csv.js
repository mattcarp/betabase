#!/usr/bin/env node

/**
 * JIRA CSV Import Script
 * 
 * Imports JIRA tickets from CSV export, generates embeddings, and upserts to database.
 * 
 * Usage:
 *   node scripts/data-collection/import-jira-csv.js <path-to-csv>
 *   node scripts/data-collection/import-jira-csv.js ~/Downloads/jira-export.csv
 */

require('dotenv').config({ path: '.env.local' });
const fs = require('fs').promises;
const path = require('path');
const { parse } = require('csv-parse/sync');

// Import utilities
const { generateEmbeddingsBatch } = require('../../utils/embeddings/openai');
const { createClient } = require('@supabase/supabase-js');

// Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Parse JIRA CSV file
 */
async function parseJiraCSV(filePath) {
  console.log(`📂 Reading CSV file: ${filePath}`);
  
  const fileContent = await fs.readFile(filePath, 'utf-8');
  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true
  });

  console.log(`✅ Parsed ${records.length} records from CSV`);
  return records;
}

/**
 * Transform CSV record to ticket object
 */
function transformRecord(record) {
  // JIRA CSV exports typically have these columns (adjust based on your export):
  // Issue key, Summary, Description, Status, Priority, Assignee, Reporter, Created, Updated, etc.
  
  return {
    external_id: record['Issue key'] || record['Key'] || record['Issue Key'],
    title: record['Summary'] || '',
    description: record['Description'] || '',
    status: record['Status'] || '',
    priority: record['Priority'] || '',
    metadata: {
      assignee: record['Assignee'] || '',
      reporter: record['Reporter'] || '',
      type: record['Issue Type'] || record['Type'] || '',
      project: record['Project'] || '',
      created: record['Created'] || '',
      updated: record['Updated'] || '',
      resolution: record['Resolution'] || '',
      labels: record['Labels'] || '',
      components: record['Components'] || '',
      affects_versions: record['Affects Version/s'] || '',
      fix_versions: record['Fix Version/s'] || ''
    }
  };
}

/**
 * Create embedding text from ticket
 */
function createEmbeddingText(ticket) {
  const parts = [
    `Ticket: ${ticket.external_id}`,
    `Title: ${ticket.title}`,
    `Status: ${ticket.status}`,
    `Priority: ${ticket.priority}`
  ];

  if (ticket.description) {
    parts.push(`Description: ${ticket.description}`);
  }

  if (ticket.metadata.type) {
    parts.push(`Type: ${ticket.metadata.type}`);
  }

  if (ticket.metadata.project) {
    parts.push(`Project: ${ticket.metadata.project}`);
  }

  return parts.join('\n');
}

/**
 * Upsert tickets to database
 */
async function upsertTickets(tickets) {
  console.log(`\n💾 Upserting ${tickets.length} tickets to database...`);

  const batchSize = 100;
  let inserted = 0;
  let updated = 0;

  for (let i = 0; i < tickets.length; i += batchSize) {
    const batch = tickets.slice(i, i + batchSize);
    
    const { data, error } = await supabase
      .from('jira_tickets')
      .upsert(batch, {
        onConflict: 'external_id',
        ignoreDuplicates: false
      })
      .select();

    if (error) {
      console.error(`❌ Error upserting batch ${i}-${i + batch.length}:`, error);
      continue;
    }

    const batchInserted = data?.length || 0;
    inserted += batchInserted;
    
    console.log(`   ✓ Processed ${i + batch.length}/${tickets.length} tickets`);
  }

  console.log(`✅ Upserted ${inserted} tickets`);
  return inserted;
}

/**
 * Generate and upsert embeddings
 */
async function upsertEmbeddings(tickets) {
  console.log(`\n🧠 Generating embeddings for ${tickets.length} tickets...`);

  const textsForEmbedding = tickets.map(ticket => createEmbeddingText(ticket));

  const embeddings = await generateEmbeddingsBatch(textsForEmbedding, {
    batchSize: 100,
    delayMs: 1000,
    onProgress: (progress) => {
      console.log(`   Progress: ${progress.processed}/${progress.total} (${Math.round(progress.processed / progress.total * 100)}%)`);
    }
  });

  console.log(`✅ Generated ${embeddings.length} embeddings`);

  // Prepare embeddings for upsert
  console.log(`\n💾 Upserting embeddings to database...`);
  
  // Match actual table schema: uses ticket_key instead of external_id
  const embeddingRecords = embeddings.map((embedding, index) => ({
    ticket_key: tickets[index].external_id,  // Table uses ticket_key, not external_id
    summary: tickets[index].title,
    embedding: JSON.stringify(embedding), // Store as JSON string
    metadata: { generated_at: new Date().toISOString() }
  }));

  const batchSize = 100;
  let upserted = 0;

  for (let i = 0; i < embeddingRecords.length; i += batchSize) {
    const batch = embeddingRecords.slice(i, i + batchSize);

    const { error } = await supabase
      .from('jira_ticket_embeddings')
      .upsert(batch, {
        onConflict: 'ticket_key',  // Table uses ticket_key as unique constraint
        ignoreDuplicates: false
      });

    if (error) {
      console.error(`❌ Error upserting embeddings batch ${i}-${i + batch.length}:`, error);
      continue;
    }

    upserted += batch.length;
    console.log(`   ✓ Upserted ${i + batch.length}/${embeddingRecords.length} embeddings`);
  }

  console.log(`✅ Upserted ${upserted} embeddings`);
  return upserted;
}

/**
 * Main import function
 */
async function importJiraCSV() {
  const csvPath = process.argv[2];

  if (!csvPath) {
    console.error('❌ Usage: node import-jira-csv.js <path-to-csv>');
    console.error('   Example: node import-jira-csv.js ~/Downloads/jira-export.csv');
    process.exit(1);
  }

  console.log('🚀 Starting JIRA CSV import');
  console.log(`   CSV file: ${csvPath}`);

  try {
    // Parse CSV
    const records = await parseJiraCSV(csvPath);

    // Transform to ticket objects
    console.log('\n🔄 Transforming records...');
    const tickets = records.map(transformRecord);

    // Filter out tickets without external_id
    const validTickets = tickets.filter(t => t.external_id);
    console.log(`✅ Transformed ${validTickets.length} valid tickets`);

    if (validTickets.length === 0) {
      console.error('❌ No valid tickets found in CSV!');
      console.log('   Check that CSV has "Issue key" or "Key" column');
      process.exit(1);
    }

    // Show sample ticket
    console.log('\n📋 Sample ticket:');
    console.log(JSON.stringify(validTickets[0], null, 2));

    // Upsert tickets
    const insertedCount = await upsertTickets(validTickets);

    // Generate and upsert embeddings
    const embeddingCount = await upsertEmbeddings(validTickets);

    console.log('\n✅ JIRA CSV import completed successfully!');
    console.log(`\n📊 Summary:`);
    console.log(`   Total records in CSV: ${records.length}`);
    console.log(`   Valid tickets: ${validTickets.length}`);
    console.log(`   Tickets upserted: ${insertedCount}`);
    console.log(`   Embeddings generated: ${embeddingCount}`);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the import
if (require.main === module) {
  importJiraCSV()
    .then(() => {
      console.log('\n👋 Done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Failed:', error);
      process.exit(1);
    });
}

module.exports = { importJiraCSV };
