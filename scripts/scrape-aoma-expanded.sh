#!/bin/bash

# Expanded AOMA scraping - Additional tools and features
# Uses AppleScript to navigate Safari session and extract HTML

PAGES=(
  # Already scraped (commenting out to avoid duplicates):
  # "https://aoma-stage.smcdp-de.net/"
  # "https://aoma-stage.smcdp-de.net/aoma-ui/my-aoma-files"
  # "https://aoma-stage.smcdp-de.net/aoma-ui/simple-upload"
  # "https://aoma-stage.smcdp-de.net/aoma-ui/direct-upload"
  # "https://aoma-stage.smcdp-de.net/aoma-ui/product-metadata-viewer"
  # "https://aoma-stage.smcdp-de.net/aoma-ui/unified-submission-tool"
  # "https://aoma-stage.smcdp-de.net/aoma-ui/registration-job-status"
  # "https://aoma-stage.smcdp-de.net/aoma-ui/qc-notes"
  # "https://aoma-stage.smcdp-de.net/aoma-ui/video-metadata"
  # "https://aoma-stage.smcdp-de.net/aoma-ui/unregister-assets"

  # NEW: Core submission tools
  "https://aoma-stage.smcdp-de.net/aoma-ui/submit-assets"
  "https://aoma-stage.smcdp-de.net/aoma-ui/asset-submission-tool"

  # NEW: Asset Administration
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

  # NEW: General tools
  "https://aoma-stage.smcdp-de.net/aoma-ui/summary/artist"
  "https://aoma-stage.smcdp-de.net/aoma-ui/digital-archive-batch-export"
  "https://aoma-stage.smcdp-de.net/aoma-ui/media-batch-converter"

  # NEW: User Management
  "https://aoma-stage.smcdp-de.net/aoma-ui/user-management/search"
  "https://aoma-stage.smcdp-de.net/aoma-ui/role-management"
  "https://aoma-stage.smcdp-de.net/aoma-ui/user-event-history"
)

mkdir -p tmp/aoma-html

echo "🕷️  Scraping ADDITIONAL AOMA pages from Safari..."
echo "📊 ${#PAGES[@]} new pages to scrape"
echo ""

count=0
for url in "${PAGES[@]}"; do
  ((count++))
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "📄 [$count/${#PAGES[@]}] Scraping: $url"

  # Navigate Safari to URL
  osascript <<EOF
    tell application "Safari"
      activate
      set URL of front document to "$url"
      delay 3
    end tell
EOF

  sleep 4  # Extra wait for complex pages

  # Extract HTML source
  html=$(osascript <<EOF
    tell application "Safari"
      set pageSource to do JavaScript "document.documentElement.outerHTML" in front document
      return pageSource
    end tell
EOF
  )

  # Save HTML (sanitize URL for filename)
  filename=$(echo "$url" | sed 's/[^a-zA-Z0-9]/_/g')
  echo "$html" > "tmp/aoma-html/${filename}.html"

  echo "  ✅ Saved ${#html} chars to ${filename}.html"
  echo ""

  # Brief pause between pages
  sleep 2
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ Scraping complete!"
echo "   Total files: $(ls -1 tmp/aoma-html/*.html | wc -l)"
echo ""
echo "💡 Next step: node scripts/process-aoma-html.js"
echo ""
