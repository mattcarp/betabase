#!/bin/bash
# Demo Validation Runner
# Run this before recording your demo to validate all features work

echo "========================================"
echo "  DEMO VALIDATION TESTS"
echo "  $(date)"
echo "========================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if server is running
echo "Checking if localhost:3000 is running..."
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Server is running${NC}"
else
    echo -e "${YELLOW}⚠ Server not detected. Starting dev server...${NC}"
    echo "Run 'npm run dev' in another terminal, then re-run this script."
    exit 1
fi

echo ""
echo "Running demo validation tests..."
echo ""

# Run Playwright tests
npx playwright test tests/e2e/demo-validation.spec.ts --reporter=list

# Capture exit code
EXIT_CODE=$?

echo ""
echo "========================================"
if [ $EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✓ ALL DEMO FEATURES VALIDATED${NC}"
    echo "Screenshots saved to: test-results/demo-screenshots/"
    echo "You're ready to record!"
else
    echo -e "${RED}✗ SOME DEMO FEATURES FAILED${NC}"
    echo ""
    echo "Review the failures above and fix before recording."
    echo "Screenshots of failures: test-results/demo-screenshots/"
    echo ""
    echo "To run with browser visible:"
    echo "  npx playwright test tests/e2e/demo-validation.spec.ts --headed"
    echo ""
    echo "To run a specific test:"
    echo "  npx playwright test tests/e2e/demo-validation.spec.ts -g 'test name' --headed"
fi
echo "========================================"

exit $EXIT_CODE
