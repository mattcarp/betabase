#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3000}"

echo "[Sony Validate] Checking Confluence access..."
curl -sS -X POST "$BASE_URL/api/confluence-crawl" -H 'Content-Type: application/json' -d '{"spaces":["AOMA"],"maxPagesPerSpace":1}' | jq -r '.' || {
  echo "Confluence validation failed" >&2; exit 1; }

echo "[Sony Validate] Checking JIRA access..."
curl -sS -X POST "$BASE_URL/api/sony-music-jira-crawl" -H 'Content-Type: application/json' -d '{"projects":["AOMA"],"maxResults":5}' | jq -r '.' || {
  echo "JIRA validation failed" >&2; exit 1; }

echo "[Sony Validate] Quick semantic search query placeholder (requires app-side endpoint)"
echo "OK"


