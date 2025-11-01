#!/usr/bin/env node

/**
 * JIRA Excel Import Script
 *
 * Imports JIRA tickets from Excel export, generates embeddings, and upserts to database.
 *
 * Usage:
 *   node scripts/data-collection/import-jira-excel.js <path-to-xls-or-xlsx>
 *   node scripts/data-collection/import-jira-excel.js tmp/jira-exports/all-projects-tickets.xls
 */

require("dotenv").config({ path: ".env.local" });
const fs = require("fs").promises;
const path = require("path");
const XLSX = require("xlsx");

// Import utilities
const { generateEmbeddingsBatch } = require("../../utils/embeddings/openai");
const { createClient } = require("@supabase/supabase-js");
const { deduplicateAll } = require("../../utils/supabase/deduplicate-jira");

// Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Parse JIRA Excel file
 */
async function parseJiraExcel(filePath) {
  console.log(`📂 Reading Excel file: ${filePath}`);

  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0]; // Use first sheet
  const worksheet = workbook.Sheets[sheetName];

  // Convert to array of objects
  const records = XLSX.utils.sheet_to_json(worksheet);

  console.log(`✅ Parsed ${records.length} records from Excel`);
  return records;
}

/**
 * Parse JIRA date string to ISO timestamp
 */
function parseJiraDate(dateStr) {
  if (!dateStr || dateStr === 'N/A' || dateStr.trim() === '') {
    return null;
  }
  try {
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date.toISOString();
  } catch (error) {
    return null;
  }
}

/**
 * Transform Excel record to ticket object
 */
function transformRecord(record) {
  // JIRA Excel exports typically have these columns (adjust based on your export):
  // Issue key, Summary, Description, Status, Priority, Assignee, Reporter, Created, Updated, etc.

  return {
    external_id: record["Issue key"] || record["Key"] || record["Issue Key"],
    title: record["Summary"] || "",
    description: record["Description"] || "",
    status: record["Status"] || "",
    priority: record["Priority"] || "",
    created_at: parseJiraDate(record["Created"]),
    updated_at: parseJiraDate(record["Updated"]),
    metadata: {
      assignee: record["Assignee"] || "",
      reporter: record["Reporter"] || "",
      type: record["Issue Type"] || record["Type"] || "",
      project: record["Project"] || "",
      created: record["Created"] || "",
      updated: record["Updated"] || "",
      resolution: record["Resolution"] || "",
      labels: record["Labels"] || "",
      components: record["Components"] || "",
      affects_versions: record["Affects Version/s"] || "",
      fix_versions: record["Fix Version/s"] || "",
    },
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
    `Priority: ${ticket.priority}`,
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

  return parts.join("\n");
}

/**
 * Insert tickets to database (checking for existing first)
 */
async function upsertTickets(tickets) {
  console.log(`\n💾 Inserting ${tickets.length} tickets to database...`);

  const batchSize = 100;
  let inserted = 0;
  let skipped = 0;

  for (let i = 0; i < tickets.length; i += batchSize) {
    const batch = tickets.slice(i, i + batchSize);

    // Check which tickets already exist
    const externalIds = batch.map((t) => t.external_id);
    const { data: existing } = await supabase
      .from("jira_tickets")
      .select("external_id")
      .in("external_id", externalIds);

    const existingIds = new Set((existing || []).map((t) => t.external_id));
    const newTickets = batch.filter((t) => !existingIds.has(t.external_id));

    if (newTickets.length > 0) {
      const { data, error } = await supabase.from("jira_tickets").insert(newTickets).select();

      if (error) {
        console.error(`❌ Error inserting batch ${i}-${i + batch.length}:`, error);
        continue;
      }

      inserted += newTickets.length;
    }

    skipped += batch.length - newTickets.length;
    console.log(
      `   ✓ Processed ${i + batch.length}/${tickets.length} tickets (${newTickets.length} new, ${batch.length - newTickets.length} skipped)`
    );
  }

  console.log(`✅ Inserted ${inserted} new tickets (skipped ${skipped} existing)`);
  return inserted;
}

/**
 * Generate and upsert embeddings
 */
async function upsertEmbeddings(tickets) {
  console.log(`\n🧠 Generating embeddings for ${tickets.length} tickets...`);

  const textsForEmbedding = tickets.map((ticket) => createEmbeddingText(ticket));

  const embeddings = await generateEmbeddingsBatch(textsForEmbedding, {
    batchSize: 100,
    delayMs: 1000,
    onProgress: (progress) => {
      console.log(
        `   Progress: ${progress.processed}/${progress.total} (${Math.round((progress.processed / progress.total) * 100)}%)`
      );
    },
  });

  console.log(`✅ Generated ${embeddings.length} embeddings`);

  // Prepare embeddings for upsert
  console.log(`\n💾 Upserting embeddings to database...`);

  const embeddingRecords = embeddings.map((embedding, index) => ({
    ticket_key: tickets[index].external_id, // Use ticket_key, not external_id
    summary: tickets[index].title,
    embedding: embedding, // Store as array, not JSON string
  }));

  const batchSize = 100;
  let inserted = 0;
  let skipped = 0;

  for (let i = 0; i < embeddingRecords.length; i += batchSize) {
    const batch = embeddingRecords.slice(i, i + batchSize);

    // Check which embeddings already exist
    const ticketKeys = batch.map((e) => e.ticket_key);
    const { data: existing } = await supabase
      .from("jira_ticket_embeddings")
      .select("ticket_key")
      .in("ticket_key", ticketKeys);

    const existingKeys = new Set((existing || []).map((e) => e.ticket_key));
    const newEmbeddings = batch.filter((e) => !existingKeys.has(e.ticket_key));

    if (newEmbeddings.length > 0) {
      const { error } = await supabase.from("jira_ticket_embeddings").insert(newEmbeddings);

      if (error) {
        console.error(`❌ Error inserting embeddings batch ${i}-${i + batch.length}:`, error);
        continue;
      }

      inserted += newEmbeddings.length;
    }

    skipped += batch.length - newEmbeddings.length;
    console.log(
      `   ✓ Processed ${i + batch.length}/${embeddingRecords.length} embeddings (${newEmbeddings.length} new, ${batch.length - newEmbeddings.length} skipped)`
    );
  }

  console.log(`✅ Inserted ${inserted} new embeddings (skipped ${skipped} existing)`);
  return inserted;
}

/**
 * Main import function
 */
async function importJiraExcel() {
  const excelPath = process.argv[2];

  if (!excelPath) {
    console.error("❌ Usage: node import-jira-excel.js <path-to-xls-or-xlsx>");
    console.error(
      "   Example: node import-jira-excel.js tmp/jira-exports/all-projects-tickets.xls"
    );
    process.exit(1);
  }

  console.log("🚀 Starting JIRA Excel import");
  console.log(`   Excel file: ${excelPath}`);

  try {
    // Parse Excel
    const records = await parseJiraExcel(excelPath);

    // Transform to ticket objects
    console.log("\n🔄 Transforming records...");
    const tickets = records.map(transformRecord);

    // Filter out tickets without external_id
    const validTickets = tickets.filter((t) => t.external_id);
    console.log(`✅ Transformed ${validTickets.length} valid tickets`);

    if (validTickets.length === 0) {
      console.error("❌ No valid tickets found in Excel!");
      console.log('   Check that Excel has "Issue key" or "Key" column');
      process.exit(1);
    }

    // Show sample ticket
    console.log("\n📋 Sample ticket:");
    console.log(JSON.stringify(validTickets[0], null, 2));

    // Upsert tickets
    const insertedCount = await upsertTickets(validTickets);

    // Generate and upsert embeddings
    const embeddingCount = await upsertEmbeddings(validTickets);

    // Auto-deduplication
    const skipDedupe = process.argv.includes('--skip-dedupe');
    if (!skipDedupe) {
      console.log('\n🔍 Running automatic deduplication...');
      try {
        const dedupeResult = await deduplicateAll({ dryRun: false, logger: console.log });
        console.log('\n   Deduplication complete:');
        console.log(`     - Tickets table: ${dedupeResult.tickets.recordsDeleted} duplicates removed`);
        console.log(`     - Embeddings table: ${dedupeResult.embeddings.recordsDeleted} duplicates removed`);
      } catch (error) {
        console.log(`\n⚠️  Deduplication failed: ${error.message}`);
        console.log('   You can run deduplication manually: node scripts/deduplicate-jira-all.js');
      }
    } else {
      console.log('\n⏭️  Deduplication skipped (--skip-dedupe flag)');
      console.log('   Run manually if needed: node scripts/deduplicate-jira-all.js');
    }

    console.log("\n✅ JIRA Excel import completed successfully!");
    console.log(`\n📊 Summary:`);
    console.log(`   Total records in Excel: ${records.length}`);
    console.log(`   Valid tickets: ${validTickets.length}`);
    console.log(`   Tickets upserted: ${insertedCount}`);
    console.log(`   Embeddings generated: ${embeddingCount}`);
  } catch (error) {
    console.error("\n❌ Error:", error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the import
if (require.main === module) {
  importJiraExcel()
    .then(() => {
      console.log("\n👋 Done!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n💥 Failed:", error);
      process.exit(1);
    });
}

module.exports = { importJiraExcel };
