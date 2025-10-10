#!/bin/bash

# Scrape AOMA pages directly from Safari session
# Uses AppleScript to navigate and extract HTML

PAGES=(
  "https://aoma-stage.smcdp-de.net/"
  "https://aoma-stage.smcdp-de.net/aoma-ui/my-aoma-files"
  "https://aoma-stage.smcdp-de.net/aoma-ui/simple-upload"
  "https://aoma-stage.smcdp-de.net/aoma-ui/direct-upload"
  "https://aoma-stage.smcdp-de.net/aoma-ui/product-metadata-viewer"
  "https://aoma-stage.smcdp-de.net/aoma-ui/unified-submission-tool"
  "https://aoma-stage.smcdp-de.net/aoma-ui/registration-job-status"
  "https://aoma-stage.smcdp-de.net/aoma-ui/qc-notes"
  "https://aoma-stage.smcdp-de.net/aoma-ui/video-metadata"
  "https://aoma-stage.smcdp-de.net/aoma-ui/unregister-assets"
)

mkdir -p tmp/aoma-html

echo "🕷️ Scraping AOMA from Safari..."

for url in "${PAGES[@]}"; do
  echo ""
  echo "📄 Scraping: $url"

  # Navigate Safari to URL
  osascript <<EOF
    tell application "Safari"
      activate
      set URL of front document to "$url"
      delay 3
    end tell
EOF

  sleep 3

  # Extract HTML source
  html=$(osascript <<EOF
    tell application "Safari"
      set pageSource to do JavaScript "document.documentElement.outerHTML" in front document
      return pageSource
    end tell
EOF
  )

  # Save HTML
  filename=$(echo "$url" | sed 's/[^a-zA-Z0-9]/_/g')
  echo "$html" > "tmp/aoma-html/${filename}.html"

  echo "  ✅ Saved ${#html} chars to ${filename}.html"
done

echo ""
echo "✅ Scraping complete! $(ls -1 tmp/aoma-html/*.html | wc -l) pages saved"
echo "Next: node scripts/process-aoma-html.js"
