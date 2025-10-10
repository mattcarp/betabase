#!/bin/bash

# Comprehensive AOMA Stage capture: Screenshots + Web Vitals + Console Logs
# Uses Safari (already authenticated)

PAGES=(
  "https://aoma-stage.smcdp-de.net/:01_home"
  "https://aoma-stage.smcdp-de.net/aoma-ui/my-aoma-files:02_my_files"
  "https://aoma-stage.smcdp-de.net/aoma-ui/simple-upload:03_simple_upload"
  "https://aoma-stage.smcdp-de.net/aoma-ui/direct-upload:04_direct_upload"
  "https://aoma-stage.smcdp-de.net/aoma-ui/product-metadata-viewer:05_metadata_viewer"
  "https://aoma-stage.smcdp-de.net/aoma-ui/unified-submission-tool:06_submission_tool"
  "https://aoma-stage.smcdp-de.net/aoma-ui/registration-job-status:07_job_status"
  "https://aoma-stage.smcdp-de.net/aoma-ui/qc-notes:08_qc_notes"
  "https://aoma-stage.smcdp-de.net/aoma-ui/video-metadata:09_video_metadata"
  "https://aoma-stage.smcdp-de.net/aoma-ui/unregister-assets:10_unregister"
)

# Create output directories
mkdir -p tmp/aoma-screenshots tmp/aoma-webvitals tmp/aoma-console-logs

echo "🚀 Starting AOMA Stage comprehensive capture..."
echo "📊 Capturing: Screenshots, Web Vitals, Console Logs"
echo ""

for page_info in "${PAGES[@]}"; do
  url="${page_info%:*}"
  name="${page_info##*:}"

  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "📄 Processing: $name"
  echo "🔗 URL: $url"
  echo ""

  # Navigate Safari to URL
  echo "  🧭 Navigating..."
  osascript <<EOF
    tell application "Safari"
      activate
      set URL of front document to "$url"
    end tell
EOF

  # Wait for page load
  echo "  ⏳ Waiting for page load..."
  sleep 6

  # Extract Web Vitals using JavaScript
  echo "  📊 Capturing Web Vitals..."
  webvitals=$(osascript <<'EOJS'
    tell application "Safari"
      do JavaScript "
        (function() {
          const vitals = {
            url: window.location.href,
            timestamp: new Date().toISOString(),
            lcp: 0,
            fid: 0,
            cls: 0,
            ttfb: 0,
            domContentLoaded: 0,
            loadTime: 0
          };

          // Get TTFB and load times
          if (window.performance && window.performance.timing) {
            const timing = window.performance.timing;
            vitals.ttfb = timing.responseStart - timing.requestStart;
            vitals.domContentLoaded = timing.domContentLoadedEventEnd - timing.navigationStart;
            vitals.loadTime = timing.loadEventEnd - timing.navigationStart;
          }

          // Get Web Vitals if available
          if (window.performance && window.performance.getEntriesByType) {
            const paintEntries = window.performance.getEntriesByType('paint');
            const lcpEntry = paintEntries.find(e => e.name === 'largest-contentful-paint');
            if (lcpEntry) vitals.lcp = Math.round(lcpEntry.startTime);
          }

          // Get Layout Shift Score (CLS approximation)
          if (window.performance && window.performance.getEntriesByType) {
            const layoutShifts = window.performance.getEntriesByType('layout-shift');
            vitals.cls = layoutShifts.reduce((sum, entry) => sum + entry.value, 0).toFixed(3);
          }

          return JSON.stringify(vitals, null, 2);
        })();
      " in front document
    end tell
EOJS
)

  # Save Web Vitals
  echo "$webvitals" > "tmp/aoma-webvitals/${name}.json"
  echo "  ✅ Web Vitals saved: ${name}.json"

  # Extract console errors (if any)
  echo "  🔍 Checking console..."
  console_logs=$(osascript <<'EOJS'
    tell application "Safari"
      do JavaScript "
        (function() {
          const logs = {
            errors: window.__CONSOLE_ERRORS__ || [],
            warnings: window.__CONSOLE_WARNINGS__ || [],
            info: 'Safari Web Inspector required for full console capture'
          };
          return JSON.stringify(logs, null, 2);
        })();
      " in front document
    end tell
EOJS
)

  echo "$console_logs" > "tmp/aoma-console-logs/${name}.json"
  echo "  ✅ Console check saved: ${name}.json"

  # Take screenshot
  echo "  📸 Taking screenshot..."
  osascript <<EOF
    tell application "Safari"
      activate
      delay 0.5
    end tell

    do shell script "screencapture -w tmp/aoma-screenshots/${name}.png"
EOF

  echo "  ✅ Screenshot saved: ${name}.png"
  echo ""

  # Brief pause between pages
  sleep 2
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ Capture complete!"
echo ""
echo "📂 Results:"
echo "   Screenshots: tmp/aoma-screenshots/ ($(ls -1 tmp/aoma-screenshots/*.png 2>/dev/null | wc -l) files)"
echo "   Web Vitals:  tmp/aoma-webvitals/ ($(ls -1 tmp/aoma-webvitals/*.json 2>/dev/null | wc -l) files)"
echo "   Console:     tmp/aoma-console-logs/ ($(ls -1 tmp/aoma-console-logs/*.json 2>/dev/null | wc -l) files)"
echo ""
echo "💡 Next steps:"
echo "   - Review Web Vitals for performance insights"
echo "   - Check console logs for errors"
echo "   - Use screenshots for visual documentation"
