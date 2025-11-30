#!/bin/bash

# Visual UX/UI Audit Runner
# Creates screenshot directory and runs visual audit tests

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SCREENSHOT_DIR="/tmp/siam-visual-audit"

echo "=== Visual UX/UI Audit ==="
echo "Project: $PROJECT_ROOT"
echo "Screenshot directory: $SCREENSHOT_DIR"
echo ""

# Create screenshot directory
echo "Creating screenshot directory..."
mkdir -p "$SCREENSHOT_DIR"
rm -f "$SCREENSHOT_DIR"/*.png 2>/dev/null || true

# Check if app is running
echo "Checking if app is running on http://localhost:3000..."
if ! curl -s -f -o /dev/null http://localhost:3000/api/health; then
  echo ""
  echo "ERROR: App is not running on http://localhost:3000"
  echo "Please start the app first with: npm run dev"
  echo ""
  exit 1
fi

echo "App is running!"
echo ""

# Run visual audit tests
echo "Running visual audit tests..."
cd "$PROJECT_ROOT"
npx playwright test tests/visual/visual-ux-audit.spec.ts --reporter=list

echo ""
echo "=== Audit Complete ==="
echo "Screenshots saved to: $SCREENSHOT_DIR"
echo ""
echo "To view screenshots:"
echo "  open $SCREENSHOT_DIR"
echo ""
