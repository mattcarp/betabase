#!/bin/bash

# Complete Visual UX/UI Audit Script
# Starts server if needed, runs all visual tests, captures screenshots, generates report

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SCREENSHOT_DIR="/tmp/siam-visual-audit"
PID_FILE="/tmp/siam-dev-server.pid"

echo "========================================="
echo "  SIAM/Betabase Visual UX/UI Audit"
echo "========================================="
echo ""

# Create screenshot directory
echo "Creating screenshot directory..."
mkdir -p "$SCREENSHOT_DIR"
rm -f "$SCREENSHOT_DIR"/*.png 2>/dev/null || true
rm -f "$SCREENSHOT_DIR"/*.json 2>/dev/null || true

# Function to check if server is running
check_server() {
  curl -s -f -o /dev/null http://localhost:3000/api/health
}

# Function to start development server
start_server() {
  echo "Starting development server..."
  cd "$PROJECT_ROOT"

  # Kill anything on port 3000
  lsof -ti:3000 | xargs kill -9 2>/dev/null || true
  sleep 2

  # Start server in background
  npm run dev > /tmp/siam-dev-server.log 2>&1 &
  echo $! > "$PID_FILE"

  echo "Waiting for server to start..."
  for i in {1..30}; do
    if check_server; then
      echo "Server is ready!"
      return 0
    fi
    sleep 2
  done

  echo "ERROR: Server failed to start"
  cat /tmp/siam-dev-server.log
  exit 1
}

# Function to stop development server
stop_server() {
  if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    echo "Stopping development server (PID: $PID)..."
    kill $PID 2>/dev/null || true
    rm -f "$PID_FILE"
  fi
  lsof -ti:3000 | xargs kill -9 2>/dev/null || true
}

# Cleanup on exit
trap stop_server EXIT

# Check if server is already running
if check_server; then
  echo "Server is already running at http://localhost:3000"
else
  start_server
fi

echo ""
echo "========================================="
echo "  Running Visual Audit Tests"
echo "========================================="
echo ""

cd "$PROJECT_ROOT"

# Run the visual audit tests
npx playwright test tests/visual/visual-ux-audit.spec.ts \
  --reporter=list \
  --output=/tmp/playwright-test-results

echo ""
echo "========================================="
echo "  Generating Analysis Report"
echo "========================================="
echo ""

# Count screenshots
SCREENSHOT_COUNT=$(ls -1 "$SCREENSHOT_DIR"/*.png 2>/dev/null | wc -l | tr -d ' ')

echo "Screenshots captured: $SCREENSHOT_COUNT"
echo "Screenshot directory: $SCREENSHOT_DIR"
echo ""

if [ -f "$SCREENSHOT_DIR/audit-report.json" ]; then
  echo "Audit report generated:"
  cat "$SCREENSHOT_DIR/audit-report.json" | head -50
  echo ""
fi

echo "========================================="
echo "  Audit Complete"
echo "========================================="
echo ""
echo "To view screenshots:"
echo "  open $SCREENSHOT_DIR"
echo ""
echo "To view full report:"
echo "  cat $SCREENSHOT_DIR/audit-report.json"
echo ""
