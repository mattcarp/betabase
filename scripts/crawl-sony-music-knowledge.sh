#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3000}"

echo "[Sony Crawl] Validating environment..."
req_vars=(CONFLUENCE_BASE_URL CONFLUENCE_API_TOKEN CONFLUENCE_USERNAME JIRA_BASE_URL JIRA_API_TOKEN JIRA_USERNAME AOMA_STAGE_URL)
missing=()
for v in "${req_vars[@]}"; do
  if [[ -z "${!v:-}" ]]; then
    missing+=("$v")
  fi
done
if (( ${#missing[@]} > 0 )); then
  echo "Missing required env vars: ${missing[*]}" >&2
  exit 1
fi

echo "[Sony Crawl] Starting Confluence crawl (Sony spaces)..."
curl -sS -X POST "$BASE_URL/api/confluence-crawl" \
  -H 'Content-Type: application/json' \
  -d '{"spaces":["AOMA","USM","TECH","API","RELEASE"],"maxPagesPerSpace":150}' | jq -r '.'

echo "[Sony Crawl] Starting JIRA crawl (AOMA, USM, TECH, API)..."
curl -sS -X POST "$BASE_URL/api/sony-music-jira-crawl" \
  -H 'Content-Type: application/json' \
  -d '{"projects":["AOMA","USM","TECH","API"],"maxResults":100}' | jq -r '.'

echo "[Sony Crawl] Kicking off AOMA staging Firecrawl sanity check..."
curl -sS -X POST "$BASE_URL/api/firecrawl-crawl" \
  -H 'Content-Type: application/json' \
  -d "{\"url\":\"${AOMA_STAGE_URL}\"}" | jq -r '.' || true

echo "[Sony Crawl] Complete."


