#!/bin/bash
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

fail(){ echo -e "${RED}✗ $1${NC}"; exit 1; }
warn(){ echo -e "${YELLOW}! $1${NC}"; }
pass(){ echo -e "${GREEN}✓ $1${NC}"; }

AOMA_STAGE_URL="${AOMA_STAGE_URL:-https://aoma-stage.smcdp-de.net}"
AOMA_STAGE_HOST=$(python3 - <<PY
from urllib.parse import urlparse
import os
u = os.environ.get('AOMA_STAGE_URL','https://aoma-stage.smcdp-de.net')
print(urlparse(u).hostname or 'aoma-stage.smcdp-de.net')
PY
)

echo "Checking VPN and AOMA connectivity..."

echo "Stage host: $AOMA_STAGE_HOST"

echo "-- DNS Resolution --"
if command -v dig >/dev/null 2>&1; then
  dig +short "$AOMA_STAGE_HOST" || true
elif command -v nslookup >/dev/null 2>&1; then
  nslookup "$AOMA_STAGE_HOST" || true
else
  warn "No dig/nslookup available; skipping DNS detail"
fi

echo "-- VPN Heuristics --"
# Heuristic: check for known corporate VPN interfaces or routes
if command -v scutil >/dev/null 2>&1; then
  VPN_STATUS=$(scutil --nc list | grep -Ei 'connected.*(vpn|pulse|globalprotect|anyconnect)' || true)
  if [[ -n "$VPN_STATUS" ]]; then
    pass "Detected an active VPN profile: $VPN_STATUS"
  else
    warn "No active VPN connection detected by scutil."
  fi
fi

if command -v ifconfig >/dev/null 2>&1; then
  if ifconfig | grep -E "utun[0-9]" >/dev/null 2>&1; then
    pass "utun interface present (likely VPN tunnel)."
  else
    warn "No utun interfaces found. You may not be on VPN."
  fi
fi

echo "-- Reachability --"
if command -v curl >/dev/null 2>&1; then
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -m 5 "https://$AOMA_STAGE_HOST") || true
  if [[ "$HTTP_CODE" == "200" || "$HTTP_CODE" == "302" || "$HTTP_CODE" == "401" || "$HTTP_CODE" == "403" ]]; then
    pass "Host reachable (HTTP $HTTP_CODE)."
  else
    warn "Host not reachable or blocked (HTTP $HTTP_CODE). Likely off VPN."
  fi
else
  warn "curl not available; skipping reachability"
fi

echo "Done."


