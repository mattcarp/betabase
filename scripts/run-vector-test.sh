#!/bin/bash
# Load environment and run vector store test

cd "$(dirname "$0")/.."

# Load environment variables
if [ -f .env.local ]; then
  export $(grep -v '^#' .env.local | xargs)
fi

# Run the test
node scripts/test-vector-store-api.js
