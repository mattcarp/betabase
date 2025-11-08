#!/usr/bin/env node

/**
 * Migrate Jira embeddings to unified vector store (OPTIMIZED - NO REGENERATION)
 *
 * This script copies existing embeddings from jira_ticket_embeddings to siam_vectors
 * WITHOUT regenerating them (they're already in the correct 1536-dimension format).
 *
 * Estimated time: 5-10 minutes for 15,000 tickets
 * Cost: $0 (reuses existing embeddings)
 */

const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: ".env.local" });

// Configuration
const BATCH_SIZE = 100; // Process 100 at a time
const CHECKPOINT_FILE = path.join(__dirname, ".jira-migration-checkpoint.json");

// Progress tracking
let checkpoint = {
  completed: [],
  last_index: 0,
  started_at: null,
  errors: [],
};

// Load checkpoint if exists
if (fs.existsSync(CHECKPOINT_FILE)) {
  checkpoint = JSON.parse(fs.readFileSync(CHECKPOINT_FILE, "utf-8"));
  console.log("📂 Loaded checkpoint from previous run");
  console.log(`   Completed: ${checkpoint.completed.length} tickets`);
}

function saveCheckpoint() {
  fs.writeFileSync(CHECKPOINT_FILE, JSON.stringify(checkpoint, null, 2));
}

async function migrateJiraToUnified() {
  console.log("🎫 JIRA → UNIFIED VECTOR MIGRATION");
  console.log("=".repeat(70));
  console.log("This will copy existing embeddings (NO regeneration required)\n");

  // Initialize Supabase
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Get all Jira tickets with embeddings (fetch in batches to avoid pagination limit)
  console.log("📊 Fetching ALL Jira tickets...");
  let jiraTickets = [];
  let page = 0;
  const PAGE_SIZE = 1000;

  while (true) {
    const { data, error: fetchError } = await supabase
      .from("jira_ticket_embeddings")
      .select("*")
      .not("embedding", "is", null)
      .order("ticket_key")
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (fetchError) {
      console.error("❌ Failed to fetch Jira tickets:", fetchError.message);
      return;
    }

    if (!data || data.length === 0) break;

    jiraTickets = jiraTickets.concat(data);
    console.log(`   Fetched ${jiraTickets.length} tickets so far...`);

    if (data.length < PAGE_SIZE) break; // Last page
    page++;
  }


  console.log(`✅ Found ${jiraTickets.length} Jira tickets with embeddings`);
  console.log(`⏭️  Skipping ${checkpoint.completed.length} already migrated\n`);

  const remaining = jiraTickets.filter(
    (ticket) => !checkpoint.completed.includes(ticket.ticket_key)
  );
  console.log(`🎯 Migrating ${remaining.length} remaining tickets\n`);

  if (remaining.length === 0) {
    console.log("✅ All tickets already migrated!");
    return;
  }

  let succeeded = 0;
  let failed = 0;
  let skipped = 0;
  const startTime = Date.now();

  // Process in batches
  for (let i = 0; i < remaining.length; i += BATCH_SIZE) {
    const batch = remaining.slice(i, i + BATCH_SIZE);

    console.log(
      `\n📦 Batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(remaining.length / BATCH_SIZE)}`
    );
    console.log(
      `   Processing tickets ${i + 1}-${Math.min(i + BATCH_SIZE, remaining.length)} of ${remaining.length}`
    );

    // Process batch in parallel for speed
    const results = await Promise.allSettled(
      batch.map(async (ticket) => {
        try {
          // Parse embedding (it's stored as TEXT but is actually a JSON array)
          let embedding;
          try {
            embedding = typeof ticket.embedding === "string"
              ? JSON.parse(ticket.embedding)
              : ticket.embedding;
          } catch (parseError) {
            console.error(`   ⚠️  ${ticket.ticket_key}: Invalid embedding format`);
            return { status: "skipped", ticket_key: ticket.ticket_key };
          }

          // Validate dimensions
          if (!Array.isArray(embedding) || embedding.length !== 1536) {
            console.error(
              `   ⚠️  ${ticket.ticket_key}: Wrong dimensions (${embedding?.length || 0})`
            );
            return { status: "skipped", ticket_key: ticket.ticket_key };
          }

          // Prepare content
          const content = [
            `${ticket.ticket_key}: ${ticket.summary || ""}`,
            ticket.description || "",
            ticket.status ? `Status: ${ticket.status}` : "",
            ticket.priority ? `Priority: ${ticket.priority}` : "",
          ]
            .filter(Boolean)
            .join("\n\n")
            .substring(0, 8000);

          if (!content.trim()) {
            return { status: "skipped", ticket_key: ticket.ticket_key };
          }

          // Insert into unified vectors (pass array directly, PostgreSQL will cast to vector)
          const { error: insertError } = await supabase.rpc("upsert_aoma_vector", {
            p_content: content,
            p_embedding: embedding,  // Pass array directly, not as string
            p_source_type: "jira",
            p_source_id: ticket.ticket_key,
            p_metadata: {
              ticket_key: ticket.ticket_key,
              summary: ticket.summary,
              status: ticket.status,
              priority: ticket.priority,
              project_key: ticket.project_key,
              migrated_at: new Date().toISOString(),
            },
          });

          if (insertError) {
            throw insertError;
          }

          return { status: "success", ticket_key: ticket.ticket_key };
        } catch (error) {
          return {
            status: "error",
            ticket_key: ticket.ticket_key,
            error: error.message
          };
        }
      })
    );

    // Process results
    results.forEach((result) => {
      if (result.status === "fulfilled") {
        const { status, ticket_key, error } = result.value;

        if (status === "success") {
          succeeded++;
          checkpoint.completed.push(ticket_key);
        } else if (status === "skipped") {
          skipped++;
          checkpoint.completed.push(ticket_key);
        } else {
          failed++;
          checkpoint.errors.push({
            ticket_key,
            error,
            timestamp: new Date().toISOString(),
          });
        }
      } else {
        failed++;
      }
    });

    // Save checkpoint after each batch
    saveCheckpoint();

    // Progress update
    const elapsed = Math.round((Date.now() - startTime) / 1000);
    const ticketsPerSec = (succeeded + skipped + failed) / elapsed;
    const remainingTickets = remaining.length - (succeeded + skipped + failed);
    const eta = Math.round(remainingTickets / ticketsPerSec);

    console.log(
      `   ✅ Succeeded: ${succeeded} | ⏭️  Skipped: ${skipped} | ❌ Failed: ${failed}`
    );
    console.log(
      `   ⏱️  Speed: ${ticketsPerSec.toFixed(1)} tickets/sec | ETA: ${eta}s`
    );
  }

  // Final summary
  const totalTime = Math.round((Date.now() - startTime) / 1000);
  console.log("\n" + "=".repeat(70));
  console.log("✅ MIGRATION COMPLETE!");
  console.log(`   Succeeded: ${succeeded}`);
  console.log(`   Skipped: ${skipped}`);
  console.log(`   Failed: ${failed}`);
  console.log(`   Total time: ${totalTime}s (${Math.round(totalTime / 60)}m)`);
  console.log("=".repeat(70));

  // Verify in database
  console.log("\n🔍 Verifying migration...");
  const { count } = await supabase
    .from("siam_vectors")
    .select("*", { count: "exact", head: true })
    .eq("source_type", "jira");

  console.log(`✅ Found ${count} Jira vectors in unified table`);

  if (failed > 0) {
    console.log(`\n⚠️  ${failed} tickets failed. Check .jira-migration-checkpoint.json for details.`);
  }

  // Clean up checkpoint on success
  if (failed === 0 && skipped + succeeded === remaining.length) {
    fs.unlinkSync(CHECKPOINT_FILE);
    console.log("\n🧹 Cleaned up checkpoint file");
  }
}

// Run migration
migrateJiraToUnified().catch((error) => {
  console.error("❌ Migration failed:", error);
  process.exit(1);
});
