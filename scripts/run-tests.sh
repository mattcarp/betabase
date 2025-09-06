#!/bin/bash

# Comprehensive Test Runner
# Intelligently runs the right tests for different scenarios

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Parse arguments
ENVIRONMENT=${1:-local}
SUITE=${2:-auto}
BROWSER=${3:-chromium}

echo -e "${BLUE}🧪 SIAM Intelligent Test Runner${NC}"
echo "================================"

# Function to check if local server is running
check_local_server() {
    curl -s http://localhost:3000 > /dev/null 2>&1
}

# Function to detect changed files
detect_changes() {
    # Get list of changed files since last commit
    CHANGED_FILES=$(git diff --name-only HEAD~1 2>/dev/null || echo "")
    
    if echo "$CHANGED_FILES" | grep -q "auth\|login\|magic"; then
        echo "auth"
    elif echo "$CHANGED_FILES" | grep -q "chat\|message\|conversation"; then
        echo "chat"
    elif echo "$CHANGED_FILES" | grep -q "upload\|file\|curate"; then
        echo "file-upload"
    elif echo "$CHANGED_FILES" | grep -q "\.css\|\.scss\|tailwind\|mac-design"; then
        echo "visual"
    else
        echo "smoke"
    fi
}

# Auto-detect which tests to run
if [ "$SUITE" = "auto" ]; then
    echo "Auto-detecting test suite based on changes..."
    SUITE=$(detect_changes)
    echo -e "${YELLOW}Detected changes in: $SUITE${NC}"
fi

# Determine environment
if [ "$ENVIRONMENT" = "local" ]; then
    if check_local_server; then
        echo -e "${GREEN}✅ Local server detected at http://localhost:3000${NC}"
    else
        echo -e "${YELLOW}Starting local development server...${NC}"
        NEXT_PUBLIC_BYPASS_AUTH=true npm run dev &
        DEV_PID=$!
        
        # Wait for server to start
        for i in {1..30}; do
            if check_local_server; then
                echo -e "${GREEN}✅ Server started${NC}"
                break
            fi
            sleep 1
        done
    fi
    CONFIG="tests/config/local.config.ts"
elif [ "$ENVIRONMENT" = "prod" ]; then
    echo -e "${BLUE}Testing against production: https://siam.onrender.com${NC}"
    CONFIG="tests/config/production.config.ts"
else
    echo -e "${RED}Unknown environment: $ENVIRONMENT${NC}"
    exit 1
fi

# Map suite names to test patterns
case "$SUITE" in
    "smoke")
        PATTERN="@smoke"
        TIMEOUT="2m"
        ;;
    "critical")
        PATTERN="@critical"
        TIMEOUT="5m"
        ;;
    "auth")
        PATTERN="tests/e2e/critical-paths/auth.spec.ts"
        TIMEOUT="5m"
        ;;
    "chat")
        PATTERN="tests/e2e/critical-paths/chat.spec.ts"
        TIMEOUT="5m"
        ;;
    "file-upload")
        PATTERN="tests/e2e/critical-paths/file-upload.spec.ts"
        TIMEOUT="5m"
        ;;
    "visual")
        PATTERN="@visual"
        TIMEOUT="10m"
        ;;
    "regression"|"full")
        PATTERN="@regression"
        TIMEOUT="15m"
        ;;
    "all")
        PATTERN=""
        TIMEOUT="30m"
        ;;
    *)
        echo -e "${RED}Unknown suite: $SUITE${NC}"
        echo "Available suites: smoke, critical, auth, chat, file-upload, visual, regression, all"
        exit 1
        ;;
esac

# Run tests
echo -e "\n${YELLOW}Running $SUITE tests on $BROWSER...${NC}"
echo "Timeout: $TIMEOUT"
echo "Pattern: ${PATTERN:-all tests}"
echo ""

# Build the test command
TEST_CMD="npx playwright test --config=$CONFIG --project=$BROWSER"
[ ! -z "$PATTERN" ] && TEST_CMD="$TEST_CMD --grep \"$PATTERN\""

# Execute tests
if eval $TEST_CMD; then
    RESULT="${GREEN}✅ Tests passed!${NC}"
    EXIT_CODE=0
else
    RESULT="${RED}❌ Tests failed!${NC}"
    EXIT_CODE=1
fi

# Clean up
[ ! -z "$DEV_PID" ] && kill $DEV_PID 2>/dev/null

# Show results
echo ""
echo "================================"
echo -e "$RESULT"
echo "================================"

# Open report if tests failed
if [ $EXIT_CODE -ne 0 ] && [ "$ENVIRONMENT" = "local" ]; then
    echo -e "${YELLOW}Opening test report...${NC}"
    npx playwright show-report &
fi

exit $EXIT_CODE