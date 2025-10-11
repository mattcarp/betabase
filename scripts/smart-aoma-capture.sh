#!/bin/bash

# Smart AOMA Screenshot Capture
# Uses existing authenticated Safari session
# Intelligently handles menu navigation and page timing

set -e

# Color output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Configuration
SCREENSHOT_DIR="tmp/aoma-screenshots-$(date +%Y%m%d)"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="$SCREENSHOT_DIR/capture-log-${TIMESTAMP}.txt"

# Menu structure - page_key|url format
PAGES=(
    "engineering_archive-submission-tool|https://aoma-stage.smcdp-de.net/aoma-ui/submit-assets"
    "engineering_asset-submission-tool-lfv|https://aoma-stage.smcdp-de.net/aoma-ui/asset-submission-tool"
    "asset-admin_eom-message-sender|https://aoma-stage.smcdp-de.net/aoma-ui/eom-message-sender"
    "asset-admin_export-status|https://aoma-stage.smcdp-de.net/aoma-ui/export-status"
    "asset-admin_link-attempts|https://aoma-stage.smcdp-de.net/aoma-ui/link-attempts"
    "asset-admin_asset-upload-job-status|https://aoma-stage.smcdp-de.net/aoma-ui/asset-upload-job-status"
    "asset-admin_master-event-history|https://aoma-stage.smcdp-de.net/aoma-ui/master-event-history"
    "asset-admin_product-event-history|https://aoma-stage.smcdp-de.net/aoma-ui/product-event-history"
    "asset-admin_product-linking|https://aoma-stage.smcdp-de.net/aoma-ui/product-linking"
    "asset-admin_pseudo-video|https://aoma-stage.smcdp-de.net/aoma-ui/pseudo-video"
    "asset-admin_supply-chain-order|https://aoma-stage.smcdp-de.net/aoma-ui/supply-chain-order-management"
    "asset-admin_integration-manager|https://aoma-stage.smcdp-de.net/aoma-ui/integration-manager"
    "asset-admin_archive-export-status|https://aoma-stage.smcdp-de.net/aoma-ui/archive-export-status"
)

# Initialize
mkdir -p "$SCREENSHOT_DIR"
touch "$LOG_FILE"

log() {
    echo -e "${2:-$NC}$1${NC}" | tee -a "$LOG_FILE"
}

# Check if Safari is running
check_safari() {
    if ! pgrep -x "Safari" > /dev/null; then
        log "❌ Safari is not running!" "$RED"
        exit 1
    fi
    log "✅ Safari is running" "$GREEN"
}

# Check if logged into AOMA
check_aoma_session() {
    local current_url=$(osascript -e 'tell application "Safari" to get URL of front document' 2>/dev/null)

    if [[ $current_url == *"aoma-stage.smcdp-de.net"* ]]; then
        log "✅ AOMA session active" "$GREEN"
        log "   Current URL: $current_url" "$BLUE"
        return 0
    else
        log "⚠️  Not on AOMA site. Current URL: $current_url" "$YELLOW"
        log "   Attempting to navigate to AOMA..." "$BLUE"

        # Navigate to AOMA home
        osascript <<EOF
            tell application "Safari"
                activate
                set URL of front document to "https://aoma-stage.smcdp-de.net/"
            end tell
EOF

        sleep 5

        # Check again
        current_url=$(osascript -e 'tell application "Safari" to get URL of front document' 2>/dev/null)
        if [[ $current_url == *"Login"* ]] || [[ $current_url == *"login"* ]]; then
            log "❌ Session expired - login required" "$RED"
            log "   Please log in manually and run this script again" "$YELLOW"
            exit 1
        fi

        log "✅ Successfully navigated to AOMA" "$GREEN"
        return 0
    fi
}

# Smart page load detection
wait_for_page_load() {
    local url="$1"
    local max_wait=15
    local wait_time=0

    log "   ⏳ Waiting for page to load..." "$BLUE"

    # Initial wait
    sleep 3

    # Wait for document ready state
    while [ $wait_time -lt $max_wait ]; do
        local ready_state=$(osascript 2>/dev/null <<EOF
            tell application "Safari"
                try
                    do JavaScript "document.readyState" in front document
                end try
            end tell
EOF
        )

        if [[ "$ready_state" == "complete" ]]; then
            log "   ✅ Page loaded (readyState: complete)" "$GREEN"
            # Additional wait for dynamic content
            sleep 2
            return 0
        fi

        sleep 1
        ((wait_time++))
    done

    log "   ⚠️  Max wait time reached, proceeding anyway" "$YELLOW"
    sleep 2
    return 0
}

# Capture screenshot with retry
capture_screenshot() {
    local filename="$1"
    local filepath="$SCREENSHOT_DIR/${filename}.png"
    local max_retries=3
    local retry=0

    while [ $retry -lt $max_retries ]; do
        log "   📸 Capturing screenshot (attempt $((retry + 1))/$max_retries)..." "$BLUE"

        # Give user a moment to click Safari window if needed
        if [ $retry -eq 0 ]; then
            sleep 1
        fi

        screencapture -w -x -o "$filepath" 2>/dev/null

        if [ -f "$filepath" ]; then
            local filesize=$(ls -lh "$filepath" | awk '{print $5}')
            log "   ✅ Screenshot saved: ${filename}.png ($filesize)" "$GREEN"
            return 0
        fi

        ((retry++))
        sleep 2
    done

    log "   ❌ Failed to capture screenshot after $max_retries attempts" "$RED"
    return 1
}

# Navigate to page and capture
navigate_and_capture() {
    local entry="$1"
    local page_key=$(echo "$entry" | cut -d'|' -f1)
    local url=$(echo "$entry" | cut -d'|' -f2)
    local filename=$(echo "$page_key" | sed 's/.*_//g' | sed 's/-/_/g')

    log "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" "$BLUE"
    log "📄 $page_key" "$GREEN"
    log "   URL: $url" "$BLUE"

    # Navigate Safari
    osascript <<EOF
        tell application "Safari"
            activate
            set URL of front document to "$url"
        end tell
EOF

    # Wait for page load
    wait_for_page_load "$url"

    # Check if we got redirected to login
    local current_url=$(osascript -e 'tell application "Safari" to get URL of front document' 2>/dev/null)
    if [[ $current_url == *"Login"* ]] || [[ $current_url == *"login"* ]]; then
        log "   ⚠️  Redirected to login - session may have expired" "$YELLOW"
        return 1
    fi

    # Check for permission denied or error pages
    local page_title=$(osascript 2>/dev/null <<EOF
        tell application "Safari"
            try
                do JavaScript "document.title" in front document
            end try
        end tell
EOF
    )

    if [[ $page_title == *"Error"* ]] || [[ $page_title == *"Access Denied"* ]]; then
        log "   ⚠️  Page error or access denied: $page_title" "$YELLOW"
        log "   ⏭️  Skipping screenshot" "$YELLOW"
        return 2
    fi

    # Capture screenshot
    capture_screenshot "aoma-ui_${filename}"

    return $?
}

# Main execution
main() {
    log "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    log "${GREEN}🤖 Smart AOMA Screenshot Capture${NC}"
    log "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    log "📁 Output: $SCREENSHOT_DIR"
    log "📋 Log: $LOG_FILE"
    log ""

    # Pre-flight checks
    check_safari
    check_aoma_session

    log "\n${YELLOW}⚠️  IMPORTANT:${NC}"
    log "   • Safari must remain the active application"
    log "   • Do not click away during capture"
    log "   • Total pages to capture: ${#MENU_PAGES[@]}"
    log ""

    read -p "Press Enter to start automated capture..."

    # Statistics
    local total_pages=${#PAGES[@]}
    local captured=0
    local skipped=0
    local failed=0

    # Capture each page
    for entry in "${PAGES[@]}"; do
        if navigate_and_capture "$entry"; then
            ((captured++))
        else
            local exit_code=$?
            if [ $exit_code -eq 2 ]; then
                ((skipped++))
            else
                ((failed++))
            fi
        fi

        # Brief pause between pages
        sleep 1
    done

    # Generate manifest
    log "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    log "${GREEN}📊 Capture Summary${NC}"
    log "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    log "   Total pages: $total_pages"
    log "   ✅ Captured: $captured"
    log "   ⏭️  Skipped: $skipped"
    log "   ❌ Failed: $failed"
    log ""

    # List captured files
    local file_count=$(ls -1 "$SCREENSHOT_DIR"/*.png 2>/dev/null | wc -l)
    log "   📸 Screenshot files: $file_count"
    log "   📁 Location: $SCREENSHOT_DIR"
    log ""

    # Create manifest
    log "   📋 Creating manifest.json..."
    cat > "$SCREENSHOT_DIR/manifest.json" <<EOF
{
  "captured_at": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "total_pages": $total_pages,
  "captured": $captured,
  "skipped": $skipped,
  "failed": $failed,
  "screenshots": [
EOF

    first=true
    for entry in "${PAGES[@]}"; do
        local page_key=$(echo "$entry" | cut -d'|' -f1)
        local url=$(echo "$entry" | cut -d'|' -f2)
        local filename=$(echo "$page_key" | sed 's/.*_//g' | sed 's/-/_/g')
        local filepath="$SCREENSHOT_DIR/aoma-ui_${filename}.png"

        if [ -f "$filepath" ]; then
            if [ "$first" = false ]; then
                echo "," >> "$SCREENSHOT_DIR/manifest.json"
            fi
            first=false

            cat >> "$SCREENSHOT_DIR/manifest.json" <<ENTRY
    {
      "page_key": "$page_key",
      "url": "$url",
      "screenshot": "aoma-ui_${filename}.png",
      "knowledge_base_id": "aoma_${filename}"
    }
ENTRY
        fi
    done

    cat >> "$SCREENSHOT_DIR/manifest.json" <<EOF

  ]
}
EOF

    log "   ✅ Manifest created" "$GREEN"
    log ""

    log "${YELLOW}💡 Next steps:${NC}"
    log "   1. Review screenshots: open $SCREENSHOT_DIR"
    log "   2. Update knowledge base: node scripts/update-kb-with-screenshots.js"
    log "   3. Test visual responses in chat"
    log ""
}

# Run
main
