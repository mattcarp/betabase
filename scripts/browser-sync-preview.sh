#!/bin/bash

# Browser-Sync Live Preview
# Professional auto-refresh with device syncing

echo "🚀 Starting Browser-Sync Preview"
echo "================================"

# Check if browser-sync is installed
if ! command -v browser-sync &> /dev/null; then
    echo "📦 Installing browser-sync..."
    npm install -g browser-sync
fi

# Start browser-sync proxy to Next.js dev server
browser-sync start \
    --proxy "localhost:3000" \
    --port 3001 \
    --ui-port 3002 \
    --files "src/**/*.tsx, src/**/*.ts, app/**/*.tsx, app/**/*.ts" \
    --no-notify \
    --open

# Browser-sync will:
# - Auto-refresh on file changes
# - Sync scrolling across devices
# - Show at http://localhost:3001
# - UI controls at http://localhost:3002