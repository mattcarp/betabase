#!/bin/bash
# init.sh - Long-Running Agent Initialization Script
# Based on Anthropic's "Effective Harnesses for Long-Running Agents" research
#
# This script ensures the development environment is ready for any agent session.
# It should be run at the start of every Coding Agent session.

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

echo "=== SIAM Long-Running Agent Environment Setup ==="
echo "Project root: $PROJECT_ROOT"
echo "Timestamp: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

# Kill any existing process on port 3000
echo "[1/5] Clearing port 3000..."
npx kill-port 3000 2>/dev/null || true
sleep 1

# Verify node_modules exist
echo "[2/5] Checking dependencies..."
if [ ! -d "node_modules" ]; then
    echo "  Installing dependencies..."
    npm install
else
    echo "  Dependencies OK"
fi

# Check environment variables
echo "[3/5] Checking environment..."
if [ ! -f ".env.local" ] && [ ! -f ".env" ]; then
    echo "  WARNING: No .env.local or .env file found"
else
    echo "  Environment files OK"
fi

# Start dev server in background
echo "[4/5] Starting development server..."
npm run dev &
DEV_PID=$!
echo "  Dev server PID: $DEV_PID"

# Wait for server to be ready
echo "[5/5] Waiting for server to be ready..."
MAX_WAIT=60
WAITED=0
while ! curl -s http://localhost:3000 > /dev/null 2>&1; do
    if [ $WAITED -ge $MAX_WAIT ]; then
        echo "  ERROR: Server failed to start within ${MAX_WAIT}s"
        kill $DEV_PID 2>/dev/null || true
        exit 1
    fi
    sleep 2
    WAITED=$((WAITED + 2))
    echo "  Waiting... (${WAITED}s)"
done

echo ""
echo "=== Environment Ready ==="
echo "Dev server running at http://localhost:3000"
echo "PID: $DEV_PID"
echo ""
echo "To stop: kill $DEV_PID"
