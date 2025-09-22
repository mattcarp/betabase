#!/bin/bash

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_ROOT"

echo "[Validate] Checking crawl results in Supabase 'firecrawl_analysis'..."

required_env=("SUPABASE_URL" "SUPABASE_ANON_KEY")
missing=()
for var in "${required_env[@]}"; do
  if [[ -z "${!var:-}" ]]; then
    missing+=("$var")
  fi
done

if [[ ${#missing[@]} -gt 0 ]]; then
  echo "[Validate][Error] Missing env vars: ${missing[*]}" >&2
  exit 1
fi

node - <<'NODE'
(async () => {
  const fetch = (await import('node-fetch')).default;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;

  async function query(path, opts = {}) {
    const res = await fetch(`${url}/rest/v1/${path}`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        Prefer: 'count=exact',
        'Content-Type': 'application/json'
      },
      ...opts
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Supabase error ${res.status}: ${txt}`);
    }
    const data = await res.json();
    return { data, count: Number(res.headers.get('content-range')?.split('/')?.[1] || '0') };
  }

  const { data, count } = await query('firecrawl_analysis?select=url,page_title,crawled_at&order=crawled_at.desc');
  console.log(`[Validate] Total records: ${count}`);

  const requiredPages = [
    `${(process.env.AOMA_STAGE_URL || 'https://aoma-stage.smcdp-de.net').replace(/\/$/, '')}/`,
    `${(process.env.AOMA_STAGE_URL || 'https://aoma-stage.smcdp-de.net').replace(/\/$/, '')}/dashboard`,
    `${(process.env.AOMA_STAGE_URL || 'https://aoma-stage.smcdp-de.net').replace(/\/$/, '')}/assets`,
    `${(process.env.AOMA_STAGE_URL || 'https://aoma-stage.smcdp-de.net').replace(/\/$/, '')}/reports`,
    `${(process.env.AOMA_STAGE_URL || 'https://aoma-stage.smcdp-de.net').replace(/\/$/, '')}/users`,
    `${(process.env.AOMA_STAGE_URL || 'https://aoma-stage.smcdp-de.net').replace(/\/$/, '')}/search`
  ];

  const pagesSet = new Set((data || []).map(r => r.url));
  const missing = requiredPages.filter(u => !pagesSet.has(u));
  if (missing.length) {
    console.log('[Validate][Warn] Missing pages:', missing);
  } else {
    console.log('[Validate] All key pages present.');
  }

  const recent = (data || []).slice(0, 10);
  console.log('[Validate] Recent entries:');
  for (const r of recent) {
    console.log(`- ${r.url} | ${r.page_title || ''} | ${new Date(r.crawled_at).toISOString()}`);
  }
})().catch(err => { console.error('[Validate][Error]', err.message); process.exit(1); });
NODE

echo "[Validate] Done."


