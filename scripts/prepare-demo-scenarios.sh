#!/usr/bin/env bash

# Prepare compelling demo scenarios leveraging the knowledge search service
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
OUT_DIR="$ROOT_DIR/tmp/demo"
mkdir -p "$OUT_DIR"

echo "🎬 Preparing demo scenarios..."

SCENARIOS=(
  "Show me the authentication flow in the codebase"
  "How does AOMA handle file uploads?"
  "What are the recent changes to the asset ingestion workflow?"
  "Find the React components for user management"
  "Explain the USM integration workflow"
  "Common JIRA issues and their solutions"
)

NODE_SCRIPT=$(cat <<'NODE'
const fs = require('fs');
const path = require('path');
const { embed } = require('ai');
const { openai } = require('@ai-sdk/openai');
const { createClient } = require('@supabase/supabase-js');

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const outDir = process.env.OUT_DIR;
if (!url || !key) { console.error('Missing Supabase env vars'); process.exit(1); }

const sb = createClient(url, key);

async function search(q) {
  const model = openai.embedding('text-embedding-3-small');
  const { embeddings } = await embed({ model, value: q });
  const { data, error } = await sb.rpc('match_aoma_vectors', {
    query_embedding: embeddings[0].embedding,
    match_threshold: 0.78,
    match_count: 6,
    filter_source_types: null,
  });
  if (error) throw error;
  return (data || []).map((r, i) => ({
    idx: i + 1,
    source: r.source_type,
    url: r.metadata?.url || r.metadata?.link,
    preview: (r.content || '').slice(0, 400),
  }));
}

async function main() {
  const scenarios = JSON.parse(process.env.SCENARIOS);
  const results = [];
  for (const s of scenarios) {
    try {
      const t0 = Date.now();
      const items = await search(s);
      const ms = Date.now() - t0;
      results.push({ scenario: s, timeMs: ms, count: items.length, items });
    } catch (e) {
      results.push({ scenario: s, error: e?.message || String(e) });
    }
  }
  fs.writeFileSync(path.join(outDir, 'demo-scenarios.json'), JSON.stringify(results, null, 2));
}

main().catch(e => { console.error(e); process.exit(1); });
NODE
)

export OUT_DIR
export SCENARIOS_JSON=$(printf '%s' "${SCENARIOS[@]}" | jq -R . | jq -s .)
export SCENARIOS="$SCENARIOS_JSON"

node -e "$NODE_SCRIPT"

echo "✅ Demo scenarios prepared: $OUT_DIR/demo-scenarios.json"


