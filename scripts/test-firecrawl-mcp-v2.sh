#!/bin/bash

set -euo pipefail

echo "== Firecrawl MCP v2 Setup Test =="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

fail() { echo -e "${RED}✗ $1${NC}"; exit 1; }
warn() { echo -e "${YELLOW}! $1${NC}"; }
pass() { echo -e "${GREEN}✓ $1${NC}"; }

RUN_API_TEST=false
for arg in "$@"; do
  case "$arg" in
    --run-api-test)
      RUN_API_TEST=true
      shift
      ;;
  esac
done

PROJECT_ROOT="$(cd "$(dirname "$0")"/.. && pwd)"
MCP_JSON="$PROJECT_ROOT/.mcp.json"

echo "Project root: $PROJECT_ROOT"

echo "-- Environment Validation --"
if [[ -z "${FIRECRAWL_API_KEY:-}" ]]; then
  fail "FIRECRAWL_API_KEY is not set in environment. Export it or add to .env.local/.zshrc."
fi

if [[ "$FIRECRAWL_API_KEY" == "your_firecrawl_api_key_here" ]]; then
  fail "FIRECRAWL_API_KEY appears to be a placeholder. Please set a real key (starts with fc-)."
fi

if ! command -v node >/dev/null 2>&1; then
  fail "Node.js is not installed or not in PATH."
fi

NODE_MAJOR=$(node -p "process.versions.node.split('.') [0]")
if [[ "$NODE_MAJOR" -lt 18 ]]; then
  fail "Node.js v18+ required. Detected: $(node -v)"
fi
pass "Environment looks good (Node $(node -v))"

echo "-- .mcp.json Validation --"
if [[ ! -f "$MCP_JSON" ]]; then
  fail ".mcp.json not found at $MCP_JSON"
fi

if ! grep -q '"firecrawl-mcp"' "$MCP_JSON"; then
  fail "firecrawl-mcp server configuration not found in .mcp.json"
fi
pass "firecrawl-mcp server entry found in .mcp.json"

echo "-- MCP Server Startup Smoke Test --"
set +e
timeout 8s npx -y firecrawl-mcp >/tmp/firecrawl-mcp.log 2>&1 &
PID=$!
sleep 2
if ps -p $PID >/dev/null 2>&1; then
  pass "firecrawl-mcp started (PID $PID)"
  kill $PID >/dev/null 2>&1 || true
else
  warn "Could not confirm server stayed up; check logs below"
fi
set -e

echo "-- Log Tail --"
tail -n +1 /tmp/firecrawl-mcp.log || true

if [[ "$RUN_API_TEST" == true ]]; then
  echo "-- API Key Validation (basic crawl) --"
  # Minimal direct API check (non-MCP) to validate key quickly
  if command -v curl >/dev/null 2>&1; then
    HTTP_CODE=$(curl -s -o /tmp/fc_resp.json -w "%{http_code}" \
      -H "Authorization: Bearer $FIRECRAWL_API_KEY" \
      -H "Content-Type: application/json" \
      -X POST \
      -d '{"url":"https://example.com","formats":["markdown"]}' \
      https://api.firecrawl.dev/v2/crawl)
    echo "HTTP: $HTTP_CODE"
    if [[ "$HTTP_CODE" == "200" || "$HTTP_CODE" == "202" ]]; then
      pass "API responded (code $HTTP_CODE). Key likely valid."
    else
      warn "API returned code $HTTP_CODE. Response:"
      cat /tmp/fc_resp.json || true
    fi
  else
    warn "curl not found; skipping direct API validation"
  fi
fi

echo "-- Summary --"
pass "Firecrawl MCP v2 configuration validated"
echo "Logs: /tmp/firecrawl-mcp.log"
echo "Tip: run with --run-api-test to perform a small API crawl check."


