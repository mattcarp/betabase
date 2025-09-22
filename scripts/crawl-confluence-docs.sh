#!/bin/bash
set -euo pipefail

echo "[confluence] Validating environment..."
REQUIRED_VARS=(CONFLUENCE_BASE_URL CONFLUENCE_API_TOKEN CONFLUENCE_USERNAME CONFLUENCE_SPACES)
MISSING=()
for v in "${REQUIRED_VARS[@]}"; do
  if [ -z "${!v:-}" ]; then MISSING+=("$v"); fi
done
if [ ${#MISSING[@]} -gt 0 ]; then
  echo "Missing env vars: ${MISSING[*]}" >&2
  exit 1
fi

BASE_URL="${CONFLUENCE_BASE_URL%/}"
AUTH=$(printf '%s:%s' "$CONFLUENCE_USERNAME" "$CONFLUENCE_API_TOKEN" | base64)

echo "[confluence] Testing auth to $BASE_URL..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "Authorization: Basic $AUTH" \
  -H "Accept: application/json" \
  "$BASE_URL/wiki/rest/api/space?limit=1")

if [ "$HTTP_STATUS" != "200" ]; then
  echo "Auth test failed with HTTP $HTTP_STATUS" >&2
  exit 1
fi
echo "[confluence] Auth OK"

SPACES_CSV="${CONFLUENCE_SPACES}" 
echo "[confluence] Triggering crawl for spaces: $SPACES_CSV"

URL="http://localhost:3000/api/confluence-crawl"
if [ -n "${NEXT_PUBLIC_APP_URL:-}" ]; then URL="${NEXT_PUBLIC_APP_URL%/}/api/confluence-crawl"; fi

RESP=$(curl -s -X POST "$URL" \
  -H 'Content-Type: application/json' \
  -d "{\"spaces\": [$(echo "$SPACES_CSV" | awk -F, '{for(i=1;i<=NF;i++){gsub(/^[ \t]+|[ \t]+$/,"",$i); printf (i>1?",":"") \"\"$i\"\"}}')]}" )

echo "$RESP" | jq . 2>/dev/null || echo "$RESP"
echo "[confluence] Crawl request completed. Review logs for ingestion metrics."


