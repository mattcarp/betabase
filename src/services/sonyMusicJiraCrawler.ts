import { openai } from '@ai-sdk/openai';
import { embed } from 'ai';
import type { Browser, Page } from 'playwright';
import { upsertJiraTicket, upsertJiraTicketEmbedding } from '@/lib/supabase';

// Dynamic import of playwright to avoid bundling in production
async function getPlaywright() {
  const { chromium } = await import('playwright');
  return chromium;
}

const DEFAULT_PROJECTS = ['AOMA', 'USM', 'TECH', 'API'];
const JIRA_BASE = (process.env.JIRA_BASE_URL || 'https://jira.smedigitalapps.com/jira').replace(/\/$/, '');
const JIRA_USER = process.env.JIRA_USERNAME || '';
const JIRA_PASSWORD = process.env.JIRA_PASSWORD || '';
// Note: We use Playwright with username/password login, NOT Jira REST API

async function delay(ms: number) { return new Promise(res => setTimeout(res, ms)); }

async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const { embedding } = await embed({
      model: openai.embedding('text-embedding-3-small'),
      value: text,
    });
    return embedding;
  } catch (error) {
    console.error('Failed to generate embedding:', error);
    return [];
  }
}

async function loginViaUI(page: Page) {
  if (!JIRA_USER || !JIRA_PASSWORD) throw new Error('Missing JIRA_USERNAME or JIRA_PASSWORD');
  await page.goto(`${JIRA_BASE}/login.jsp`, { waitUntil: 'domcontentloaded' });
  // Try DC login selectors first
  const dcUser = await page.$('#login-form-username');
  if (dcUser) {
    await page.fill('#login-form-username', JIRA_USER);
    await page.fill('#login-form-password', JIRA_PASSWORD);
    await page.click('#login');
    await page.waitForLoadState('domcontentloaded');
    return;
  }
  // Fallback to modern selectors
  await page.fill('input#username', JIRA_USER).catch(() => {});
  const nextBtn = await page.$('button#login-submit');
  if (nextBtn) {
    await nextBtn.click().catch(() => {});
    await page.waitForTimeout(600);
  }
  await page.fill('input#password', JIRA_PASSWORD).catch(() => {});
  await page.click('button#login-submit').catch(() => {});
  await page.waitForLoadState('domcontentloaded');
}

async function collectIssueLinks(page: Page): Promise<string[]> {
  const anchors = await page.$$(`a[href*="/browse/"]`);
  const hrefs: string[] = [];
  for (const a of anchors) {
    const href = await a.getAttribute('href');
    if (href && /\/browse\//.test(href)) hrefs.push(href);
  }
  // Normalize and dedupe
  const full = hrefs.map(h => h.startsWith('http') ? h : `${JIRA_BASE}${h}`);
  return Array.from(new Set(full));
}

async function scrapeIssue(page: Page, url: string) {
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(500);
  const keyMatch = url.match(/\/browse\/([^?#/]+)/);
  const issueKey = keyMatch ? keyMatch[1] : '';
  const projectKey = issueKey.split('-')[0];

  const title = (await page.locator('#summary-val').textContent().catch(() => null))
    || (await page.locator('[data-test-id="issue.views.issue-base.foundation.summary.heading"]').textContent().catch(() => null))
    || '';

  const description = (await page.locator('#description-val').textContent().catch(() => null))
    || (await page.locator('[data-test-id="issue.views.field.rich-text.editor.ui.content"] div').first().textContent().catch(() => null))
    || '';

  const status = (await page.locator('#status-val').textContent().catch(() => null))
    || (await page.locator('[data-test-id="issue.views.issue-base.foundation.status.status-field"]').textContent().catch(() => null))
    || '';

  const priority = (await page.locator('#priority-val').textContent().catch(() => null))
    || (await page.locator('[data-test-id="issue.views.issue-base.foundation.priority.priority-field"]').textContent().catch(() => null))
    || '';

  // Comments
  const commentNodes = await page.$$('[data-test-id="comment"] , #issue_actions_container .actionContainer');
  const comments: string[] = [];
  for (const node of commentNodes.slice(0, 10)) {
    const txt = (await node.textContent()) || '';
    const compact = txt.replace(/\s+/g, ' ').trim();
    if (compact) comments.push(compact);
  }

  const content = [
    `Issue: ${issueKey} — ${title?.trim()}`,
    description && `\nDescription:\n${description.trim()}`,
    comments.length ? `\nComments:\n- ${comments.join('\n- ')}` : ''
  ].filter(Boolean).join('\n');

  return { issueKey, projectKey, title: title?.trim() || issueKey, description: description?.trim() || '', status: status?.trim() || '', priority: priority?.trim() || '', comments, content };
}

export interface CrawlOptions { projects?: string[]; sinceDays?: number; onProgress?: (event: any) => void; }

export async function crawlProjects(options: CrawlOptions = {}) {
  const projects = (options.projects && options.projects.length) ? options.projects : DEFAULT_PROJECTS;
  const sinceDays = options.sinceDays ?? 7;
  const jqlParts: string[] = [];
  if (projects.length) jqlParts.push(`project in (${projects.map(p => `'${p}'`).join(',')})`);
  if (sinceDays > 0) jqlParts.push(`updated >= -${sinceDays}d`);
  jqlParts.push('ORDER BY updated DESC');
  const jql = jqlParts.join(' AND ');

  let browser: Browser | null = null;
  let issuesCrawled = 0;
  let vectorsUpserted = 0;

  try {
    const chromium = await getPlaywright();
    browser = await chromium.launch({ headless: true });
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await loginViaUI(page);

    await page.goto(`${JIRA_BASE}/issues/?jql=${encodeURIComponent(jql)}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    const links = (await collectIssueLinks(page)).slice(0, 100);

    for (const link of links) {
      const issue = await scrapeIssue(page, link);
      const embedding = await generateEmbedding(issue.content);

      // Store in jira_tickets table
      await upsertJiraTicket(
        issue.issueKey,
        issue.title,
        issue.description,
        embedding,
        {
          url: link,
          project: issue.projectKey,
          status: issue.status,
          priority: issue.priority,
          sony_music: true,
          comments: issue.comments,
        }
      );

      // Also store in jira_ticket_embeddings for semantic search
      await upsertJiraTicketEmbedding(
        issue.issueKey,
        issue.title,
        embedding,
        {
          project: issue.projectKey,
          status: issue.status,
          sony_music: true,
        }
      );

      issuesCrawled += 1;
      vectorsUpserted += 1;
      options.onProgress?.({ type: 'issue', key: issue.issueKey, project: issue.projectKey, upserted: true });
      await delay(150);
    }

    await ctx.close();
  } finally {
    if (browser) await browser.close();
  }

  return { issuesCrawled, vectorsUpserted, projects, sinceDays };
}

// Export Playwright-based crawler (ONLY implementation we use)
const sonyMusicJiraCrawler = { crawlProjects };
export default sonyMusicJiraCrawler;


