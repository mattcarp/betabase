import { Buffer } from 'buffer';

const BASE_URL = process.env.CONFLUENCE_BASE_URL || '';
const API_TOKEN = process.env.CONFLUENCE_API_TOKEN || '';
const USERNAME = process.env.CONFLUENCE_USERNAME || '';

function ensureEnv(): { ok: boolean; missing: string[] } {
  const missing: string[] = [];
  if (!BASE_URL) missing.push('CONFLUENCE_BASE_URL');
  if (!API_TOKEN) missing.push('CONFLUENCE_API_TOKEN');
  if (!USERNAME) missing.push('CONFLUENCE_USERNAME');
  return { ok: missing.length === 0, missing };
}

export function getAuthHeaders(): Record<string, string> {
  const check = ensureEnv();
  if (!check.ok) {
    throw new Error(`Missing Confluence env vars: ${check.missing.join(', ')}`);
  }
  const basic = Buffer.from(`${USERNAME}:${API_TOKEN}`).toString('base64');
  return {
    Authorization: `Basic ${basic}`,
    'User-Agent': 'Siam Confluence Crawler/1.0',
    Accept: 'application/json'
  };
}

export async function testConnection(): Promise<{ ok: boolean; status: number; message?: string }> {
  const check = ensureEnv();
  if (!check.ok) {
    return { ok: false, status: 500, message: `Missing env: ${check.missing.join(', ')}` };
  }
  try {
    const url = `${BASE_URL.replace(/\/$/, '')}/wiki/rest/api/user/current`;
    const res = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    if (res.status === 401) return { ok: false, status: 401, message: 'Unauthorized (check credentials)' };
    if (res.status === 429) return { ok: false, status: 429, message: 'Rate limited' };
    if (!res.ok) return { ok: false, status: res.status, message: `HTTP ${res.status}` };
    return { ok: true, status: res.status };
  } catch (e: any) {
    return { ok: false, status: 500, message: e?.message || 'Connection failed' };
  }
}

export function buildFirecrawlHeaders(): Record<string, string> {
  // Firecrawl's scrape({ headers }) expects standard headers
  return getAuthHeaders();
}

export const confluenceEnv = {
  BASE_URL,
  API_TOKEN,
  USERNAME
};


