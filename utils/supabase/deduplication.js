/**
 * De-duplication Utility
 *
 * Checks for existing records in Supabase and handles updates vs inserts.
 * Prevents duplicate data and tracks changes.
 *
 * @module utils/supabase/deduplication
 */

const { getSupabaseClient } = require('./client');

/**
 * Check if JIRA ticket already exists in database
 *
 * @param {string} externalId - JIRA ticket key (e.g., "PROJ-123")
 * @returns {Promise<Object|null>} - Existing ticket or null
 */
async function checkJiraTicketExists(externalId) {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('jira_tickets')
    .select('id, external_id, title, description, updated_at')
    .eq('external_id', externalId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // Not found - this is OK
      return null;
    }
    throw new Error(`Failed to check ticket existence: ${error.message}`);
  }

  return data;
}

/**
 * Check if JIRA ticket has been updated since last scrape
 *
 * @param {Object} existingTicket - Existing ticket from database
 * @param {Object} newTicket - New ticket data from scrape
 * @returns {boolean} - True if ticket has changed
 */
function hasJiraTicketChanged(existingTicket, newTicket) {
  // Compare key fields
  const fieldsToCompare = ['title', 'description', 'status', 'priority'];

  for (const field of fieldsToCompare) {
    const existingValue = existingTicket[field] || '';
    const newValue = newTicket[field] || '';

    if (existingValue.trim() !== newValue.trim()) {
      return true;
    }
  }

  return false;
}

/**
 * Deduplicate JIRA tickets
 *
 * Checks which tickets are new, which need updates, and which are unchanged.
 *
 * @param {Object[]} tickets - Array of scraped JIRA tickets
 * @returns {Promise<Object>} - Categorized tickets
 */
async function deduplicateJiraTickets(tickets) {
  console.log(`\n🔍 Deduplicating ${tickets.length} JIRA tickets...`);

  const newTickets = [];
  const updatedTickets = [];
  const unchangedTickets = [];

  for (const ticket of tickets) {
    try {
      const existing = await checkJiraTicketExists(ticket.external_id);

      if (!existing) {
        // New ticket
        newTickets.push(ticket);
      } else {
        // Check if updated
        if (hasJiraTicketChanged(existing, ticket)) {
          updatedTickets.push({
            ...ticket,
            id: existing.id // Preserve ID for update
          });
        } else {
          unchangedTickets.push(ticket);
        }
      }
    } catch (error) {
      console.error(`❌ Error checking ticket ${ticket.external_id}:`, error.message);
    }
  }

  console.log(`\n📊 Deduplication results:`);
  console.log(`   ✨ New tickets: ${newTickets.length}`);
  console.log(`   📝 Updated tickets: ${updatedTickets.length}`);
  console.log(`   ⏭️  Unchanged tickets: ${unchangedTickets.length}`);

  return {
    new: newTickets,
    updated: updatedTickets,
    unchanged: unchangedTickets
  };
}

/**
 * Insert new JIRA tickets into database
 *
 * @param {Object[]} tickets - Array of new tickets
 * @returns {Promise<Object[]>} - Inserted tickets with IDs
 */
async function insertJiraTickets(tickets) {
  if (tickets.length === 0) {
    console.log('   No new tickets to insert');
    return [];
  }

  console.log(`\n💾 Inserting ${tickets.length} new tickets...`);
  const supabase = getSupabaseClient();

  // Prepare tickets for insertion
  const ticketsToInsert = tickets.map(ticket => ({
    external_id: ticket.external_id,
    title: ticket.title || ticket.summary,
    description: ticket.description || '',
    status: ticket.status || null,
    priority: ticket.priority || null,
    metadata: ticket.metadata || {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }));

  const { data, error } = await supabase
    .from('jira_tickets')
    .insert(ticketsToInsert)
    .select();

  if (error) {
    throw new Error(`Failed to insert tickets: ${error.message}`);
  }

  console.log(`✅ Inserted ${data.length} tickets`);
  return data;
}

/**
 * Update existing JIRA tickets in database
 *
 * @param {Object[]} tickets - Array of tickets to update
 * @returns {Promise<number>} - Number of tickets updated
 */
async function updateJiraTickets(tickets) {
  if (tickets.length === 0) {
    console.log('   No tickets to update');
    return 0;
  }

  console.log(`\n📝 Updating ${tickets.length} tickets...`);
  const supabase = getSupabaseClient();
  let updatedCount = 0;

  for (const ticket of tickets) {
    try {
      const { error } = await supabase
        .from('jira_tickets')
        .update({
          title: ticket.title || ticket.summary,
          description: ticket.description || '',
          status: ticket.status || null,
          priority: ticket.priority || null,
          metadata: ticket.metadata || {},
          updated_at: new Date().toISOString()
        })
        .eq('id', ticket.id);

      if (error) {
        console.error(`❌ Failed to update ticket ${ticket.external_id}:`, error.message);
      } else {
        updatedCount++;
      }
    } catch (error) {
      console.error(`❌ Error updating ticket ${ticket.external_id}:`, error.message);
    }
  }

  console.log(`✅ Updated ${updatedCount} tickets`);
  return updatedCount;
}

/**
 * Insert or update JIRA ticket embeddings
 *
 * @param {Object[]} embeddings - Array of {external_id, embedding} objects
 * @returns {Promise<number>} - Number of embeddings saved
 */
async function upsertJiraEmbeddings(embeddings) {
  if (embeddings.length === 0) {
    console.log('   No embeddings to save');
    return 0;
  }

  console.log(`\n🧠 Upserting ${embeddings.length} embeddings...`);
  const supabase = getSupabaseClient();

  // Get ticket IDs for external_ids
  const externalIds = embeddings.map(e => e.external_id);
  const { data: tickets, error: fetchError } = await supabase
    .from('jira_tickets')
    .select('id, external_id')
    .in('external_id', externalIds);

  if (fetchError) {
    throw new Error(`Failed to fetch ticket IDs: ${fetchError.message}`);
  }

  // Create a map of external_id -> ticket_id
  const idMap = {};
  tickets.forEach(t => {
    idMap[t.external_id] = t.id;
  });

  // Prepare embeddings for upsert
  const embeddingsToUpsert = embeddings.map(e => ({
    ticket_id: idMap[e.external_id],
    ticket_key: e.external_id,
    summary: e.summary || '',
    embedding: e.embedding
  })).filter(e => e.ticket_id); // Only include if we found the ticket_id

  if (embeddingsToUpsert.length === 0) {
    console.log('⚠️  No embeddings matched existing tickets');
    return 0;
  }

  const { data, error } = await supabase
    .from('jira_ticket_embeddings')
    .upsert(embeddingsToUpsert, {
      onConflict: 'ticket_id'
    });

  if (error) {
    throw new Error(`Failed to upsert embeddings: ${error.message}`);
  }

  console.log(`✅ Upserted ${embeddingsToUpsert.length} embeddings`);
  return embeddingsToUpsert.length;
}

module.exports = {
  checkJiraTicketExists,
  hasJiraTicketChanged,
  deduplicateJiraTickets,
  insertJiraTickets,
  updateJiraTickets,
  upsertJiraEmbeddings
};
