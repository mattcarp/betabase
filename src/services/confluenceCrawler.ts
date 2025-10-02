import { confluenceEnv, getAuthHeaders } from './confluenceAuthenticator';
import { upsertWikiDocument } from '@/lib/supabase';
import { storageToMarkdown, extractLabels, buildPageUrl, buildSourceId, normalizeLinks } from '@/src/utils/confluenceHelpers';
import { openai } from '@ai-sdk/openai';
import { embed } from 'ai';

type ConfluencePage = {
  id: string;
  type: string;
  title: string;
  version?: { number: number; when?: string; by?: { displayName?: string } };
  body?: { storage?: { value?: string } };
  metadata?: { labels?: { results?: Array<{ name: string }> } };
  space?: { key?: string };
  _links?: { webui?: string };
};

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

// Removed local HTML→MD fallback in favor of shared utils

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

export async function listPages(spaceKey: string, maxPages?: number): Promise<ConfluencePage[]> {
  const base = confluenceEnv.BASE_URL.replace(/\/$/, '');
  const params = new URLSearchParams({ spaceKey, type: 'page', expand: 'version,metadata.labels,body.storage', limit: '200' });
  const url = `${base}/wiki/rest/api/content?${params.toString()}`;
  const res = await fetchWithRetry(url, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error(`Failed to list pages for ${spaceKey}: ${res.status}`);
  const data = await res.json();
  const results: ConfluencePage[] = data?.results || [];
  return maxPages ? results.slice(0, maxPages) : results;
}

export async function crawlSpaces(options: { spaces?: string[]; maxPagesPerSpace?: number } = {}) {
  const defaultSonySpaces = ['AOMA','USM','TECH','API','RELEASE'];
  const spaces = options.spaces && options.spaces.length > 0
    ? options.spaces
    : ((process.env.CONFLUENCE_SPACES || '').split(',').map(s => s.trim()).filter(Boolean));
  // Fallback to Sony Music spaces if none provided
  const targetSpaces = spaces.length ? spaces : defaultSonySpaces;

  if (!spaces.length) throw new Error('No Confluence spaces provided (CONFLUENCE_SPACES or payload.spaces).');

  let pagesCrawled = 0;
  let vectorsUpserted = 0;

  for (const spaceKey of targetSpaces) {
    const pages = await listPages(spaceKey, options.maxPagesPerSpace);
    for (const page of pages) {
      const versionNum = page.version?.number || 1;
      const sourceId = buildSourceId(page.id, versionNum);
      const canonUrl = page._links?.webui
        ? `${confluenceEnv.BASE_URL.replace(/\/$/, '')}${page._links.webui}`
        : buildPageUrl(confluenceEnv.BASE_URL, page.id);
      const rawMd = storageToMarkdown(page.body?.storage?.value || '');
      const markdown = normalizeLinks(rawMd, confluenceEnv.BASE_URL);
      const labels = extractLabels(page.metadata);

      let embedding: number[] = [];
      try { embedding = await generateEmbedding(markdown); } catch (e) { /* best-effort */ }

      // Upsert into wiki_documents table
      await upsertWikiDocument(
        canonUrl,
        'confluence',
        page.title,
        markdown,
        embedding,
        {
          space: page.space?.key || spaceKey,
          sony_music: true,
          categories: ['wiki','documentation'],
          priority_content: ['AOMA','USM'].includes((page.space?.key || spaceKey).toUpperCase()),
          labels: labels,
          updated_at: page.version?.when,
          author: page.version?.by?.displayName,
          page_id: page.id,
          version: versionNum,
        }
      );

      vectorsUpserted += 1;
      pagesCrawled += 1;
      await delay(200); // friendly pacing
    }
  }

  return { pagesCrawled, vectorsUpserted };
}

export default { listPages, crawlSpaces };


