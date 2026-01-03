#!/bin/bash
# Start Knowledge API with Infisical secrets injection
# Used by PM2 to run the Knowledge API

cd "$(dirname "$0")/.."
exec infisical run --env=dev -- npx tsx src/knowledge-api/index.ts
