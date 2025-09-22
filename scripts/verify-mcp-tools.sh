#!/usr/bin/env bash

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")"/.. && pwd)"
RESULTS_DIR="$PROJECT_ROOT/test-results"
mkdir -p "$RESULTS_DIR"

if [ -f "$PROJECT_ROOT/.env" ]; then
  set -a
  # shellcheck disable=SC1091
  source "$PROJECT_ROOT/.env"
  set +a
fi

BASE_URL="${AOMA_MCP_BASE_URL:-https://aoma-mesh-mcp.onrender.com}"
RPC_URL="$BASE_URL/rpc"
AUTH_HEADER=""
if [ -n "${AOMA_MCP_API_KEY:-}" ]; then
  AUTH_HEADER="Authorization: Bearer ${AOMA_MCP_API_KEY}"
fi
ORIGIN_HEADER=""
if [ -n "${AOMA_MCP_ORIGIN:-}" ]; then
  ORIGIN_HEADER="Origin: ${AOMA_MCP_ORIGIN}"
fi

REPORT_JSON="$RESULTS_DIR/verify-mcp-tools-report.json"
TMP_RESP="$(mktemp)"
trap 'rm -f "$TMP_RESP"' EXIT

require() { command -v "$1" >/dev/null 2>&1 || { echo "Missing $1"; exit 1; }; }
require curl
require jq

jsonrpc() { jq -n --arg method "$2" --argjson id "$1" --argjson params "$3" '{jsonrpc:"2.0", id:$id, method:$method, params:$params}'; }

# Build tools/call payload safely with jq
build_call_payload(){
  local id="$1"; local name="$2"; local args_json="$3"
  jq -n --argjson id "$id" --arg name "$name" --argjson args "$args_json" '{jsonrpc:"2.0", id:$id, method:"tools/call", params:{name:$name, arguments:$args}}'
}

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

declare -a tool_tests=(
  'query_aoma_knowledge|{"query":"What is USM?","strategy":"focused"}'
  'query_aoma_knowledge|{"query":"AOMA architecture","strategy":"comprehensive"}'
  'get_server_capabilities|{}'
  'get_system_health|{}'
  'search_git_commits|{"query":"AOMA", "limit":3}'
  'search_code_files|{"query":"aoma", "limit":3}'
  'analyze_development_context|{"context":"Next.js app router patterns"}'
)

echo "Listing tools from $RPC_URL"
curl -sS -H "Content-Type: application/json" ${AUTH_HEADER:+-H "$AUTH_HEADER"} ${ORIGIN_HEADER:+-H "$ORIGIN_HEADER"} \
  -X POST "$RPC_URL" --data "$(jsonrpc 1 tools/list '{}')" | tee "$TMP_RESP" >/dev/null

echo "\nAvailable tools:"
jq -r '.result.tools[]? | "- " + (.name // "unknown") + ": " + (.description // "")' "$TMP_RESP" || true

echo "[]" > "$REPORT_JSON"

append_report(){
  local entry="$1"; local tmp="$(mktemp)"; jq ". + [ $entry ]" "$REPORT_JSON" > "$tmp" && mv "$tmp" "$REPORT_JSON"
}

run_tool(){
  local name="$1"; local args_json="$2"; local id="$3"
  local start end code ms
  start=$(now_ms)
  local payload
  payload=$(build_call_payload "$id" "$name" "$args_json")
  code=$(curl -sS -o "$TMP_RESP" -w "%{http_code}" -H "Content-Type: application/json" ${AUTH_HEADER:+-H "$AUTH_HEADER"} ${ORIGIN_HEADER:+-H "$ORIGIN_HEADER"} \
    -X POST "$RPC_URL" --data "$payload" || true)
  end=$(now_ms)
  ms=$((end-start))
  if [ "$code" = "200" ] && jq -e '.result' "$TMP_RESP" >/dev/null 2>&1; then
    echo "PASS: $name (${ms}ms)"
    append_report "$(jq -n --arg name "$name" --arg status PASS --argjson duration_ms "$ms" --argjson response "$(cat "$TMP_RESP")" '{name:$name,status:$status,duration_ms:$duration_ms,response:$response}')"
  else
    echo "FAIL: $name (HTTP $code, ${ms}ms)"
    append_report "$(jq -n --arg name "$name" --arg status FAIL --argjson duration_ms "$ms" --arg raw "$(cat "$TMP_RESP" | jq -Rs .)" '{name:$name,status:$status,duration_ms:$duration_ms,raw:$raw}')"
  fi
}

echo "\nRunning individual tool tests..."
idx=10
for spec in "${tool_tests[@]}"; do
  name="${spec%%|*}"
  args="${spec#*|}"
  run_tool "$name" "$args" "$idx"
  idx=$((idx+1))
done

echo "Detailed report: $REPORT_JSON"

