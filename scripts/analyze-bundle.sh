#!/bin/bash

# Bundle Analysis Script
# Analyzes Next.js bundle size and provides optimization recommendations

set -e

echo "🔍 Starting Bundle Analysis..."
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Run bundle analyzer
echo "📊 Running Next.js Bundle Analyzer..."
echo "This will generate an interactive HTML report."
echo ""

ANALYZE=true npm run build

# Step 2: Check for large dependencies
echo ""
echo "📦 Checking for large dependencies..."
echo ""

# Check if depcheck is installed
if ! command -v depcheck &> /dev/null; then
  echo "${YELLOW}Installing depcheck...${NC}"
  npm install -g depcheck
fi

echo ""
echo "🔍 Scanning for unused dependencies..."
depcheck --json > /tmp/depcheck-output.json 2>/dev/null || true

# Parse depcheck output
UNUSED_COUNT=$(node -e "
  try {
    const data = require('/tmp/depcheck-output.json');
    const unused = data.dependencies || [];
    console.log(unused.length);
  } catch (e) {
    console.log(0);
  }
")

if [ "$UNUSED_COUNT" -gt 0 ]; then
  echo "${YELLOW}Found $UNUSED_COUNT potentially unused dependencies${NC}"
  echo "Run 'depcheck' for details"
else
  echo "${GREEN}✓ No unused dependencies found${NC}"
fi

# Step 3: Analyze build output
echo ""
echo "📈 Bundle Size Summary:"
echo ""

if [ -f ".next/analyze/client.html" ]; then
  echo "${GREEN}✓ Bundle analysis complete!${NC}"
  echo ""
  echo "View the interactive report:"
  echo "  - Client bundle: .next/analyze/client.html"
  echo "  - Server bundle: .next/analyze/server.html"
  echo ""

  # Try to open the report in the default browser
  if command -v open &> /dev/null; then
    open .next/analyze/client.html
  elif command -v xdg-open &> /dev/null; then
    xdg-open .next/analyze/client.html
  else
    echo "Open .next/analyze/client.html in your browser to view the report"
  fi
else
  echo "${RED}✗ Bundle analysis failed${NC}"
  echo "Check the build output for errors"
fi

# Step 4: Performance recommendations
echo ""
echo "💡 Performance Optimization Tips:"
echo ""
echo "1. First Load JS should be < 250 KB"
echo "2. Each route chunk should be < 100 KB"
echo "3. Use dynamic imports for heavy components"
echo "4. Remove unused dependencies regularly"
echo "5. Check for duplicate dependencies"
echo ""
echo "📚 See docs/PERFORMANCE-OPTIMIZATION.md for detailed guide"
echo ""

# Cleanup
rm -f /tmp/depcheck-output.json

echo "✅ Bundle analysis complete!"
