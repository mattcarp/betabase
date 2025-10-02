#!/bin/bash
cd "$(dirname "$0")/.."
if [ -f .env.local ]; then
  export $(grep -v '^#' .env.local | xargs)
fi
node scripts/test-direct-vector-performance.js
