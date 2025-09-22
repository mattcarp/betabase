import OpenAI from 'openai';
import { chromium, Browser, Page } from 'playwright';
import { upsertVector } from '@/lib/supabase';

const DEFAULT_PROJECTS = ['AOMA', 'USM', 'TECH', 'API'];
const JIRA_BASE = (process.env.JIRA_BASE_URL || 'https://jira.smedigitalapps.com/jira').replace(/\/$/, '');
const JIRA_USER = process.env.JIRA_USERNAME || '';
const JIRA_PASSWORD = process.env.JIRA_PASSWORD || '';

async function delay(ms: number) { return new Promise(res => setTimeout(res, ms)); }

let openai: OpenAI | null = null;
function getOpenAI(): OpenAI | null {
  if (!openai && process.env.OPENAI_API_KEY) {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openai;
}

async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const client = getOpenAI();
    if (!client) return [];
    const resp = await client.embeddings.create({ model: 'text-embedding-ada-002', input: text });
    return resp.data[0].embedding;
  } catch {
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
      await upsertVector(issue.content, embedding, 'jira', issue.issueKey, {
        url: link,
        key: issue.issueKey,
        title: issue.title,
        project: issue.projectKey,
        status: issue.status,
        priority: issue.priority,
        sony_music: true,
      });
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

const sonyMusicJiraCrawler = { crawlProjects };
export default sonyMusicJiraCrawler;

import OpenAI from 'openai';
import { upsertVector } from '@/lib/supabase';

type JiraIssue = {
  id: string;
  key: string;
  fields: {
    summary: string;
    description?: string;
    issuetype?: { name?: string };
    status?: { name?: string };
    priority?: { name?: string };
    project?: { key?: string };
    assignee?: { displayName?: string };
    labels?: string[];
    updated?: string;
  };
};

const JIRA_BASE = (process.env.JIRA_BASE_URL || 'https://jira.smedigitalapps.com/jira').replace(/\/$/, '');
const JIRA_TOKEN = process.env.JIRA_API_TOKEN || '';
const JIRA_USER = process.env.JIRA_USERNAME || '';

function getJiraHeaders(): Record<string, string> {
  if (!JIRA_TOKEN || !JIRA_USER) {
    throw new Error('Missing JIRA credentials (JIRA_USERNAME, JIRA_API_TOKEN)');
  }
  const basic = Buffer.from(`${JIRA_USER}:${JIRA_TOKEN}`).toString('base64');
  return {
    Authorization: `Basic ${basic}`,
    'Accept': 'application/json',
    'User-Agent': 'Siam JIRA Crawler/1.0',
    'Content-Type': 'application/json'
  };
}

async function delay(ms: number) { return new Promise(res => setTimeout(res, ms)); }

async function fetchWithRetry(url: string, init: RequestInit, retries = 3, backoffMs = 500): Promise<Response> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch(url, init);
    if (res.status !== 429 && res.status !== 502 && res.status !== 503) return res;
    const wait = backoffMs * Math.pow(2, attempt);
    await delay(wait);
  }
  return fetch(url, init);
}

const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

async function generateEmbedding(text: string): Promise<number[]> {
  if (!openai) return [];
  const resp = await openai.embeddings.create({ model: 'text-embedding-ada-002', input: text });
  return resp.data[0].embedding;
}

export async function searchIssues(
  projects: string[] = ['AOMA','USM','TECH','API'],
  maxResults = 100
): Promise<JiraIssue[]> {
  const jqlParts: string[] = [];
  if (projects.length) {
    const proj = projects.map(p => `'${p}'`).join(',');
    jqlParts.push(`project in (${proj})`);
  }
  jqlParts.push('ORDER BY updated DESC');
  const jql = encodeURIComponent(jqlParts.join(' AND '));
  const url = `${JIRA_BASE}/rest/api/3/search?jql=${jql}&maxResults=${Math.min(maxResults, 100)}`;
  const res = await fetchWithRetry(url, { headers: getJiraHeaders() });
  if (!res.ok) throw new Error(`JIRA search failed: ${res.status}`);
  const data = await res.json();
  return data.issues || [];
}

export async function crawlSonyMusicJira(options: { projects?: string[]; maxResults?: number } = {}) {
  const projects = options.projects && options.projects.length ? options.projects : ['AOMA','USM','TECH','API'];
  const maxResults = options.maxResults ?? 100;
  const issues = await searchIssues(projects, maxResults);

  let vectorsUpserted = 0;
  for (const issue of issues) {
    const projectKey = issue.fields.project?.key || issue.key.split('-')[0];
    const title = issue.fields.summary || issue.key;
    const description = issue.fields.description || '';
    const body = `Title: ${title}\n\n${description}`.trim();
    const embedding = await generateEmbedding(body).catch(() => []);
    const sourceId = `${projectKey}-${issue.key}`;

    await upsertVector(body, embedding, 'jira', sourceId, {
      url: `${JIRA_BASE}/browse/${issue.key}`,
      key: issue.key,
      title,
      project: projectKey,
      issue_type: issue.fields.issuetype?.name,
      status: issue.fields.status?.name,
      priority: issue.fields.priority?.name,
      assignee: issue.fields.assignee?.displayName,
      labels: issue.fields.labels || [],
      updated_at: issue.fields.updated,
      sony_music: true,
    });
    vectorsUpserted += 1;
    await delay(150);
  }

  return { issuesCrawled: issues.length, vectorsUpserted };
}

export default { searchIssues, crawlSonyMusicJira };


