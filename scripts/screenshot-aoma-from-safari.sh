#!/bin/bash

# Take screenshots of AOMA pages from Safari session
# Captures visual layout for knowledge base enrichment

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

mkdir -p tmp/aoma-screenshots

echo "📸 Taking screenshots of AOMA pages from Safari..."

for url in "${PAGES[@]}"; do
  echo ""
  echo "📄 Navigating to: $url"

  # Navigate Safari to URL
  osascript <<EOF
    tell application "Safari"
      activate
      set URL of front document to "$url"
      delay 4
    end tell
EOF

  sleep 4

  # Generate filename from URL
  filename=$(echo "$url" | sed 's/[^a-zA-Z0-9]/_/g')
  filepath="tmp/aoma-screenshots/${filename}.png"

  # Take screenshot of Safari window
  screencapture -l$(osascript -e 'tell application "Safari" to id of window 1') "$filepath"

  echo "  ✅ Saved screenshot: ${filename}.png"
done

echo ""
echo "✅ Screenshot capture complete! $(ls -1 tmp/aoma-screenshots/*.png 2>/dev/null | wc -l) screenshots saved"
echo "📂 Location: tmp/aoma-screenshots/"
