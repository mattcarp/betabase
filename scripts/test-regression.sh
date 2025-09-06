#!/bin/bash

# Regression Testing Script
# Runs tests to catch regressions before deployment

set -e

echo "🧪 Starting Regression Test Suite"
echo "================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default environment
ENVIRONMENT=${1:-local}
TEST_SUITE=${2:-critical}

# Function to run tests and check results
run_test_suite() {
    local suite=$1
    local config=$2
    
    echo -e "\n${YELLOW}Running $suite tests...${NC}"
    
    if npm run test:${config}:${suite} 2>&1 | tee test-output.log; then
        echo -e "${GREEN}✅ $suite tests passed${NC}"
        return 0
    else
        echo -e "${RED}❌ $suite tests failed${NC}"
        return 1
    fi
}

# Check if we're testing locally or production
if [ "$ENVIRONMENT" = "local" ]; then
    echo "Testing against LOCAL environment (http://localhost:3000)"
    CONFIG="local"
    
    # Start dev server if not running
    if ! curl -s http://localhost:3000 > /dev/null; then
        echo "Starting local dev server..."
        NEXT_PUBLIC_BYPASS_AUTH=true npm run dev &
        DEV_PID=$!
        sleep 10  # Wait for server to start
    fi
else
    echo "Testing against PRODUCTION environment (https://siam.onrender.com)"
    CONFIG="prod"
fi

# Track test results
FAILED_TESTS=()
PASSED_TESTS=()

# Run smoke tests first (quick health check)
echo -e "\n${YELLOW}Phase 1: Smoke Tests (2 mins)${NC}"
if run_test_suite "smoke" "$CONFIG"; then
    PASSED_TESTS+=("smoke")
else
    FAILED_TESTS+=("smoke")
    echo -e "${RED}Smoke tests failed - stopping early${NC}"
    [ ! -z "$DEV_PID" ] && kill $DEV_PID
    exit 1
fi

# Run critical path tests
echo -e "\n${YELLOW}Phase 2: Critical Path Tests (5 mins)${NC}"
if run_test_suite "critical" "$CONFIG"; then
    PASSED_TESTS+=("critical")
else
    FAILED_TESTS+=("critical")
fi

# Run full regression suite only if requested
if [ "$TEST_SUITE" = "full" ] || [ "$TEST_SUITE" = "regression" ]; then
    echo -e "\n${YELLOW}Phase 3: Full Regression Suite (15 mins)${NC}"
    if run_test_suite "regression" "$CONFIG"; then
        PASSED_TESTS+=("regression")
    else
        FAILED_TESTS+=("regression")
    fi
fi

# Clean up dev server if we started it
[ ! -z "$DEV_PID" ] && kill $DEV_PID

# Generate summary
echo -e "\n================================"
echo "📊 Test Summary"
echo "================================"

if [ ${#PASSED_TESTS[@]} -gt 0 ]; then
    echo -e "${GREEN}Passed Suites:${NC}"
    for test in "${PASSED_TESTS[@]}"; do
        echo "  ✅ $test"
    done
fi

if [ ${#FAILED_TESTS[@]} -gt 0 ]; then
    echo -e "${RED}Failed Suites:${NC}"
    for test in "${FAILED_TESTS[@]}"; do
        echo "  ❌ $test"
    done
    
    echo -e "\n${RED}⚠️  REGRESSION DETECTED - Do not deploy!${NC}"
    echo "Review test-output.log for details"
    exit 1
else
    echo -e "\n${GREEN}✅ All tests passed - Safe to deploy!${NC}"
    exit 0
fi