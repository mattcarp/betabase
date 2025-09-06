#!/bin/bash

# Live Preview Script for Second Monitor
# This script auto-refreshes the browser and optionally takes screenshots

echo "🖥️  Live Preview Monitor Started"
echo "================================"
echo "Browser should be on second monitor at http://localhost:3000"
echo ""

# Function to refresh browser
refresh_browser() {
    # Try to refresh Chrome first, then Safari
    osascript -e 'tell application "Google Chrome" to tell active tab of front window to reload' 2>/dev/null || \
    osascript -e 'tell application "Safari" to tell current tab of front window to do JavaScript "location.reload()"' 2>/dev/null || \
    echo "⚠️  Could not refresh browser - please refresh manually"
}

# Function to take screenshot (optional)
take_screenshot() {
    local timestamp=$(date +%H%M%S)
    screencapture -x /tmp/preview_$timestamp.png
    echo "📸 Screenshot saved: /tmp/preview_$timestamp.png"
}

# Watch for file changes
echo "👀 Watching for changes..."
echo "Press Ctrl+C to stop"
echo ""

# Use fswatch if available, otherwise use a simple loop
if command -v fswatch &> /dev/null; then
    # FSWatch method (more efficient)
    fswatch -o src/ app/ | while read change; do
        echo "🔄 Change detected at $(date +%H:%M:%S)"
        sleep 2  # Wait for Next.js to compile
        refresh_browser
        # Uncomment next line to auto-screenshot
        # take_screenshot
    done
else
    # Fallback method - check every 3 seconds
    LAST_MODIFIED=$(find src/ app/ -type f -name "*.tsx" -o -name "*.ts" -exec stat -f %m {} \; | sort -n | tail -1)
    
    while true; do
        CURRENT_MODIFIED=$(find src/ app/ -type f -name "*.tsx" -o -name "*.ts" -exec stat -f %m {} \; | sort -n | tail -1)
        
        if [ "$LAST_MODIFIED" != "$CURRENT_MODIFIED" ]; then
            echo "🔄 Change detected at $(date +%H:%M:%S)"
            LAST_MODIFIED=$CURRENT_MODIFIED
            sleep 2  # Wait for Next.js to compile
            refresh_browser
            # Uncomment next line to auto-screenshot
            # take_screenshot
        fi
        
        sleep 3
    done
fi