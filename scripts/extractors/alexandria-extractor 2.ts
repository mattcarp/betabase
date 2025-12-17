/**
 * Alexandria/Confluence Document Extractor
 *
 * Uses Playwright to scrape Alexandria (Sony's Confluence-based docs) via VPN.
 * Designed for the long-running agent harness workflow.
 *
 * Usage:
 *   1. Connect to VPN (GlobalConnect)
 *   2. Run: npx playwright test scripts/extractors/alexandria-extractor.ts --headed
 *   3. Login manually on first run (auth state saved)
 *   4. Subsequent runs use saved auth
 */

import { test, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// Configuration - UPDATE THESE FOR YOUR ENVIRONMENT
const CONFIG = {
  // Alexandria/Confluence base URL (update when you have VPN access)
  confluenceBaseUrl: process.env.CONFLUENCE_BASE_URL || 'https://alexandria.sonymusic.com',

  // Space keys to extract (comma-separated in env, or defaults)
  spaceKeys: (process.env.CONFLUENCE_SPACES || 'AOMA').split(','),

  // Output directory
  outputDir: path.join(process.cwd(), 'data', 'alexandria'),

  // Auth state file (shared with Jira if same SSO)
  authStatePath: path.join(process.cwd(), 'playwright', '.auth', 'confluence-state.json'),

  // Rate limiting - delay between requests (ms)
  requestDelay: 500,

  // Max pages per space (0 = unlimited)
  maxPagesPerSpace: 0,

  // Include page attachments
  downloadAttachments: false, // Attachments can be large, disable by default
};

interface ConfluencePage {
  id: string;
  title: string;
  spaceKey: string;
  parentId: string | null;
  content: string; // HTML or markdown
  contentMarkdown: string; // Converted to markdown
  created: string;
  updated: string;
  author: string;
  lastModifier: string;
  version: number;
  ancestors: string[]; // Page hierarchy
  children: string[]; // Child page IDs
  labels: string[];
  attachments: ConfluenceAttachment[];
}

interface ConfluenceAttachment {
  id: string;
  title: string;
  filename: string;
  fileSize: number;
  mediaType: string;
  created: string;
  localPath?: string;
}

interface ConfluenceSpace {
  key: string;
  name: string;
  description: string;
  type: string;
  homePageId: string;
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

// Helper to save markdown
function saveMarkdown(filename: string, content: string) {
  const filePath = path.join(CONFIG.outputDir, 'content', filename);
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content);
  console.log(`Saved: ${filePath}`);
}

// Helper for rate limiting
async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Simple HTML to Markdown conversion
function htmlToMarkdown(html: string): string {
  if (!html) return '';

  return html
    // Headers
    .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n')
    .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n')
    .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n')
    .replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n\n')
    .replace(/<h5[^>]*>(.*?)<\/h5>/gi, '##### $1\n\n')
    .replace(/<h6[^>]*>(.*?)<\/h6>/gi, '###### $1\n\n')
    // Bold and italic
    .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
    .replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')
    .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
    .replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*')
    // Links
    .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)')
    // Lists
    .replace(/<ul[^>]*>/gi, '\n')
    .replace(/<\/ul>/gi, '\n')
    .replace(/<ol[^>]*>/gi, '\n')
    .replace(/<\/ol>/gi, '\n')
    .replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n')
    // Code
    .replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`')
    .replace(/<pre[^>]*>(.*?)<\/pre>/gis, '```\n$1\n```\n')
    // Paragraphs and breaks
    .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    // Tables (basic)
    .replace(/<table[^>]*>/gi, '\n')
    .replace(/<\/table>/gi, '\n')
    .replace(/<tr[^>]*>/gi, '| ')
    .replace(/<\/tr>/gi, ' |\n')
    .replace(/<th[^>]*>(.*?)<\/th>/gi, '$1 | ')
    .replace(/<td[^>]*>(.*?)<\/td>/gi, '$1 | ')
    // Remove remaining tags
    .replace(/<[^>]+>/g, '')
    // Clean up whitespace
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

test.describe('Alexandria Data Extraction', () => {

  test.beforeAll(async () => {
    ensureDir(CONFIG.outputDir);
    ensureDir(path.join(CONFIG.outputDir, 'content'));
    ensureDir(path.join(CONFIG.outputDir, 'attachments'));
  });

  test('authenticate and save state', async ({ page, context }) => {
    // Check if we already have auth state
    if (fs.existsSync(CONFIG.authStatePath)) {
      console.log('Auth state exists, skipping authentication');
      test.skip();
      return;
    }

    // Navigate to Confluence - will trigger SSO
    await page.goto(CONFIG.confluenceBaseUrl);

    // Wait for user to complete login manually
    console.log('Please complete SSO login in the browser...');
    console.log('After successful login, the script will continue automatically.');

    // Wait for Confluence to load (adjust selector as needed)
    await page.waitForSelector('[data-testid="app-navigation"]', {
      timeout: 300000 // 5 minutes for manual login
    });

    // Save auth state
    await context.storageState({ path: CONFIG.authStatePath });
    console.log(`Auth state saved to: ${CONFIG.authStatePath}`);
  });

  test('extract all spaces', async ({ page, context }) => {
    // Load auth state if exists
    if (fs.existsSync(CONFIG.authStatePath)) {
      const state = JSON.parse(fs.readFileSync(CONFIG.authStatePath, 'utf-8'));
      await context.addCookies(state.cookies || []);
    }

    const allPages: ConfluencePage[] = [];
    const spaces: ConfluenceSpace[] = [];

    for (const spaceKey of CONFIG.spaceKeys) {
      console.log(`\nExtracting space: ${spaceKey}`);

      // Get space info
      const space = await getSpaceInfo(page, spaceKey);
      if (space) {
        spaces.push(space);
      }

      // Get all pages in space
      const pages = await extractSpace(page, spaceKey);
      allPages.push(...pages);

      // Save per-space file
      saveJson(`${spaceKey.toLowerCase()}-pages.json`, pages);

      // Save individual markdown files
      for (const pageData of pages) {
        const safeName = pageData.title.replace(/[^a-z0-9]/gi, '-').toLowerCase();
        saveMarkdown(`${spaceKey.toLowerCase()}/${safeName}.md`, pageData.contentMarkdown);
      }

      await delay(CONFIG.requestDelay);
    }

    // Save combined file
    saveJson('all-pages.json', allPages);
    saveJson('spaces.json', spaces);

    // Save summary
    const summary = {
      extractedAt: new Date().toISOString(),
      totalPages: allPages.length,
      totalSpaces: spaces.length,
      bySpace: CONFIG.spaceKeys.reduce((acc, key) => {
        acc[key] = allPages.filter(p => p.spaceKey === key).length;
        return acc;
      }, {} as Record<string, number>),
    };
    saveJson('extraction-summary.json', summary);

    console.log('\nExtraction complete!');
    console.log(`Total pages: ${allPages.length}`);
  });
});

async function getSpaceInfo(page: Page, spaceKey: string): Promise<ConfluenceSpace | null> {
  const url = `${CONFIG.confluenceBaseUrl}/rest/api/space/${spaceKey}`;

  try {
    const response = await page.request.get(url);

    if (!response.ok()) {
      console.error(`Failed to get space info for ${spaceKey}: ${response.status()}`);
      return null;
    }

    const data = await response.json();

    return {
      key: data.key,
      name: data.name,
      description: data.description?.plain?.value || '',
      type: data.type,
      homePageId: data._expandable?.homepage?.split('/').pop() || '',
    };
  } catch (error) {
    console.error(`Error getting space info: ${error}`);
    return null;
  }
}

async function extractSpace(page: Page, spaceKey: string): Promise<ConfluencePage[]> {
  const pages: ConfluencePage[] = [];

  // Use Confluence REST API to get all pages in space
  const baseUrl = `${CONFIG.confluenceBaseUrl}/rest/api/content`;
  const expand = 'body.storage,ancestors,children.page,history,metadata.labels';

  let start = 0;
  const limit = 25;
  let hasMore = true;

  while (hasMore) {
    const url = `${baseUrl}?spaceKey=${spaceKey}&type=page&start=${start}&limit=${limit}&expand=${expand}`;

    try {
      const response = await page.request.get(url);

      if (!response.ok()) {
        console.error(`API error: ${response.status()}`);

        if (response.status() === 401 || response.status() === 403) {
          console.error('Authentication required. Run authentication test first.');
          break;
        }

        break;
      }

      const data = await response.json();
      const results = data.results || [];

      for (const pageData of results) {
        const parsedPage = parseConfluencePage(pageData, spaceKey);
        pages.push(parsedPage);

        console.log(`  Extracted: ${parsedPage.title.substring(0, 50)}...`);
      }

      // Check pagination
      const size = data.size || 0;
      start += size;
      hasMore = size === limit && (CONFIG.maxPagesPerSpace === 0 || pages.length < CONFIG.maxPagesPerSpace);

      if (hasMore) {
        await delay(CONFIG.requestDelay);
      }
    } catch (error) {
      console.error(`Error extracting space: ${error}`);
      break;
    }
  }

  return pages;
}

function parseConfluencePage(data: Record<string, unknown>, spaceKey: string): ConfluencePage {
  const body = data.body as Record<string, unknown>;
  const storage = body?.storage as Record<string, unknown>;
  const htmlContent = (storage?.value as string) || '';

  const history = data.history as Record<string, unknown>;
  const createdBy = history?.createdBy as Record<string, unknown>;
  const lastUpdated = history?.lastUpdated as Record<string, unknown>;
  const lastUpdatedBy = lastUpdated?.by as Record<string, unknown>;

  const ancestors = (data.ancestors as Array<Record<string, unknown>>) || [];
  const children = data.children as Record<string, unknown>;
  const childPages = children?.page as Record<string, unknown>;
  const childResults = (childPages?.results as Array<Record<string, unknown>>) || [];

  const metadata = data.metadata as Record<string, unknown>;
  const labels = metadata?.labels as Record<string, unknown>;
  const labelResults = (labels?.results as Array<Record<string, unknown>>) || [];

  return {
    id: data.id as string,
    title: data.title as string,
    spaceKey,
    parentId: ancestors.length > 0 ? ancestors[ancestors.length - 1].id as string : null,
    content: htmlContent,
    contentMarkdown: htmlToMarkdown(htmlContent),
    created: (history?.createdDate as string) || '',
    updated: (lastUpdated?.when as string) || '',
    author: (createdBy?.displayName as string) || 'Unknown',
    lastModifier: (lastUpdatedBy?.displayName as string) || 'Unknown',
    version: (data.version as Record<string, unknown>)?.number as number || 1,
    ancestors: ancestors.map(a => a.id as string),
    children: childResults.map(c => c.id as string),
    labels: labelResults.map(l => l.name as string),
    attachments: [], // Would need separate API call to get attachments
  };
}
