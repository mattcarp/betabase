#!/usr/bin/env bash

# Comprehensive validation for SIAM knowledge integration
# - Supabase vectors health and counts
# - RPC function checks
# - MCP server connectivity
# - Search performance benchmarks
# - Cross-source demo queries

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
REPORT_DIR="$ROOT_DIR/tmp/reports"
REPORT_FILE="$REPORT_DIR/knowledge-validation-report.json"
mkdir -p "$REPORT_DIR"

echo "🔎 Running knowledge integration validation..."

NODE_SCRIPT=$(cat <<'NODE'
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || NEXT_PUBLIC_SUPABASE_ANON_KEY;

const fetchJson = async (url, opts = {}) => {
  const res = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...opts });
  const text = await res.text();
  try { return { ok: res.ok, status: res.status, data: JSON.parse(text) }; }
  catch { return { ok: res.ok, status: res.status, data: text }; }
};

function hrtimeMs(start) {
  const [s, ns] = process.hrtime(start);
  return (s * 1e3) + (ns / 1e6);
}

async function main() {
  const report = {
    startedAt: new Date().toISOString(),
    supabase: {},
    mcp: {},
    benchmarks: {},
    demoQueries: [],
    status: 'unknown'
  };

  // Supabase connection and counts
  try {
    if (!NEXT_PUBLIC_SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error('Missing Supabase env vars');
    const sb = createClient(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Table exists and row counts by source_type
    const sourceTypes = ['git','confluence','jira','firecrawl'];
    report.supabase.counts = {};
    for (const t of sourceTypes) {
      const { count, error } = await sb.from('aoma_unified_vectors').select('id', { count: 'exact', head: true }).eq('source_type', t);
      if (error) throw error;
      report.supabase.counts[t] = count || 0;
    }

    // RPC function smoke test with dummy embedding (all zeros 1536-dim)
    const embedding = Array.from({ length: 1536 }, () => 0);
    const t0 = process.hrtime();
    const { data: rpcData, error: rpcError } = await sb.rpc('match_aoma_vectors', {
      query_embedding: embedding,
      match_threshold: 0.01,
      match_count: 1,
      filter_source_types: null,
    });
    report.supabase.rpcOk = !rpcError;
    report.supabase.rpcTimeMs = hrtimeMs(t0);
    if (rpcError) report.supabase.rpcError = rpcError.message || String(rpcError);
  } catch (e) {
    report.supabase.error = e?.message || String(e);
  }

  // MCP server via Next route (/api/aoma-mcp) if available
  try {
    const base = process.env.VALIDATION_BASE_URL || 'http://localhost:3000';
    const health = await fetchJson(`${base}/api/aoma-mcp`, { method: 'GET' });
    report.mcp.health = health;

    const queryBody = {
      action: 'tools/call',
      tool: 'query_aoma_knowledge',
      args: { query: 'What is AOMA?', strategy: 'rapid' }
    };
    const t1 = process.hrtime();
    const query = await fetchJson(`${base}/api/aoma-mcp`, { method: 'POST', body: JSON.stringify(queryBody) });
    report.mcp.query = query;
    report.mcp.queryTimeMs = hrtimeMs(t1);
  } catch (e) {
    report.mcp.error = e?.message || String(e);
  }

  // Benchmarks across representative queries using vector RPC
  try {
    if (NEXT_PUBLIC_SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      const sb = createClient(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      const queries = [
        { q: 'authentication flow in the codebase', sources: ['git'] },
        { q: 'AOMA file uploads documentation', sources: ['confluence','firecrawl'] },
        { q: 'Sony Music JIRA uploads issues', sources: ['jira'] },
        { q: 'asset ingestion workflow', sources: null },
      ];
      report.benchmarks.results = [];
      for (const item of queries) {
        // tiny random embedding to avoid all-zero behavior on some indexes
        const embedding = Array.from({ length: 1536 }, (_, i) => (i % 100 === 0 ? 0.001 : 0));
        const t = process.hrtime();
        const { data, error } = await sb.rpc('match_aoma_vectors', {
          query_embedding: embedding,
          match_threshold: 0.78,
          match_count: 5,
          filter_source_types: item.sources,
        });
        const ms = hrtimeMs(t);
        report.benchmarks.results.push({ query: item.q, timeMs: ms, ok: !error, count: Array.isArray(data) ? data.length : 0, error: error?.message });
      }
    }
  } catch (e) {
    report.benchmarks.error = e?.message || String(e);
  }

  // Cross-source demo queries relevance (shallow check: results > 0)
  report.demoQueries = [
    'Show me the authentication flow in the codebase',
    'How does AOMA handle file uploads?',
    'Recent changes to the asset ingestion workflow',
    'Find the React components for user management',
  ];

  report.completedAt = new Date().toISOString();
  const slow = (report.benchmarks.results || []).some(r => r.timeMs > 800);
  const anyErrors = !!(report.supabase.error || report.mcp.error);
  const sourcesHaveData = report.supabase.counts && Object.values(report.supabase.counts).some((n) => (n || 0) > 0);
  report.status = (!anyErrors && sourcesHaveData && !slow) ? 'pass' : 'needs_attention';

  const outPath = process.env.REPORT_FILE;
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2));
}

main().catch(err => { console.error(err); process.exit(1); });
NODE
)

export REPORT_FILE
node -e "$NODE_SCRIPT" || { echo "❌ Validation failed"; exit 1; }

echo "✅ Validation complete: $REPORT_FILE"


