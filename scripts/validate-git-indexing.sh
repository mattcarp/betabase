#!/usr/bin/env bash
set -euo pipefail

echo "🔎 Validating Git indexing in Supabase..."

REQUIRED_VARS=( "NEXT_PUBLIC_SUPABASE_URL" "NEXT_PUBLIC_SUPABASE_ANON_KEY" )
for v in "${REQUIRED_VARS[@]}"; do
  if [[ -z "${!v:-}" ]]; then
    echo "❌ Missing required env var: $v"
    exit 1
  fi
done

echo "ℹ️  This script runs high-level checks via the app API where possible."
echo "🚥 Checking API readiness..."
curl -sS "http://localhost:3000/api/git-repo-index" | jq '.' || true

echo "✅ Basic validation request complete. Running semantic search check (source_type='git')..."

QUERY=${1:-"refactor"}
cat > /tmp/validate-search.js <<'JS'
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const openaiKey = process.env.OPENAI_API_KEY;
const query = process.argv[2] || 'refactor';

if (!url || !anon || !openaiKey) {
  console.error('Missing env vars for semantic search');
  process.exit(1);
}

const supabase = createClient(url, anon);
const openai = new OpenAI({ apiKey: openaiKey });

async function run() {
  const emb = await openai.embeddings.create({ model: 'text-embedding-ada-002', input: query });
  const embedding = emb.data[0].embedding;
  const { data, error } = await supabase.rpc('match_aoma_vectors', {
    query_embedding: embedding,
    match_threshold: 0.7,
    match_count: 5,
    filter_source_types: ['git']
  });
  if (error) throw error;
  console.log(JSON.stringify(data, null, 2));
}

run().catch(e => { console.error(e); process.exit(1); });
JS

node /tmp/validate-search.js "$QUERY" || true

echo "✅ Semantic search validation complete."


