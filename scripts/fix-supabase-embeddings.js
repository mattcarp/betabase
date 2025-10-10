#!/usr/bin/env node

/**
 * Re-process embeddings from TEXT format to proper vector(1536) format
 *
 * This script:
 * 1. Deploys the aoma_unified_vectors migration
 * 2. Reads existing wiki_documents and jira_ticket_embeddings
 * 3. Generates proper vector(1536) embeddings via OpenAI
 * 4. Inserts into aoma_unified_vectors table using upsert function
 * 5. Tracks progress with resumability
 *
 * Estimated time:
 * - 393 wiki docs × ~500ms = ~3-4 minutes
 * - 6,040 JIRA tickets × ~500ms = ~50-60 minutes
 * - Total: ~1 hour (with rate limiting)
 */

const { createClient } = require('@supabase/supabase-js');
const { openai } = require('@ai-sdk/openai');
const { embed } = require('ai');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

// Configuration
const BATCH_SIZE = 10; // Process 10 at a time
const RATE_LIMIT_DELAY = 1000; // 1s between batches (OpenAI rate limits)
const CHECKPOINT_FILE = path.join(__dirname, '.embedding-migration-checkpoint.json');

// Progress tracking
let checkpoint = {
  wiki_docs_completed: [],
  jira_tickets_completed: [],
  last_wiki_index: 0,
  last_jira_index: 0,
  started_at: null,
  errors: []
};

// Load checkpoint if exists
if (fs.existsSync(CHECKPOINT_FILE)) {
  checkpoint = JSON.parse(fs.readFileSync(CHECKPOINT_FILE, 'utf-8'));
  console.log('📂 Loaded checkpoint from previous run');
  console.log(`   Wiki docs: ${checkpoint.wiki_docs_completed.length} completed`);
  console.log(`   JIRA tickets: ${checkpoint.jira_tickets_completed.length} completed`);
}

function saveCheckpoint() {
  fs.writeFileSync(CHECKPOINT_FILE, JSON.stringify(checkpoint, null, 2));
}

async function generateEmbedding(text) {
  try {
    const model = openai.embedding('text-embedding-3-small');
    const result = await embed({
      model,
      value: text.substring(0, 8000) // OpenAI limit
    });
    return result.embedding;
  } catch (error) {
    console.error('   ❌ Embedding generation failed:', error.message);
    return null;
  }
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function migrateWikiDocuments(supabase) {
  console.log('\n📚 MIGRATING WIKI DOCUMENTS');
  console.log('=' .repeat(70));

  // Get all wiki documents
  const { data: wikiDocs, error: fetchError } = await supabase
    .from('wiki_documents')
    .select('*')
    .not('content', 'is', null)
    .order('id');

  if (fetchError) {
    console.error('❌ Failed to fetch wiki documents:', fetchError.message);
    return;
  }

  console.log(`📊 Found ${wikiDocs.length} wiki documents`);
  console.log(`⏭️  Skipping ${checkpoint.wiki_docs_completed.length} already completed\n`);

  const remaining = wikiDocs.filter(doc => !checkpoint.wiki_docs_completed.includes(doc.id));
  console.log(`🎯 Processing ${remaining.length} remaining documents\n`);

  let processed = 0;
  let succeeded = 0;
  let failed = 0;

  for (let i = 0; i < remaining.length; i += BATCH_SIZE) {
    const batch = remaining.slice(i, i + BATCH_SIZE);

    console.log(`\n📦 Batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(remaining.length / BATCH_SIZE)}`);
    console.log(`   Processing docs ${i + 1}-${Math.min(i + BATCH_SIZE, remaining.length)} of ${remaining.length}`);

    for (const doc of batch) {
      processed++;

      // Prepare content for embedding
      const content = [
        doc.title,
        doc.content,
        doc.excerpt
      ].filter(Boolean).join('\n\n').substring(0, 8000);

      if (!content.trim()) {
        console.log(`   ⏭️  [${processed}/${remaining.length}] Skipping empty doc: ${doc.id}`);
        checkpoint.wiki_docs_completed.push(doc.id);
        continue;
      }

      try {
        console.log(`   ⏳ [${processed}/${remaining.length}] ${doc.title?.substring(0, 50) || doc.id}...`);

        // Generate embedding
        const embedding = await generateEmbedding(content);

        if (!embedding) {
          failed++;
          checkpoint.errors.push({
            type: 'wiki',
            id: doc.id,
            error: 'Failed to generate embedding',
            timestamp: new Date().toISOString()
          });
          continue;
        }

        // Insert into aoma_unified_vectors using upsert function
        const { data: result, error: insertError } = await supabase.rpc('upsert_aoma_vector', {
          p_content: content,
          p_embedding: `[${embedding.join(',')}]`, // Convert array to PostgreSQL vector format
          p_source_type: 'knowledge',
          p_source_id: `wiki_${doc.id}`,
          p_metadata: {
            title: doc.title,
            url: doc.url,
            app: doc.app,
            space: doc.space,
            original_id: doc.id,
            migrated_at: new Date().toISOString()
          }
        });

        if (insertError) {
          console.error(`   ❌ Insert failed: ${insertError.message}`);
          failed++;
          checkpoint.errors.push({
            type: 'wiki',
            id: doc.id,
            error: insertError.message,
            timestamp: new Date().toISOString()
          });
        } else {
          succeeded++;
          checkpoint.wiki_docs_completed.push(doc.id);
          console.log(`   ✅ Migrated successfully`);
        }

      } catch (error) {
        console.error(`   ❌ Error: ${error.message}`);
        failed++;
        checkpoint.errors.push({
          type: 'wiki',
          id: doc.id,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }

      // Save checkpoint after each doc
      saveCheckpoint();
    }

    // Rate limiting delay between batches
    if (i + BATCH_SIZE < remaining.length) {
      console.log(`   💤 Rate limit delay (${RATE_LIMIT_DELAY}ms)...`);
      await sleep(RATE_LIMIT_DELAY);
    }
  }

  console.log(`\n✅ Wiki migration complete:`);
  console.log(`   Succeeded: ${succeeded}`);
  console.log(`   Failed: ${failed}`);
  console.log(`   Total: ${checkpoint.wiki_docs_completed.length}`);
}

async function migrateJiraTickets(supabase) {
  console.log('\n\n🎫 MIGRATING JIRA TICKETS');
  console.log('=' .repeat(70));

  // Get all JIRA ticket embeddings
  const { data: jiraTickets, error: fetchError } = await supabase
    .from('jira_ticket_embeddings')
    .select('*')
    .not('embedding', 'is', null)
    .order('ticket_key');

  if (fetchError) {
    console.error('❌ Failed to fetch JIRA tickets:', fetchError.message);
    return;
  }

  console.log(`📊 Found ${jiraTickets.length} JIRA tickets`);
  console.log(`⏭️  Skipping ${checkpoint.jira_tickets_completed.length} already completed\n`);

  const remaining = jiraTickets.filter(ticket => !checkpoint.jira_tickets_completed.includes(ticket.ticket_key));
  console.log(`🎯 Processing ${remaining.length} remaining tickets\n`);

  let processed = 0;
  let succeeded = 0;
  let failed = 0;

  for (let i = 0; i < remaining.length; i += BATCH_SIZE) {
    const batch = remaining.slice(i, i + BATCH_SIZE);

    console.log(`\n📦 Batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(remaining.length / BATCH_SIZE)}`);
    console.log(`   Processing tickets ${i + 1}-${Math.min(i + BATCH_SIZE, remaining.length)} of ${remaining.length}`);

    for (const ticket of batch) {
      processed++;

      // Prepare content for embedding
      const content = [
        `${ticket.ticket_key}: ${ticket.summary}`,
        ticket.description,
        ticket.status ? `Status: ${ticket.status}` : '',
        ticket.priority ? `Priority: ${ticket.priority}` : ''
      ].filter(Boolean).join('\n\n').substring(0, 8000);

      if (!content.trim()) {
        console.log(`   ⏭️  [${processed}/${remaining.length}] Skipping empty ticket: ${ticket.ticket_key}`);
        checkpoint.jira_tickets_completed.push(ticket.ticket_key);
        continue;
      }

      try {
        console.log(`   ⏳ [${processed}/${remaining.length}] ${ticket.ticket_key}...`);

        // Generate embedding
        const embedding = await generateEmbedding(content);

        if (!embedding) {
          failed++;
          checkpoint.errors.push({
            type: 'jira',
            id: ticket.ticket_key,
            error: 'Failed to generate embedding',
            timestamp: new Date().toISOString()
          });
          continue;
        }

        // Insert into aoma_unified_vectors
        const { data: result, error: insertError } = await supabase.rpc('upsert_aoma_vector', {
          p_content: content,
          p_embedding: `[${embedding.join(',')}]`,
          p_source_type: 'jira',
          p_source_id: ticket.ticket_key,
          p_metadata: {
            ticket_key: ticket.ticket_key,
            summary: ticket.summary,
            status: ticket.status,
            priority: ticket.priority,
            project_key: ticket.project_key,
            migrated_at: new Date().toISOString()
          }
        });

        if (insertError) {
          console.error(`   ❌ Insert failed: ${insertError.message}`);
          failed++;
          checkpoint.errors.push({
            type: 'jira',
            id: ticket.ticket_key,
            error: insertError.message,
            timestamp: new Date().toISOString()
          });
        } else {
          succeeded++;
          checkpoint.jira_tickets_completed.push(ticket.ticket_key);
          console.log(`   ✅ Migrated successfully`);
        }

      } catch (error) {
        console.error(`   ❌ Error: ${error.message}`);
        failed++;
        checkpoint.errors.push({
          type: 'jira',
          id: ticket.ticket_key,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }

      // Save checkpoint after each ticket
      saveCheckpoint();
    }

    // Rate limiting delay between batches
    if (i + BATCH_SIZE < remaining.length) {
      console.log(`   💤 Rate limit delay (${RATE_LIMIT_DELAY}ms)...`);
      await sleep(RATE_LIMIT_DELAY);
    }
  }

  console.log(`\n✅ JIRA migration complete:`);
  console.log(`   Succeeded: ${succeeded}`);
  console.log(`   Failed: ${failed}`);
  console.log(`   Total: ${checkpoint.jira_tickets_completed.length}`);
}

async function verifyMigration(supabase) {
  console.log('\n\n🔍 VERIFICATION');
  console.log('=' .repeat(70));

  // Check table exists
  const { count: totalCount, error: countError } = await supabase
    .from('aoma_unified_vectors')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.error('❌ Failed to verify:', countError.message);
    return;
  }

  console.log(`\n✅ Total vectors in aoma_unified_vectors: ${totalCount}`);

  // Count by source type
  const { data: stats, error: statsError } = await supabase
    .from('aoma_unified_vectors')
    .select('source_type');

  if (!statsError && stats) {
    const counts = stats.reduce((acc, row) => {
      acc[row.source_type] = (acc[row.source_type] || 0) + 1;
      return acc;
    }, {});

    console.log('\n📊 By source type:');
    Object.entries(counts).forEach(([type, count]) => {
      console.log(`   ${type}: ${count}`);
    });
  }

  // Test vector search
  console.log('\n🧪 Testing vector search...');
  const testQuery = "How do I upload files in AOMA?";

  try {
    const embedding = await generateEmbedding(testQuery);

    if (embedding) {
      const { data: results, error: searchError } = await supabase.rpc('match_aoma_vectors_fast', {
        query_embedding: `[${embedding.join(',')}]`,
        match_count: 5
      });

      if (searchError) {
        console.error('❌ Search failed:', searchError.message);
      } else {
        console.log(`✅ Search successful: ${results?.length || 0} results`);

        if (results && results.length > 0) {
          console.log('\n📄 Top result:');
          console.log(`   Content: ${results[0].content?.substring(0, 100)}...`);
          console.log(`   Similarity: ${(results[0].similarity * 100).toFixed(1)}%`);
          console.log(`   Source: ${results[0].source_type}`);
        }
      }
    }
  } catch (error) {
    console.error('❌ Test search failed:', error.message);
  }
}

async function main() {
  console.log("🚀 SUPABASE EMBEDDING MIGRATION");
  console.log("=" .repeat(70));
  console.log("\nThis script will:");
  console.log("  1. Read wiki_documents and jira_ticket_embeddings");
  console.log("  2. Generate proper vector(1536) embeddings via OpenAI");
  console.log("  3. Insert into aoma_unified_vectors table");
  console.log("  4. Track progress with resumability");
  console.log("\nEstimated time: ~1 hour for all documents");
  console.log("=" .repeat(70));

  // Check API keys
  if (!process.env.OPENAI_API_KEY) {
    console.error('\n❌ OPENAI_API_KEY not set in .env.local');
    process.exit(1);
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('\n❌ Supabase credentials not set in .env.local');
    process.exit(1);
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  checkpoint.started_at = checkpoint.started_at || new Date().toISOString();

  try {
    // Migrate wiki documents
    await migrateWikiDocuments(supabase);

    // Migrate JIRA tickets
    await migrateJiraTickets(supabase);

    // Verify migration
    await verifyMigration(supabase);

    // Final summary
    console.log('\n\n🎉 MIGRATION COMPLETE!');
    console.log('=' .repeat(70));
    console.log(`\n📊 Summary:`);
    console.log(`   Wiki docs migrated: ${checkpoint.wiki_docs_completed.length}`);
    console.log(`   JIRA tickets migrated: ${checkpoint.jira_tickets_completed.length}`);
    console.log(`   Total documents: ${checkpoint.wiki_docs_completed.length + checkpoint.jira_tickets_completed.length}`);
    console.log(`   Errors: ${checkpoint.errors.length}`);
    console.log(`   Duration: ${new Date().toISOString()}`);

    if (checkpoint.errors.length > 0) {
      console.log(`\n⚠️  ${checkpoint.errors.length} errors occurred. Check .embedding-migration-checkpoint.json for details.`);
    }

    // Clean up checkpoint file on success
    if (checkpoint.errors.length === 0) {
      console.log('\n🧹 Cleaning up checkpoint file...');
      fs.unlinkSync(CHECKPOINT_FILE);
    }

    console.log('\n✅ You can now test the hybrid integration!');
    console.log('   Run: node scripts/test-hybrid-integration.js');

  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    saveCheckpoint();
    console.log('\n💾 Progress saved. You can resume by running this script again.');
    process.exit(1);
  }
}

main().catch(err => {
  console.error("❌ Fatal error:", err);
  process.exit(1);
});
