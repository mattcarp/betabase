#!/usr/bin/env bash

# Optimize Supabase vector search performance for demo-quality response times
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
OUT_DIR="$ROOT_DIR/tmp/reports"
mkdir -p "$OUT_DIR"

echo "⚙️ Optimizing vector performance..."

NODE_SCRIPT=$(cat <<'NODE'
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !key) {
  console.error('Missing Supabase env vars');
  process.exit(1);
}

const sb = createClient(url, key);

function hr(ms) { return `${Math.round(ms)}ms`; }

async function timeRpc(args) {
  const t = Date.now();
  const { data, error } = await sb.rpc('match_aoma_vectors', args);
  return { ms: Date.now() - t, error, count: Array.isArray(data) ? data.length : 0 };
}

async function main() {
  const report = { startedAt: new Date().toISOString(), baseline: {}, thresholds: [], counts: [], notes: [] };

  // Baseline with tiny non-zero embedding
  const embedding = Array.from({ length: 1536 }, (_, i) => (i % 200 === 0 ? 0.001 : 0));

  // Threshold sweep
  for (const thr of [0.70, 0.75, 0.80]) {
    const r = await timeRpc({ query_embedding: embedding, match_threshold: thr, match_count: 8, filter_source_types: null });
    report.thresholds.push({ threshold: thr, timeMs: r.ms, count: r.count, ok: !r.error });
  }

  // Result count sweep
  for (const k of [5, 8, 12, 20]) {
    const r = await timeRpc({ query_embedding: embedding, match_threshold: 0.78, match_count: k, filter_source_types: null });
    report.counts.push({ k, timeMs: r.ms, count: r.count, ok: !r.error });
  }

  // Hints for DB-side optimization (manual actions in Supabase SQL editor)
  report.notes.push(
    'Verify HNSW index on siam_vectors.embedding (pgvector): CREATE INDEX IF NOT EXISTS ON siam_vectors USING hnsw (embedding vector_cosine_ops);'
  );
  report.notes.push('Ensure ANALYZE has been run recently: ANALYZE siam_vectors;');
  report.notes.push('Consider partial indexes on source_type if frequently filtered.');

  report.completedAt = new Date().toISOString();
  console.log(JSON.stringify(report, null, 2));
}

main().catch(e => { console.error(e); process.exit(1); });
NODE
)

node -e "$NODE_SCRIPT" | tee "$OUT_DIR/vector-optimization-report.json"
echo "✅ Vector optimization sweep complete: $OUT_DIR/vector-optimization-report.json"


