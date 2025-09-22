#!/bin/bash

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_ROOT"

echo "[Crawl] Starting AOMA staging crawl orchestration..."

required_env=("AAD_USERNAME" "AAD_PASSWORD" "AOMA_STAGE_URL" "FIRECRAWL_API_KEY")
missing=()
for var in "${required_env[@]}"; do
  if [[ -z "${!var:-}" ]]; then
    missing+=("$var")
  fi
done

if [[ ${#missing[@]} -gt 0 ]]; then
  echo "[Crawl][Error] Missing required env vars: ${missing[*]}" >&2
  exit 1
fi

echo "[Crawl] Running AOMA authentication script (MFA may be required)..."
node scripts/aoma-stage-login.js || {
  echo "[Crawl][Error] Authentication script failed." >&2
  exit 1
}

if [[ ! -f tmp/aoma-stage-storage.json ]]; then
  echo "[Crawl][Error] Expected storage state at tmp/aoma-stage-storage.json not found." >&2
  exit 1
fi

if [[ -x scripts/test-firecrawl-mcp-v2.sh ]]; then
  echo "[Crawl] Validating Firecrawl MCP v2 setup..."
  bash scripts/test-firecrawl-mcp-v2.sh || {
    echo "[Crawl][Warn] Firecrawl MCP v2 validation reported issues. Continuing anyway..."
  }
fi

# Load cookie header if present for forwarding to API
COOKIE=$(cat tmp/aoma-cookie.txt 2>/dev/null || true)
export COOKIE

PAGES=(
  "${AOMA_STAGE_URL%/}/"
  "${AOMA_STAGE_URL%/}/dashboard"
  "${AOMA_STAGE_URL%/}/assets"
  "${AOMA_STAGE_URL%/}/reports"
  "${AOMA_STAGE_URL%/}/users"
  "${AOMA_STAGE_URL%/}/search"
)

echo "[Crawl] Crawling ${#PAGES[@]} pages via internal API..."

SUCCESS=0
FAIL=0

for url in "${PAGES[@]}"; do
  echo "[Crawl] -> $url"
  # Use local Next.js route which forwards to Firecrawl v2
  resp=$(node -e "
    (async () => {
      const res = await fetch('http://localhost:3000/api/firecrawl-crawl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-forward-cookie': process.env.COOKIE || '${COOKIE}' },
        body: JSON.stringify({ url: '$url', options: { formats: ['markdown','html','summary'] } })
      });
      console.log(res.status);
      try { const j = await res.json(); console.log(JSON.stringify(j).slice(0, 2000)); } catch {}
    })().catch(err => { console.error(err.message); process.exit(2); })
  ") || {
    echo "[Crawl][Error] Request failed for $url" >&2
    ((FAIL++))
    continue
  }

  status=$(echo "$resp" | head -n1)
  if [[ "$status" =~ ^[23] ]]; then
    ((SUCCESS++))
  else
    ((FAIL++))
  fi

  sleep 1.5
done

echo "[Crawl] Completed. Success: $SUCCESS, Fail: $FAIL"

exit 0


