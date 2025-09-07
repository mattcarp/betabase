#!/bin/bash

# Meta Test Runner - Test Dashboard testing itself!
# Based on SOTA-2025-Testing-Architecture.md

echo "🎭 META TESTING: Test Dashboard testing itself!"
echo "================================================"
echo ""

# Set environment for auth bypass in development
export NEXT_PUBLIC_BYPASS_AUTH=true
export PLAYWRIGHT_BASE_URL=http://localhost:3000

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Running comprehensive Test Dashboard tests...${NC}"
echo ""

# Run the tests with detailed reporting
npx playwright test tests/e2e/test-dashboard-complete.spec.ts \
  --project=chromium \
  --reporter=list \
  --timeout=60000

# Check test results
if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Test Dashboard tests passed!${NC}"
    echo ""
    echo "Next steps (from SOTA document):"
    echo "1. ✅ Multi-tenant testing is working (app_name field)"
    echo "2. 🎯 Add EvilCharts visualizations for managers"
    echo "3. 🤖 Implement Agentic AI testing"
    echo "4. 👥 Add HITL approval workflows"
else
    echo ""
    echo -e "${RED}❌ Some Test Dashboard tests failed${NC}"
    echo ""
    echo "Debug tips:"
    echo "1. Check if Test tab is fully implemented"
    echo "2. Verify all sub-components are mounted"
    echo "3. Check console for errors"
fi

echo ""
echo "To run with headed browser for debugging:"
echo "npx playwright test tests/e2e/test-dashboard-complete.spec.ts --headed"