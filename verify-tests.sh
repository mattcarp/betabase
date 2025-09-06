#!/bin/bash

# SIAM Test Architecture Quick Verification
# Just checks if everything is ready after git pull

echo "🎯 SIAM Testing Quick Check"
echo "==========================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Quick check
echo "Checking test setup..."

# Verify key files exist
if [ -f "tests/__TESTING_RULES__.md" ] && [ -f "tests/__CLAUDE_CODE__.md" ]; then
    echo -e "${GREEN}✅ Test architecture files found${NC}"
else
    echo -e "${YELLOW}⚠️  Missing test files - try: git pull${NC}"
fi

# Check if test commands exist in package.json
if grep -q "test:smoke" package.json; then
    echo -e "${GREEN}✅ Test scripts configured${NC}"
    echo ""
    echo "Ready to test! Try:"
    echo "  npm run test:smoke    # Quick 2-min test"
    echo "  npm run test:unit     # Fast unit tests"
    echo "  npm run test:e2e      # Browser tests"
else
    echo -e "${YELLOW}⚠️  Add test scripts to package.json${NC}"
fi

echo ""
echo "That's it! Just run: npm install && npm run test:smoke"
