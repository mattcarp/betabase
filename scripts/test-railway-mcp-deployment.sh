#!/usr/bin/env bash

set -euo pipefail

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")"/.. && pwd)"
RESULTS_DIR="$PROJECT_ROOT/test-results"
mkdir -p "$RESULTS_DIR"

# Load environment variables if .env exists (preferred by project owner)
if [ -f "$PROJECT_ROOT/.env" ]; then
  set -a
  # shellcheck disable=SC1091
  source "$PROJECT_ROOT/.env"
  set +a
fi

BASE_URL="${AOMA_MCP_BASE_URL:-https://aoma-mesh-mcp.onrender.com}"
RPC_URL="$BASE_URL/rpc"
HEALTH_URL="$BASE_URL/health"
MCP_URL="$BASE_URL/mcp"
AUTH_HEADER=""

if [ -n "${AOMA_MCP_API_KEY:-}" ]; then
  AUTH_HEADER="Authorization: Bearer ${AOMA_MCP_API_KEY}"
fi

ORIGIN_HEADER=""
if [ -n "${AOMA_MCP_ORIGIN:-}" ]; then
  ORIGIN_HEADER="Origin: ${AOMA_MCP_ORIGIN}"
fi

REPORT_JSON="$RESULTS_DIR/render-mcp-deployment-report.json"
REPORT_TXT="$RESULTS_DIR/render-mcp-deployment-report.txt"
TMP_RESP="$(mktemp)"

cleanup() {
  rm -f "$TMP_RESP" || true
}
trap cleanup EXIT

require() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1" >&2
    exit 1
  fi
}

require curl
require jq

# Cross-platform millisecond clock
now_ms() {
  if command -v python3 >/dev/null 2>&1; then
    python3 - <<'PY'
import time
print(int(time.time()*1000))
PY
  else
    echo $(( $(date +%s) * 1000 ))
  fi
}

echo "Running Render MCP deployment tests against: $BASE_URL"
echo "Writing report to: $REPORT_JSON"

pass_count=0
fail_count=0

record_metric() {
  local name="$1"; shift
  local status="$1"; shift
  local duration_ms="$1"; shift
  jq -n --arg name "$name" --arg status "$status" --argjson duration_ms "$duration_ms" '{name: $name, status: $status, duration_ms: $duration_ms}'
}

append_result() {
  local entry="$1"
  if [ ! -f "$REPORT_JSON" ]; then
    echo "[]" > "$REPORT_JSON"
  fi
  tmp_file="$(mktemp)"
  jq ". + [ $entry ]" "$REPORT_JSON" > "$tmp_file" && mv "$tmp_file" "$REPORT_JSON"
}

run_curl_json() {
  local name="$1"; shift
  local url="$1"; shift
  local data="$1"; shift

  local start end http_code time_total_ms
  start=$(now_ms)
  http_code=$(curl -sS -o "$TMP_RESP" -w "%{http_code}" -H "Content-Type: application/json" ${AUTH_HEADER:+-H "$AUTH_HEADER"} ${ORIGIN_HEADER:+-H "$ORIGIN_HEADER"} -X POST "$url" --data "$data" || true)
  end=$(now_ms)
  time_total_ms=$((end - start))

  if [ "$http_code" = "200" ]; then
    append_result "$(record_metric "$name" PASS "$time_total_ms")"
    echo "PASS: $name (${time_total_ms}ms)"
    pass_count=$((pass_count+1))
    return 0
  else
    append_result "$(record_metric "$name" FAIL "$time_total_ms")"
    echo "FAIL: $name (HTTP $http_code, ${time_total_ms}ms)"
    if [ -s "$TMP_RESP" ]; then
      echo "Response:" >&2
      cat "$TMP_RESP" >&2 || true
    fi
    fail_count=$((fail_count+1))
    return 1
  fi
}

run_curl_get() {
  local name="$1"; shift
  local url="$1"; shift

  local start end http_code time_total_ms
  start=$(now_ms)
  http_code=$(curl -sS -o "$TMP_RESP" -w "%{http_code}" ${AUTH_HEADER:+-H "$AUTH_HEADER"} ${ORIGIN_HEADER:+-H "$ORIGIN_HEADER"} -X GET "$url" || true)
  end=$(now_ms)
  time_total_ms=$((end - start))

  if [[ "$http_code" =~ ^2 ]]; then
    append_result "$(record_metric "$name" PASS "$time_total_ms")"
    echo "PASS: $name (${time_total_ms}ms)"
    pass_count=$((pass_count+1))
    return 0
  else
    append_result "$(record_metric "$name" FAIL "$time_total_ms")"
    echo "FAIL: $name (HTTP $http_code, ${time_total_ms}ms)"
    if [ -s "$TMP_RESP" ]; then
      echo "Response:" >&2
      cat "$TMP_RESP" >&2 || true
    fi
    fail_count=$((fail_count+1))
    return 1
  fi
}

jsonrpc() {
  local id="$1"; shift
  local method="$1"; shift
  local params_json="$1"; shift
  jq -n --arg method "$method" --argjson id "$id" --argjson params "$params_json" '{jsonrpc:"2.0", id:$id, method:$method, params:$params}'
}

echo "\n== Render Server Health Tests =="
run_curl_get "health:GET $HEALTH_URL" "$HEALTH_URL" || true

echo "\n== MCP Protocol: tools/list =="
run_curl_json "rpc:tools/list" "$RPC_URL" "$(jsonrpc 1 tools/list '{}')" || true

if [ -s "$TMP_RESP" ]; then
  tools=$(jq -r '.result.tools[]?.name' "$TMP_RESP" 2>/dev/null || true)
  if [ -n "$tools" ]; then
    echo "Available tools:" $tools
  fi
fi

echo "\n== MCP Protocol: tools/call get_system_health =="
run_curl_json "rpc:tools/call get_system_health" "$RPC_URL" "$(jsonrpc 2 tools/call '{"name":"get_system_health","arguments":{}}')" || true

echo "\n== AOMA-Specific: tools/call query_aoma_knowledge =="
run_curl_json "rpc:tools/call query_aoma_knowledge" "$RPC_URL" "$(jsonrpc 3 tools/call '{"name":"query_aoma_knowledge","arguments":{"query":"What is USM?","strategy":"focused"}}')" || true

echo "\n== Concurrency Test: get_system_health x5 =="
concurrent=5
pids=()
for i in $(seq 1 $concurrent); do
  ( run_curl_json "rpc:tools/call get_system_health#$i" "$RPC_URL" "$(jsonrpc $((100+i)) tools/call '{"name":"get_system_health","arguments":{}}')" ) &
  pids+=("$!")
done

for pid in "${pids[@]}"; do
  wait "$pid" || true
done

echo "\n== CORS/Security Headers Check (HEAD /health) =="
headers_tmp="$(mktemp)"
curl -sS -D "$headers_tmp" -o /dev/null -X GET "$HEALTH_URL" || true
origin_hdr=$(grep -i "^access-control-allow-origin:" "$headers_tmp" || true)
security_hdrs=$(grep -iE "^(x-frame-options|content-security-policy|strict-transport-security):" "$headers_tmp" || true)
rm -f "$headers_tmp"
if [ -n "$origin_hdr" ]; then
  echo "PASS: CORS header present: $origin_hdr"; pass_count=$((pass_count+1))
else
  echo "WARN: No Access-Control-Allow-Origin header detected"; fail_count=$((fail_count+1))
fi
if [ -n "$security_hdrs" ]; then
  echo "INFO: Security headers:\n$security_hdrs"
fi

echo "\nSummary: $pass_count passed, $fail_count failed"
{
  echo "Render MCP Deployment Test Report"
  echo "Base URL: $BASE_URL"
  echo "RPC URL:  $RPC_URL"
  echo "Health:   $HEALTH_URL"
  echo "MCP:      $MCP_URL"
  echo "Passed:   $pass_count"
  echo "Failed:   $fail_count"
} > "$REPORT_TXT"

echo "Detailed JSON report at: $REPORT_JSON"
echo "Text summary at: $REPORT_TXT"

exit $([ "$fail_count" -eq 0 ] && echo 0 || echo 1)


