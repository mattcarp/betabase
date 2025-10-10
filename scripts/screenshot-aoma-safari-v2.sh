#!/bin/bash

# Take screenshots using Safari's JavaScript screenshot capability
# Simpler approach that doesn't require Screen Recording permission

PAGES=(
  "https://aoma-stage.smcdp-de.net/:home"
  "https://aoma-stage.smcdp-de.net/aoma-ui/my-aoma-files:my_files"
  "https://aoma-stage.smcdp-de.net/aoma-ui/simple-upload:simple_upload"
  "https://aoma-stage.smcdp-de.net/aoma-ui/direct-upload:direct_upload"
  "https://aoma-stage.smcdp-de.net/aoma-ui/product-metadata-viewer:metadata_viewer"
  "https://aoma-stage.smcdp-de.net/aoma-ui/unified-submission-tool:submission_tool"
  "https://aoma-stage.smcdp-de.net/aoma-ui/registration-job-status:job_status"
  "https://aoma-stage.smcdp-de.net/aoma-ui/qc-notes:qc_notes"
  "https://aoma-stage.smcdp-de.net/aoma-ui/video-metadata:video_metadata"
  "https://aoma-stage.smcdp-de.net/aoma-ui/unregister-assets:unregister"
)

mkdir -p tmp/aoma-screenshots

echo "📸 Taking screenshots of AOMA pages..."
echo ""
echo "⚠️  Alternative method: Please use Safari's File → Export as PDF for each page"
echo "    Or use Cmd+Shift+4 to manually screenshot each page"
echo ""
echo "Pages to capture:"
echo ""

for page_info in "${PAGES[@]}"; do
  url="${page_info%:*}"
  name="${page_info##*:}"

  echo "📄 $name"
  echo "   URL: $url"
  echo "   File: tmp/aoma-screenshots/aoma_${name}.png"
  echo ""

  # Navigate Safari
  osascript -e "tell application \"Safari\" to set URL of front document to \"$url\"" 2>/dev/null
  sleep 3
done

echo "✅ Navigation complete!"
echo ""
echo "💡 Next steps:"
echo "   1. Use Cmd+Shift+4 and click Safari window for each page"
echo "   2. Or ask me to help set up Chrome DevTools MCP for automated screenshots"
