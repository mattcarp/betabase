/**
 * Detail Route for Knowledge API
 *
 * GET /v1/knowledge/detail/:sourceType/:sourceId
 * Returns full content for a specific knowledge item
 *
 * Currently supports:
 * - jira: Full ticket data from processed JSON
 * - wiki: Already returns full content in search
 */

import { Hono } from 'hono';
import * as fs from 'fs';
import * as path from 'path';

const detailRoute = new Hono();

// Cache the Jira tickets in memory for fast lookups
let jiraTicketsCache: Map<string, JiraTicket> | null = null;

interface JiraTicket {
  id: string;
  type: string;
  status: string;
  priority: string;
  summary: string;
  description: string;
  created: string;
  resolved: string;
  resolution: string;
  aomaTeam: string;
  application: string;
  environment: string;
  assetType: string;
  comments: Array<{ author?: string; body?: string; created?: string }>;
}

function loadJiraTickets(): Map<string, JiraTicket> {
  if (jiraTicketsCache) {
    return jiraTicketsCache;
  }

  const jsonPath = path.join(
    process.cwd(),
    'docs',
    'aoma',
    'training-data',
    'jira-tickets-processed.json'
  );

  if (!fs.existsSync(jsonPath)) {
    console.warn(`Jira tickets file not found: ${jsonPath}`);
    jiraTicketsCache = new Map();
    return jiraTicketsCache;
  }

  try {
    const data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8')) as JiraTicket[];
    jiraTicketsCache = new Map(data.map((ticket) => [ticket.id, ticket]));
    console.log(`Loaded ${jiraTicketsCache.size} Jira tickets into cache`);
    return jiraTicketsCache;
  } catch (error) {
    console.error('Failed to load Jira tickets:', error);
    jiraTicketsCache = new Map();
    return jiraTicketsCache;
  }
}

detailRoute.get('/:sourceType/:sourceId', async (c) => {
  const { sourceType, sourceId } = c.req.param();

  if (sourceType === 'jira') {
    const tickets = loadJiraTickets();
    const ticket = tickets.get(sourceId);

    if (ticket) {
      // Full ticket data available from JSON
      return c.json({
        source_type: 'jira',
        source_id: sourceId,
        detail_level: 'full',
        data: {
          id: ticket.id,
          type: ticket.type,
          status: ticket.status,
          priority: ticket.priority,
          summary: ticket.summary,
          description: ticket.description,
          created: ticket.created,
          resolved: ticket.resolved || null,
          resolution: ticket.resolution || null,
          aomaTeam: ticket.aomaTeam || null,
          application: ticket.application || null,
          environment: ticket.environment || null,
          assetType: ticket.assetType || null,
          comments: ticket.comments || [],
        },
        has_description: !!ticket.description && ticket.description.length > 0,
        has_comments: ticket.comments && ticket.comments.length > 0,
      });
    }

    // Ticket not in JSON - return minimal info with link to Jira
    // This happens when siam_vectors has newer tickets than the JSON export
    return c.json({
      source_type: 'jira',
      source_id: sourceId,
      detail_level: 'minimal',
      data: {
        id: sourceId,
        summary: null,
        description: null,
      },
      message: 'Full ticket detail not available in local cache',
      jira_url: `https://jira.sonymusic.com/browse/${sourceId}`,
      hint: 'View full ticket in Jira (requires VPN)',
    });
  }

  if (sourceType === 'wiki') {
    // Wiki content is already returned in full from search
    // This endpoint can be used for metadata or refresh
    return c.json({
      source_type: 'wiki',
      source_id: sourceId,
      message: 'Wiki content is returned in full from /query endpoint',
      hint: 'Use source_id URL to view in browser',
    });
  }

  return c.json(
    {
      error: 'Unsupported source type',
      source_type: sourceType,
      supported: ['jira', 'wiki'],
    },
    400
  );
});

// Batch lookup for multiple items
detailRoute.post('/batch', async (c) => {
  const body = await c.req.json<{ items: Array<{ source_type: string; source_id: string }> }>();

  if (!body.items || !Array.isArray(body.items)) {
    return c.json({ error: 'items array is required' }, 400);
  }

  const tickets = loadJiraTickets();
  const results: Record<string, unknown> = {};

  for (const item of body.items) {
    const key = `${item.source_type}:${item.source_id}`;

    if (item.source_type === 'jira') {
      const ticket = tickets.get(item.source_id);
      if (ticket) {
        results[key] = {
          source_type: 'jira',
          source_id: item.source_id,
          data: ticket,
        };
      } else {
        results[key] = { error: 'not found' };
      }
    }
  }

  return c.json({ results });
});

export default detailRoute;
