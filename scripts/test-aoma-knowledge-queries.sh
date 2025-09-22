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

REPORT_JSON="$RESULTS_DIR/test-aoma-knowledge-queries.json"
TMP_RESP="$(mktemp)"
trap 'rm -f "$TMP_RESP"' EXIT

require() { command -v "$1" >/dev/null 2>&1 || { echo "Missing $1"; exit 1; }; }
require curl
require jq

jsonrpc() { jq -n --arg method "$2" --argjson id "$1" --argjson params "$3" '{jsonrpc:"2.0", id:$id, method:$method, params:$params}'; }

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

run_query(){
  local query="$1"; local strategy="$2"; local id="$3"
  local code; local start; local end; local ms
  start=$(now_ms)
  local args_json
  args_json=$(jq -n --arg query "$query" --arg strategy "$strategy" '{query:$query, strategy:$strategy}')
  local payload
  payload=$(build_call_payload "$id" "query_aoma_knowledge" "$args_json")
  code=$(curl -sS -o "$TMP_RESP" -w "%{http_code}" -H "Content-Type: application/json" ${AUTH_HEADER:+-H "$AUTH_HEADER"} ${ORIGIN_HEADER:+-H "$ORIGIN_HEADER"} \
    -X POST "$RPC_URL" --data "$payload" || true)
  end=$(now_ms)
  ms=$((end-start))
  local status="FAIL"
  local responseSummary=""
  if [ "$code" = "200" ] && jq -e '.result' "$TMP_RESP" >/dev/null 2>&1; then
    status="PASS"
    responseSummary=$(jq -r '.result.output // .result // .' "$TMP_RESP" 2>/dev/null | head -c 400 | tr '\n' ' ')
  fi
  jq -n --arg query "$query" --arg strategy "$strategy" --arg status "$status" --argjson duration_ms "$ms" \
     --argjson raw "$(cat "$TMP_RESP" 2>/dev/null | jq -Rs .)" '{query:$query,strategy:$strategy,status:$status,duration_ms:$duration_ms,raw:$raw}'
}

echo "[]" > "$REPORT_JSON"
append(){ local tmp="$(mktemp)"; jq ". + [ $1 ]" "$REPORT_JSON" > "$tmp" && mv "$tmp" "$REPORT_JSON"; }

declare -a queries=(
  'What is AOMA?|focused'
  'USM overview|focused'
  'Sony Music architecture|comprehensive'
  'How does AOMA integrate with Confluence?|comprehensive'
  'Explain the application structure and DOM analysis approach|rapid'
)

id=100
for spec in "${queries[@]}"; do
  q="${spec%%|*}"; s="${spec#*|}"
  echo "Testing: '$q' [strategy=$s]"
  append "$(run_query "$q" "$s" "$id")"
  id=$((id+1))
done

echo "Report written to: $REPORT_JSON"

