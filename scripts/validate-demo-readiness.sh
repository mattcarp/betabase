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

REPORT_JSON="$RESULTS_DIR/demo-readiness-report.json"
TMP_RESP="$(mktemp)"
trap 'rm -f "$TMP_RESP"' EXIT

require() { command -v "$1" >/dev/null 2>&1 || { echo "Missing $1"; exit 1; }; }
require bash
require jq
require curl

jsonrpc() { jq -n --arg method "$2" --argjson id "$1" --argjson params "$3" '{jsonrpc:"2.0", id:$id, method:$method, params:$params}'; }

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

echo "[]" > "$REPORT_JSON"
append(){ local tmp="$(mktemp)"; jq ". + [ $1 ]" "$REPORT_JSON" > "$tmp" && mv "$tmp" "$REPORT_JSON"; }

check() {
  local name="$1"; shift
  echo "Checking: $name"
  local start end ms code
  start=$(now_ms)
  set +e
  "$@" >/dev/null 2>&1
  local status=$?
  set -e
  end=$(now_ms)
  ms=$((end-start))
  if [ $status -eq 0 ]; then
    append "$(jq -n --arg name "$name" --arg status PASS --argjson duration_ms "$ms" '{name:$name,status:$status,duration_ms:$duration_ms}')"
    echo "PASS: $name (${ms}ms)"
  else
    append "$(jq -n --arg name "$name" --arg status FAIL --argjson duration_ms "$ms" '{name:$name,status:$status,duration_ms:$duration_ms}')"
    echo "FAIL: $name (${ms}ms)"
  fi
}

# 1) Health
check "Render health endpoint" curl -sSf "$BASE_URL/health"

# 2) Tools list
check "MCP tools/list" curl -sSf -H "Content-Type: application/json" ${AUTH_HEADER:+-H "$AUTH_HEADER"} ${ORIGIN_HEADER:+-H "$ORIGIN_HEADER"} \
  -X POST "$RPC_URL" --data "$(jsonrpc 1 tools/list '{}')"

# 3) Critical tools
critical_tools=(
  'get_system_health|{}'
  'get_server_capabilities|{}'
  'query_aoma_knowledge|{"query":"What is AOMA?","strategy":"focused"}'
  'query_aoma_knowledge|{"query":"USM overview","strategy":"focused"}'
  'query_aoma_knowledge|{"query":"Sony Music architecture","strategy":"comprehensive"}'
)

id=10
for spec in "${critical_tools[@]}"; do
  name="${spec%%|*}"; args="${spec#*|}"
  check "Tool $name" bash -lc "curl -sSf -H 'Content-Type: application/json' ${AUTH_HEADER:+-H '$AUTH_HEADER'} ${ORIGIN_HEADER:+-H '$ORIGIN_HEADER'} -X POST '$RPC_URL' --data '$(jsonrpc "$id" tools/call "{\"name\":\"$name\",\"arguments\":$args}")' | jq -e .result >/dev/null"
  id=$((id+1))
done

# 4) Concurrency
echo "Testing concurrency..."
pids=()
for i in $(seq 1 5); do
  ( curl -sSf -H "Content-Type: application/json" ${AUTH_HEADER:+-H "$AUTH_HEADER"} ${ORIGIN_HEADER:+-H "$ORIGIN_HEADER"} -X POST "$RPC_URL" --data "$(jsonrpc $((100+i)) tools/call '{"name":"get_system_health","arguments":{}}')" >/dev/null ) &
  pids+=("$!")
done

ok=1
for pid in "${pids[@]}"; do
  if ! wait "$pid"; then ok=0; fi
done
if [ "$ok" -eq 1 ]; then
  append "$(jq -n '{name:"Concurrency: get_system_health x5",status:"PASS"}')"
  echo "PASS: Concurrency x5"
else
  append "$(jq -n '{name:"Concurrency: get_system_health x5",status:"FAIL"}')"
  echo "FAIL: Concurrency x5"
fi

# 5) Timeout behavior (simulate by large query)
check "Timeout behavior (large query)" bash -lc "curl -sS -m ${AOMA_MCP_TIMEOUT:-30} -H 'Content-Type: application/json' ${AUTH_HEADER:+-H '$AUTH_HEADER'} ${ORIGIN_HEADER:+-H '$ORIGIN_HEADER'} -X POST '$RPC_URL' --data '$(jsonrpc 200 tools/call '{"name":"query_aoma_knowledge","arguments":{"query":"Explain AOMA with exhaustive details and references and deep dive into all modules and services, APIs, schemas, pipeline orchestration, MCP bridges, and provide examples","strategy":"comprehensive"}}')' >/dev/null"

echo "Report saved to: $REPORT_JSON"

