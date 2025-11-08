#!/bin/bash
set -euo pipefail

echo "[validate] Checking Supabase configuration..."
if [ -z "${NEXT_PUBLIC_SUPABASE_URL:-}" ] || [ -z "${SUPABASE_SERVICE_ROLE_KEY:-}" ]; then
  echo "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required" >&2
  exit 1
fi

JQ_BIN=$(command -v jq || true)
if [ -z "$JQ_BIN" ]; then
  echo "jq is required for JSON parsing" >&2
  exit 1
fi

echo "[validate] Counting confluence vectors via REST..."
URL="${NEXT_PUBLIC_SUPABASE_URL%/}/rest/v1/siam_vectors?source_type=eq.confluence&select=count"
COUNT=$(curl -s "$URL" -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" | jq -r '.[0].count // 0')
echo "Confluence vectors count: $COUNT"

echo "[validate] Sampling top 3 recent vectors..."
SAMPLE_URL="${NEXT_PUBLIC_SUPABASE_URL%/}/rest/v1/siam_vectors?source_type=eq.confluence&select=id,source_id,metadata,updated_at&order=updated_at.desc&limit=3"
curl -s "$SAMPLE_URL" -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" | jq '.'

echo "[validate] Semantic search smoke tests via local API (if available)..."
SEARCH_API="http://localhost:3000/api/search"
for q in "onboarding" "roadmap" "architecture"; do
  echo "- Query: $q"
  RESP=$(curl -s -G "$SEARCH_API" --data-urlencode "q=$q" 2>/dev/null || true)
  if [ -n "$RESP" ]; then echo "$RESP" | jq '.[0:3]' 2>/dev/null || echo "$RESP"; else echo "(skipped: API not reachable)"; fi
done

echo "[validate] Completed."


