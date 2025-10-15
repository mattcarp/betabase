#!/usr/bin/env node

/**
 * Deduplicate JIRA Ticket Embeddings
 *
 * Finds duplicate ticket_keys and keeps only the most recently updated version.
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function findAndRemoveDuplicates() {
  console.log('🔍 Scanning for duplicate ticket_keys in jira_ticket_embeddings...\n');

  // Fetch ALL records with pagination
  let allRecords = [];
  let offset = 0;
  const pageSize = 1000;
  let hasMore = true;

  console.log('📥 Fetching records from database...');
  while (hasMore) {
    const { data, error } = await supabase
      .from('jira_ticket_embeddings')
      .select('ticket_key, id, updated_at')
      .order('ticket_key')
      .range(offset, offset + pageSize - 1);

    if (error) {
      console.error('❌ Error fetching records:', error);
      return;
    }

    if (data.length === 0) break;

    allRecords = allRecords.concat(data);
    console.log(`   Fetched ${allRecords.length} records...`);

    offset += pageSize;
    hasMore = data.length === pageSize;
  }

  console.log(`\n📊 Total records found: ${allRecords.length}\n`);

  // Group by ticket_key
  const keyMap = {};
  allRecords.forEach(record => {
    if (!keyMap[record.ticket_key]) {
      keyMap[record.ticket_key] = [];
    }
    keyMap[record.ticket_key].push(record);
  });

  // Find duplicates
  const duplicates = Object.entries(keyMap).filter(([key, records]) => records.length > 1);

  if (duplicates.length === 0) {
    console.log('✅ No duplicates found! Database is clean.');
    return;
  }

  console.log(`⚠️  Found ${duplicates.length} ticket_keys with duplicates\n`);

  // Group by project for reporting
  const projectStats = {};

  let totalDeleted = 0;
  const deletionBatch = [];

  for (const [ticketKey, records] of duplicates) {
    // Extract project from ticket key (e.g., "ITSM-1234" -> "ITSM")
    const project = ticketKey.split('-')[0];
    if (!projectStats[project]) {
      projectStats[project] = { duplicates: 0, deleted: 0 };
    }
    projectStats[project].duplicates++;

    // Sort by updated_at descending (most recent first)
    records.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));

    const keepRecord = records[0];
    const deleteRecords = records.slice(1);

    console.log(`📋 ${ticketKey}: ${records.length} copies found`);
    console.log(`   ✅ Keeping: ID ${keepRecord.id} (updated: ${keepRecord.updated_at})`);
    console.log(`   ❌ Deleting ${deleteRecords.length} older copies...`);

    // Add to deletion batch
    deleteRecords.forEach(record => {
      deletionBatch.push(record.id);
      projectStats[project].deleted++;
      console.log(`      🗑️  Will delete ID ${record.id} (updated: ${record.updated_at})`);
    });

    totalDeleted += deleteRecords.length;
  }

  // Confirm deletion
  console.log(`\n⚠️  About to delete ${totalDeleted} duplicate records...`);
  console.log('   Press Ctrl+C to cancel, or continuing in 3 seconds...\n');

  await new Promise(resolve => setTimeout(resolve, 3000));

  // Delete in batches of 100
  console.log('🗑️  Deleting duplicates...\n');
  for (let i = 0; i < deletionBatch.length; i += 100) {
    const batch = deletionBatch.slice(i, i + 100);
    const { error: deleteError } = await supabase
      .from('jira_ticket_embeddings')
      .delete()
      .in('id', batch);

    if (deleteError) {
      console.error(`❌ Error deleting batch ${i}-${i + batch.length}:`, deleteError);
    } else {
      console.log(`   ✓ Deleted batch ${i + 1}-${Math.min(i + batch.length, deletionBatch.length)}/${deletionBatch.length}`);
    }
  }

  // Final count
  const { count: finalCount } = await supabase
    .from('jira_ticket_embeddings')
    .select('*', { count: 'exact', head: true });

  console.log('\n✅ Deduplication complete!\n');
  console.log('📊 Summary by Project:');
  for (const [project, stats] of Object.entries(projectStats)) {
    console.log(`   ${project}: ${stats.duplicates} tickets had duplicates, ${stats.deleted} records deleted`);
  }
  console.log(`\n   Total unique tickets with duplicates: ${duplicates.length}`);
  console.log(`   Total duplicate records deleted: ${totalDeleted}`);
  console.log(`   Final embedding count: ${finalCount}`);
  console.log(`   Unique tickets remaining: ${finalCount}`);
}

findAndRemoveDuplicates()
  .then(() => {
    console.log('\n👋 Done!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 Error:', error);
    process.exit(1);
  });
