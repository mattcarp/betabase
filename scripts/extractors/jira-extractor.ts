/**
 * Jira Bulk Data Extractor
 *
 * Uses Playwright to scrape Jira tickets via VPN.
 * Designed for the long-running agent harness workflow.
 *
 * Usage:
 *   1. Connect to VPN (GlobalConnect)
 *   2. Run: npx playwright test scripts/extractors/jira-extractor.ts --headed
 *   3. Login manually on first run (auth state saved)
 *   4. Subsequent runs use saved auth
 */

import { test, expect, Page, BrowserContext } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// Configuration - UPDATE THESE FOR YOUR ENVIRONMENT
const CONFIG = {
  // Sony Jira base URL (update when you have VPN access)
  jiraBaseUrl: process.env.JIRA_BASE_URL || 'https://jira.sonymusic.com',

  // Project keys to extract (comma-separated in env, or defaults)
  projectKeys: (process.env.JIRA_PROJECTS || 'AOMA').split(','),

  // Output directory
  outputDir: path.join(process.cwd(), 'data', 'jira'),

  // Auth state file
  authStatePath: path.join(process.cwd(), 'playwright', '.auth', 'jira-state.json'),

  // Rate limiting - delay between requests (ms)
  requestDelay: 500,

  // Max tickets per project (0 = unlimited)
  maxTicketsPerProject: 0,

  // Include attachments
  downloadAttachments: true,

  // Max attachment size (bytes) - skip larger files
  maxAttachmentSize: 50 * 1024 * 1024, // 50MB
};

interface JiraTicket {
  key: string;
  summary: string;
  description: string | null;
  status: string;
  assignee: string | null;
  reporter: string | null;
  created: string;
  updated: string;
  priority: string | null;
  labels: string[];
  components: string[];
  fixVersions: string[];
  type: string;
  comments: JiraComment[];
  attachments: JiraAttachment[];
  subtasks: string[];
  linkedIssues: string[];
  customFields: Record<string, unknown>;
}

interface JiraComment {
  id: string;
  author: string;
  body: string;
  created: string;
  updated: string;
}

interface JiraAttachment {
  id: string;
  filename: string;
  size: number;
  mimeType: string;
  author: string;
  created: string;
  localPath?: string;
  skipped?: boolean;
  skipReason?: string;
}

// Helper to ensure output directory exists
function ensureDir(dirPath: string) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// Helper to save JSON
function saveJson(filename: string, data: unknown) {
  const filePath = path.join(CONFIG.outputDir, filename);
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  console.log(`Saved: ${filePath}`);
}

// Helper for rate limiting
async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

test.describe('Jira Data Extraction', () => {

  test.beforeAll(async () => {
    ensureDir(CONFIG.outputDir);
    ensureDir(path.join(CONFIG.outputDir, 'attachments'));
  });

  test('authenticate and save state', async ({ page, context }) => {
    // Check if we already have auth state
    if (fs.existsSync(CONFIG.authStatePath)) {
      console.log('Auth state exists, skipping authentication');
      test.skip();
      return;
    }

    // Navigate to Jira - will trigger SSO
    await page.goto(CONFIG.jiraBaseUrl);

    // Wait for user to complete login manually
    // The test will pause here in headed mode
    console.log('Please complete SSO login in the browser...');
    console.log('After successful login, the script will continue automatically.');

    // Wait for Jira dashboard to load (adjust selector as needed)
    await page.waitForSelector('[data-testid="global-navigation"]', {
      timeout: 300000 // 5 minutes for manual login
    });

    // Save auth state
    await context.storageState({ path: CONFIG.authStatePath });
    console.log(`Auth state saved to: ${CONFIG.authStatePath}`);
  });

  test('extract all tickets', async ({ page, context }) => {
    // Load auth state if exists
    if (fs.existsSync(CONFIG.authStatePath)) {
      const state = JSON.parse(fs.readFileSync(CONFIG.authStatePath, 'utf-8'));
      await context.addCookies(state.cookies || []);
    }

    const allTickets: JiraTicket[] = [];

    for (const projectKey of CONFIG.projectKeys) {
      console.log(`\nExtracting project: ${projectKey}`);
      const tickets = await extractProject(page, projectKey);
      allTickets.push(...tickets);

      // Save per-project file
      saveJson(`${projectKey.toLowerCase()}-tickets.json`, tickets);

      await delay(CONFIG.requestDelay);
    }

    // Save combined file
    saveJson('all-tickets.json', allTickets);

    // Save summary
    const summary = {
      extractedAt: new Date().toISOString(),
      totalTickets: allTickets.length,
      byProject: CONFIG.projectKeys.reduce((acc, key) => {
        acc[key] = allTickets.filter(t => t.key.startsWith(key)).length;
        return acc;
      }, {} as Record<string, number>),
      byStatus: allTickets.reduce((acc, t) => {
        acc[t.status] = (acc[t.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };
    saveJson('extraction-summary.json', summary);

    console.log('\nExtraction complete!');
    console.log(`Total tickets: ${allTickets.length}`);
  });
});

async function extractProject(page: Page, projectKey: string): Promise<JiraTicket[]> {
  const tickets: JiraTicket[] = [];

  // Use JQL to search for all tickets in project
  const jql = encodeURIComponent(`project = ${projectKey} ORDER BY updated DESC`);
  const searchUrl = `${CONFIG.jiraBaseUrl}/rest/api/2/search?jql=${jql}&maxResults=100&expand=renderedFields,names,changelog`;

  let startAt = 0;
  let hasMore = true;

  while (hasMore) {
    const url = `${searchUrl}&startAt=${startAt}`;

    // Use Jira REST API
    const response = await page.request.get(url);

    if (!response.ok()) {
      console.error(`API error: ${response.status()}`);

      // If unauthorized, may need to re-authenticate
      if (response.status() === 401 || response.status() === 403) {
        console.error('Authentication required. Run authentication test first.');
        break;
      }

      break;
    }

    const data = await response.json();
    const issues = data.issues || [];

    for (const issue of issues) {
      const ticket = parseJiraIssue(issue);
      tickets.push(ticket);

      // Download attachments if enabled
      if (CONFIG.downloadAttachments && ticket.attachments.length > 0) {
        await downloadAttachments(page, ticket);
      }

      console.log(`  Extracted: ${ticket.key} - ${ticket.summary.substring(0, 50)}...`);
    }

    // Check pagination
    const total = data.total || 0;
    startAt += issues.length;
    hasMore = startAt < total && (CONFIG.maxTicketsPerProject === 0 || tickets.length < CONFIG.maxTicketsPerProject);

    if (hasMore) {
      await delay(CONFIG.requestDelay);
    }
  }

  return tickets;
}

function parseJiraIssue(issue: Record<string, unknown>): JiraTicket {
  const fields = issue.fields as Record<string, unknown>;

  return {
    key: issue.key as string,
    summary: (fields.summary as string) || '',
    description: (fields.description as string) || null,
    status: ((fields.status as Record<string, unknown>)?.name as string) || 'Unknown',
    assignee: ((fields.assignee as Record<string, unknown>)?.displayName as string) || null,
    reporter: ((fields.reporter as Record<string, unknown>)?.displayName as string) || null,
    created: (fields.created as string) || '',
    updated: (fields.updated as string) || '',
    priority: ((fields.priority as Record<string, unknown>)?.name as string) || null,
    labels: (fields.labels as string[]) || [],
    components: ((fields.components as Array<Record<string, unknown>>) || []).map(c => c.name as string),
    fixVersions: ((fields.fixVersions as Array<Record<string, unknown>>) || []).map(v => v.name as string),
    type: ((fields.issuetype as Record<string, unknown>)?.name as string) || 'Unknown',
    comments: parseComments(fields.comment as Record<string, unknown>),
    attachments: parseAttachments(fields.attachment as Array<Record<string, unknown>>),
    subtasks: ((fields.subtasks as Array<Record<string, unknown>>) || []).map(s => s.key as string),
    linkedIssues: parseLinkedIssues(fields.issuelinks as Array<Record<string, unknown>>),
    customFields: extractCustomFields(fields),
  };
}

function parseComments(commentData: Record<string, unknown>): JiraComment[] {
  if (!commentData?.comments) return [];

  return ((commentData.comments as Array<Record<string, unknown>>) || []).map(c => ({
    id: (c.id as string) || '',
    author: ((c.author as Record<string, unknown>)?.displayName as string) || 'Unknown',
    body: (c.body as string) || '',
    created: (c.created as string) || '',
    updated: (c.updated as string) || '',
  }));
}

function parseAttachments(attachments: Array<Record<string, unknown>>): JiraAttachment[] {
  if (!attachments) return [];

  return attachments.map(a => ({
    id: (a.id as string) || '',
    filename: (a.filename as string) || '',
    size: (a.size as number) || 0,
    mimeType: (a.mimeType as string) || '',
    author: ((a.author as Record<string, unknown>)?.displayName as string) || 'Unknown',
    created: (a.created as string) || '',
  }));
}

function parseLinkedIssues(links: Array<Record<string, unknown>>): string[] {
  if (!links) return [];

  return links.map(l => {
    const inward = l.inwardIssue as Record<string, unknown>;
    const outward = l.outwardIssue as Record<string, unknown>;
    return (inward?.key || outward?.key) as string;
  }).filter(Boolean);
}

function extractCustomFields(fields: Record<string, unknown>): Record<string, unknown> {
  const customFields: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(fields)) {
    if (key.startsWith('customfield_') && value !== null) {
      customFields[key] = value;
    }
  }

  return customFields;
}

async function downloadAttachments(page: Page, ticket: JiraTicket) {
  const attachmentDir = path.join(CONFIG.outputDir, 'attachments', ticket.key);
  ensureDir(attachmentDir);

  for (const attachment of ticket.attachments) {
    // Skip large files
    if (attachment.size > CONFIG.maxAttachmentSize) {
      attachment.skipped = true;
      attachment.skipReason = `File too large (${Math.round(attachment.size / 1024 / 1024)}MB > ${CONFIG.maxAttachmentSize / 1024 / 1024}MB limit)`;
      console.log(`    Skipped attachment: ${attachment.filename} - ${attachment.skipReason}`);
      continue;
    }

    try {
      const attachmentUrl = `${CONFIG.jiraBaseUrl}/secure/attachment/${attachment.id}/${encodeURIComponent(attachment.filename)}`;
      const response = await page.request.get(attachmentUrl);

      if (response.ok()) {
        const buffer = await response.body();
        const localPath = path.join(attachmentDir, attachment.filename);
        fs.writeFileSync(localPath, buffer);
        attachment.localPath = localPath;
        console.log(`    Downloaded: ${attachment.filename}`);
      }
    } catch (error) {
      attachment.skipped = true;
      attachment.skipReason = `Download failed: ${error}`;
      console.log(`    Failed to download: ${attachment.filename}`);
    }

    await delay(100); // Small delay between attachment downloads
  }
}
