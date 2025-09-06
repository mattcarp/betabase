#!/bin/bash

# SIAM Test Scripts Update
# This script updates package.json with the new organized test structure

cat << 'EOF'
📋 Adding organized test scripts to package.json...

Add these scripts to your package.json "scripts" section:

    "test": "npm run test:unit",
    "test:unit": "jest --testMatch='**/tests/01-unit/**/*.test.ts'",
    "test:integration": "playwright test --project=integration",
    "test:e2e": "playwright test --project=e2e",
    "test:smoke": "playwright test --grep @smoke",
    "test:regression": "playwright test --grep @regression",
    "test:visual": "playwright test --project=visual",
    "test:all": "npm run test:unit && npm run test:integration && npm run test:e2e",
    "test:feature": "playwright test --grep",
    "test:changed": "jest -o",
    "test:failed": "playwright test --last-failed",
    "test:ui": "playwright test --ui",
    "test:debug": "playwright test --debug",
    "test:headed": "playwright test --headed",
    "test:report": "playwright show-report"

These provide:
- Layer-specific execution (unit/integration/e2e)
- Tag-based execution (smoke/regression)
- Smart test selection (changed/failed)
- Debugging support (ui/debug/headed)

EOF