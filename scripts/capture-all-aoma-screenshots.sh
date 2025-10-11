#!/bin/bash

# Capture screenshots of ALL 28 AOMA pages for knowledge base enhancement
# Uses authenticated Safari session to access AOMA Stage

# Color output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# All 28 AOMA pages in order
PAGES=(
  # Original 10 pages
  "https://aoma-stage.smcdp-de.net/"
  "https://aoma-stage.smcdp-de.net/aoma-ui/direct-upload"
  "https://aoma-stage.smcdp-de.net/aoma-ui/simple-upload"
  "https://aoma-stage.smcdp-de.net/aoma-ui/my-aoma-files"
  "https://aoma-stage.smcdp-de.net/aoma-ui/product-metadata-viewer"
  "https://aoma-stage.smcdp-de.net/aoma-ui/qc-notes"
  "https://aoma-stage.smcdp-de.net/aoma-ui/registration-job-status"
  "https://aoma-stage.smcdp-de.net/aoma-ui/unified-submission-tool"
  "https://aoma-stage.smcdp-de.net/aoma-ui/unregister-assets"
  "https://aoma-stage.smcdp-de.net/aoma-ui/video-metadata"

  # NEW 18 pages
  "https://aoma-stage.smcdp-de.net/aoma-ui/submit-assets"
  "https://aoma-stage.smcdp-de.net/aoma-ui/asset-submission-tool"
  "https://aoma-stage.smcdp-de.net/aoma-ui/integration-manager"
  "https://aoma-stage.smcdp-de.net/aoma-ui/user-export"
  "https://aoma-stage.smcdp-de.net/aoma-ui/asset-upload-job-status"
  "https://aoma-stage.smcdp-de.net/aoma-ui/eom-message-sender"
  "https://aoma-stage.smcdp-de.net/aoma-ui/export-status"
  "https://aoma-stage.smcdp-de.net/aoma-ui/link-attempts"
  "https://aoma-stage.smcdp-de.net/aoma-ui/qc-providers"
  "https://aoma-stage.smcdp-de.net/aoma-ui/master-event-history"
  "https://aoma-stage.smcdp-de.net/aoma-ui/product-event-history"
  "https://aoma-stage.smcdp-de.net/aoma-ui/product-linking"
  "https://aoma-stage.smcdp-de.net/aoma-ui/pseudo-video"
  "https://aoma-stage.smcdp-de.net/aoma-ui/supply-chain-order-management"
  "https://aoma-stage.smcdp-de.net/aoma-ui/summary/artist"
  "https://aoma-stage.smcdp-de.net/aoma-ui/digital-archive-batch-export"
  "https://aoma-stage.smcdp-de.net/aoma-ui/media-batch-converter"
  "https://aoma-stage.smcdp-de.net/aoma-ui/user-management/search"
)

# Create output directory
SCREENSHOT_DIR="tmp/aoma-screenshots-$(date +%Y%m%d)"
mkdir -p "$SCREENSHOT_DIR"

echo -e "${BLUE}📸 AOMA Screenshot Capture${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "📊 Total pages: ${#PAGES[@]}"
echo -e "📁 Output: $SCREENSHOT_DIR"
echo ""

# Verify Safari is running with AOMA session
echo -e "${YELLOW}⚠️  Prerequisites:${NC}"
echo "1. Safari must be running"
echo "2. Must be logged into AOMA Stage in Safari"
echo "3. Session must be active (no expired login)"
echo ""
read -p "Press Enter when ready to start capture..."

count=0
for url in "${PAGES[@]}"; do
  ((count++))

  echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${GREEN}📄 [$count/${#PAGES[@]}] Capturing: $url${NC}"

  # Generate filename from URL
  filename=$(echo "$url" | sed 's|https://aoma-stage.smcdp-de.net/||g' | sed 's|/|_|g' | sed 's|^$|home|g')
  filepath="$SCREENSHOT_DIR/${filename}.png"

  # Navigate Safari to URL
  osascript <<EOF
    tell application "Safari"
      activate
      set URL of front document to "$url"
    end tell
EOF

  # Wait for page load (adjust timing as needed)
  echo -e "  ⏳ Waiting for page load..."
  sleep 5

  # Capture screenshot using screencapture
  # -w = window mode (captures just Safari window)
  # -x = no sound
  # -o = no shadow
  echo -e "  📸 Capturing screenshot..."
  screencapture -w -x -o "$filepath"

  # Verify screenshot was created
  if [ -f "$filepath" ]; then
    filesize=$(ls -lh "$filepath" | awk '{print $5}')
    echo -e "  ${GREEN}✅ Saved: ${filename}.png (${filesize})${NC}"
  else
    echo -e "  ${YELLOW}⚠️  Failed to capture screenshot${NC}"
  fi

  # Brief pause between pages
  sleep 2
done

echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "\n${GREEN}✅ Screenshot capture complete!${NC}"
echo -e "📊 Total screenshots: $(ls -1 "$SCREENSHOT_DIR"/*.png 2>/dev/null | wc -l)"
echo -e "📁 Location: $SCREENSHOT_DIR"
echo ""

# Create manifest linking screenshots to knowledge base entries
echo -e "${BLUE}📋 Creating screenshot manifest...${NC}"

cat > "$SCREENSHOT_DIR/manifest.json" <<EOF
{
  "captured_at": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "total_pages": ${#PAGES[@]},
  "screenshots": [
EOF

first=true
for url in "${PAGES[@]}"; do
  filename=$(echo "$url" | sed 's|https://aoma-stage.smcdp-de.net/||g' | sed 's|/|_|g' | sed 's|^$|home|g')
  filepath="$SCREENSHOT_DIR/${filename}.png"

  # Only add if screenshot exists
  if [ -f "$filepath" ]; then
    if [ "$first" = false ]; then
      echo "," >> "$SCREENSHOT_DIR/manifest.json"
    fi
    first=false

    cat >> "$SCREENSHOT_DIR/manifest.json" <<ENTRY
    {
      "url": "$url",
      "screenshot": "${filename}.png",
      "knowledge_base_id": "aoma_$(echo "$filename" | sed 's/-/_/g')"
    }
ENTRY
  fi
done

cat >> "$SCREENSHOT_DIR/manifest.json" <<EOF

  ]
}
EOF

echo -e "${GREEN}✅ Manifest created: manifest.json${NC}"
echo ""

# Generate summary report
echo -e "${BLUE}📊 Screenshot Summary:${NC}"
echo ""
ls -lh "$SCREENSHOT_DIR"/*.png | awk '{print "  " $9 " (" $5 ")"}'
echo ""

echo -e "${YELLOW}💡 Next steps:${NC}"
echo "1. Review screenshots in: $SCREENSHOT_DIR"
echo "2. Update knowledge base with screenshot paths"
echo "3. Optional: Generate vision embeddings with CLIP"
echo "4. Enhance chat responses with visual references"
echo ""
