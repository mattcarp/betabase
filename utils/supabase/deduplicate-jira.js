/**
 * Unified JIRA Deduplication Module
 * 
 * Handles deduplication for both jira_tickets and jira_ticket_embeddings tables.
 * Strategy: Group by identifier → Sort by updated_at DESC → Keep most recent → Delete older ones
 * 
 * @module utils/supabase/deduplicate-jira
 */

const { getSupabaseClient } = require('./client');

/**
 * Deduplicate JIRA tickets table (uses external_id)
 * 
 * @param {Object} options - Deduplication options
 * @param {boolean} options.dryRun - If true, only report what would be done
 * @param {Function} options.logger - Optional logging function
 * @returns {Promise<Object>} - Statistics about deduplication
 */
async function deduplicateJiraTickets(options = {}) {
  const { dryRun = false, logger = console.log } = options;
  const supabase = getSupabaseClient();

  logger('🔍 Scanning jira_tickets for duplicates...\n');

  // Fetch all records with pagination
  let allRecords = [];
  let offset = 0;
  const pageSize = 1000;
  let hasMore = true;

  logger('📥 Fetching records from jira_tickets...');
  while (hasMore) {
    const { data, error } = await supabase
      .from('jira_tickets')
      .select('external_id, id, updated_at')
      .order('external_id')
      .range(offset, offset + pageSize - 1);

    if (error) {
      throw new Error(`Failed to fetch jira_tickets: ${error.message}`);
    }

    if (data.length === 0) break;

    allRecords = allRecords.concat(data);
    logger(`   Fetched ${allRecords.length} records...`);

    offset += pageSize;
    hasMore = data.length === pageSize;
  }

  logger(`\n📊 Total records in jira_tickets: ${allRecords.length}\n`);

  // Group by external_id
  const keyMap = {};
  allRecords.forEach((record) => {
    if (!keyMap[record.external_id]) {
      keyMap[record.external_id] = [];
    }
    keyMap[record.external_id].push(record);
  });

  // Find duplicates
  const duplicates = Object.entries(keyMap).filter(([key, records]) => records.length > 1);

  if (duplicates.length === 0) {
    logger('✅ No duplicates found in jira_tickets! Table is clean.');
    return {
      table: 'jira_tickets',
      totalRecords: allRecords.length,
      duplicatesFound: 0,
      recordsDeleted: 0,
      finalCount: allRecords.length,
    };
  }

  logger(`⚠️  Found ${duplicates.length} external_ids with duplicates\n`);

  // Group by project for reporting
  const projectStats = {};
  let totalDeleted = 0;
  const deletionBatch = [];

  for (const [externalId, records] of duplicates) {
    // Extract project from external_id (e.g., "ITSM-1234" -> "ITSM")
    const project = externalId.split('-')[0];
    if (!projectStats[project]) {
      projectStats[project] = { duplicates: 0, deleted: 0 };
    }
    projectStats[project].duplicates++;

    // Sort by updated_at descending (most recent first)
    records.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));

    const keepRecord = records[0];
    const deleteRecords = records.slice(1);

    logger(`📋 ${externalId}: ${records.length} copies found`);
    logger(`   ✅ Keeping: ID ${keepRecord.id} (updated: ${keepRecord.updated_at})`);
    logger(`   ❌ ${dryRun ? 'Would delete' : 'Deleting'} ${deleteRecords.length} older copies...`);

    // Add to deletion batch
    deleteRecords.forEach((record) => {
      deletionBatch.push(record.id);
      projectStats[project].deleted++;
      logger(`      🗑️  ${dryRun ? 'Would delete' : 'Will delete'} ID ${record.id} (updated: ${record.updated_at})`);
    });

    totalDeleted += deleteRecords.length;
  }

  if (dryRun) {
    logger(`\n✅ DRY RUN COMPLETE for jira_tickets`);
    logger(`   Would delete ${totalDeleted} duplicate records`);
  } else {
    logger(`\n🗑️  Deleting ${totalDeleted} duplicates from jira_tickets...\n`);
    
    // Delete in batches of 100
    for (let i = 0; i < deletionBatch.length; i += 100) {
      const batch = deletionBatch.slice(i, i + 100);
      const { error: deleteError } = await supabase
        .from('jira_tickets')
        .delete()
        .in('id', batch);

      if (deleteError) {
        throw new Error(`Failed to delete batch ${i}-${i + batch.length}: ${deleteError.message}`);
      }

      logger(`   ✓ Deleted batch ${i + 1}-${Math.min(i + batch.length, deletionBatch.length)}/${deletionBatch.length}`);
    }
  }

  // Final count
  const { count: finalCount } = await supabase
    .from('jira_tickets')
    .select('*', { count: 'exact', head: true });

  logger('\n📊 Summary by Project (jira_tickets):');
  for (const [project, stats] of Object.entries(projectStats)) {
    logger(`   ${project}: ${stats.duplicates} tickets had duplicates, ${stats.deleted} records ${dryRun ? 'would be' : ''} deleted`);
  }

  return {
    table: 'jira_tickets',
    totalRecords: allRecords.length,
    duplicatesFound: duplicates.length,
    recordsDeleted: dryRun ? 0 : totalDeleted,
    wouldDelete: dryRun ? totalDeleted : 0,
    finalCount: dryRun ? allRecords.length : finalCount,
    projectStats,
  };
}

/**
 * Deduplicate JIRA ticket embeddings table (uses ticket_key)
 * 
 * @param {Object} options - Deduplication options
 * @param {boolean} options.dryRun - If true, only report what would be done
 * @param {Function} options.logger - Optional logging function
 * @returns {Promise<Object>} - Statistics about deduplication
 */
async function deduplicateJiraEmbeddings(options = {}) {
  const { dryRun = false, logger = console.log } = options;
  const supabase = getSupabaseClient();

  logger('🔍 Scanning jira_ticket_embeddings for duplicates...\n');

  // Fetch all records with pagination
  let allRecords = [];
  let offset = 0;
  const pageSize = 1000;
  let hasMore = true;

  logger('📥 Fetching records from jira_ticket_embeddings...');
  while (hasMore) {
    const { data, error } = await supabase
      .from('jira_ticket_embeddings')
      .select('ticket_key, id, updated_at')
      .order('ticket_key')
      .range(offset, offset + pageSize - 1);

    if (error) {
      throw new Error(`Failed to fetch jira_ticket_embeddings: ${error.message}`);
    }

    if (data.length === 0) break;

    allRecords = allRecords.concat(data);
    logger(`   Fetched ${allRecords.length} records...`);

    offset += pageSize;
    hasMore = data.length === pageSize;
  }

  logger(`\n📊 Total records in jira_ticket_embeddings: ${allRecords.length}\n`);

  // Group by ticket_key
  const keyMap = {};
  allRecords.forEach((record) => {
    if (!keyMap[record.ticket_key]) {
      keyMap[record.ticket_key] = [];
    }
    keyMap[record.ticket_key].push(record);
  });

  // Find duplicates
  const duplicates = Object.entries(keyMap).filter(([key, records]) => records.length > 1);

  if (duplicates.length === 0) {
    logger('✅ No duplicates found in jira_ticket_embeddings! Table is clean.');
    return {
      table: 'jira_ticket_embeddings',
      totalRecords: allRecords.length,
      duplicatesFound: 0,
      recordsDeleted: 0,
      finalCount: allRecords.length,
    };
  }

  logger(`⚠️  Found ${duplicates.length} ticket_keys with duplicates\n`);

  // Group by project for reporting
  const projectStats = {};
  let totalDeleted = 0;
  const deletionBatch = [];

  for (const [ticketKey, records] of duplicates) {
    // Extract project from ticket_key (e.g., "ITSM-1234" -> "ITSM")
    const project = ticketKey.split('-')[0];
    if (!projectStats[project]) {
      projectStats[project] = { duplicates: 0, deleted: 0 };
    }
    projectStats[project].duplicates++;

    // Sort by updated_at descending (most recent first)
    records.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));

    const keepRecord = records[0];
    const deleteRecords = records.slice(1);

    logger(`📋 ${ticketKey}: ${records.length} copies found`);
    logger(`   ✅ Keeping: ID ${keepRecord.id} (updated: ${keepRecord.updated_at})`);
    logger(`   ❌ ${dryRun ? 'Would delete' : 'Deleting'} ${deleteRecords.length} older copies...`);

    // Add to deletion batch
    deleteRecords.forEach((record) => {
      deletionBatch.push(record.id);
      projectStats[project].deleted++;
      logger(`      🗑️  ${dryRun ? 'Would delete' : 'Will delete'} ID ${record.id} (updated: ${record.updated_at})`);
    });

    totalDeleted += deleteRecords.length;
  }

  if (dryRun) {
    logger(`\n✅ DRY RUN COMPLETE for jira_ticket_embeddings`);
    logger(`   Would delete ${totalDeleted} duplicate records`);
  } else {
    logger(`\n🗑️  Deleting ${totalDeleted} duplicates from jira_ticket_embeddings...\n`);
    
    // Delete in batches of 100
    for (let i = 0; i < deletionBatch.length; i += 100) {
      const batch = deletionBatch.slice(i, i + 100);
      const { error: deleteError } = await supabase
        .from('jira_ticket_embeddings')
        .delete()
        .in('id', batch);

      if (deleteError) {
        throw new Error(`Failed to delete batch ${i}-${i + batch.length}: ${deleteError.message}`);
      }

      logger(`   ✓ Deleted batch ${i + 1}-${Math.min(i + batch.length, deletionBatch.length)}/${deletionBatch.length}`);
    }
  }

  // Final count
  const { count: finalCount } = await supabase
    .from('jira_ticket_embeddings')
    .select('*', { count: 'exact', head: true });

  logger('\n📊 Summary by Project (jira_ticket_embeddings):');
  for (const [project, stats] of Object.entries(projectStats)) {
    logger(`   ${project}: ${stats.duplicates} tickets had duplicates, ${stats.deleted} records ${dryRun ? 'would be' : ''} deleted`);
  }

  return {
    table: 'jira_ticket_embeddings',
    totalRecords: allRecords.length,
    duplicatesFound: duplicates.length,
    recordsDeleted: dryRun ? 0 : totalDeleted,
    wouldDelete: dryRun ? totalDeleted : 0,
    finalCount: dryRun ? allRecords.length : finalCount,
    projectStats,
  };
}

/**
 * Deduplicate both JIRA tables
 * 
 * @param {Object} options - Deduplication options
 * @param {boolean} options.dryRun - If true, only report what would be done
 * @param {Function} options.logger - Optional logging function
 * @returns {Promise<Object>} - Combined statistics
 */
async function deduplicateAll(options = {}) {
  const { logger = console.log } = options;

  logger('\n🚀 Starting comprehensive JIRA deduplication...\n');
  logger('=' .repeat(60));
  logger('\n');

  const startTime = Date.now();

  // Deduplicate jira_tickets
  logger('📋 STEP 1: Deduplicating jira_tickets table\n');
  const ticketsResult = await deduplicateJiraTickets(options);

  logger('\n');
  logger('=' .repeat(60));
  logger('\n');

  // Deduplicate jira_ticket_embeddings
  logger('📋 STEP 2: Deduplicating jira_ticket_embeddings table\n');
  const embeddingsResult = await deduplicateJiraEmbeddings(options);

  const duration = Math.round((Date.now() - startTime) / 1000);

  logger('\n');
  logger('=' .repeat(60));
  logger('\n✅ DEDUPLICATION COMPLETE\n');
  logger(`\n⏱️  Total duration: ${duration}s\n`);
  logger('📊 Final Summary:\n');
  logger(`   jira_tickets:`);
  logger(`     - Total records: ${ticketsResult.totalRecords}`);
  logger(`     - Duplicates found: ${ticketsResult.duplicatesFound}`);
  logger(`     - Records ${options.dryRun ? 'would be ' : ''}deleted: ${options.dryRun ? ticketsResult.wouldDelete : ticketsResult.recordsDeleted}`);
  logger(`     - Final count: ${ticketsResult.finalCount}`);
  logger(`\n   jira_ticket_embeddings:`);
  logger(`     - Total records: ${embeddingsResult.totalRecords}`);
  logger(`     - Duplicates found: ${embeddingsResult.duplicatesFound}`);
  logger(`     - Records ${options.dryRun ? 'would be ' : ''}deleted: ${options.dryRun ? embeddingsResult.wouldDelete : embeddingsResult.recordsDeleted}`);
  logger(`     - Final count: ${embeddingsResult.finalCount}`);

  return {
    duration,
    tickets: ticketsResult,
    embeddings: embeddingsResult,
    totalDuplicatesFound: ticketsResult.duplicatesFound + embeddingsResult.duplicatesFound,
    totalRecordsDeleted: ticketsResult.recordsDeleted + embeddingsResult.recordsDeleted,
    totalWouldDelete: (ticketsResult.wouldDelete || 0) + (embeddingsResult.wouldDelete || 0),
  };
}

module.exports = {
  deduplicateJiraTickets,
  deduplicateJiraEmbeddings,
  deduplicateAll,
};

