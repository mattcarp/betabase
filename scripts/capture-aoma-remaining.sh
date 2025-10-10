#!/bin/bash

# Continue capturing remaining AOMA pages

PAGES=(
  "https://aoma-stage.smcdp-de.net/aoma-ui/unified-submission-tool:06_submission_tool"
  "https://aoma-stage.smcdp-de.net/aoma-ui/registration-job-status:07_job_status"
  "https://aoma-stage.smcdp-de.net/aoma-ui/qc-notes:08_qc_notes"
  "https://aoma-stage.smcdp-de.net/aoma-ui/video-metadata:09_video_metadata"
  "https://aoma-stage.smcdp-de.net/aoma-ui/unregister-assets:10_unregister"
)

mkdir -p tmp/aoma-screenshots tmp/aoma-webvitals tmp/aoma-console-logs

echo "🔄 Resuming AOMA capture (pages 6-10)..."
echo ""

for page_info in "${PAGES[@]}"; do
  url="${page_info%:*}"
  name="${page_info##*:}"

  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "📄 Processing: $name"
  
  osascript <<EOJS
    tell application "Safari"
      activate
      set URL of front document to "$url"
    end tell
EOJS

  sleep 6

  webvitals=$(osascript <<'EOJS2'
    tell application "Safari"
      do JavaScript "
        (function() {
          const vitals = {
            url: window.location.href,
            timestamp: new Date().toISOString(),
            lcp: 0, fid: 0, cls: 0, ttfb: 0,
            domContentLoaded: 0, loadTime: 0
          };
          if (window.performance && window.performance.timing) {
            const timing = window.performance.timing;
            vitals.ttfb = timing.responseStart - timing.requestStart;
            vitals.domContentLoaded = timing.domContentLoadedEventEnd - timing.navigationStart;
            vitals.loadTime = timing.loadEventEnd - timing.navigationStart;
          }
          if (window.performance && window.performance.getEntriesByType) {
            const layoutShifts = window.performance.getEntriesByType('layout-shift');
            vitals.cls = layoutShifts.reduce((sum, entry) => sum + entry.value, 0).toFixed(3);
          }
          return JSON.stringify(vitals, null, 2);
        })();
      " in front document
    end tell
EOJS2
)

  echo "$webvitals" > "tmp/aoma-webvitals/${name}.json"
  echo "  ✅ Web Vitals: ${name}.json"

  osascript <<EOJS3
    tell application "Safari" to activate
    delay 0.5
    do shell script "screencapture -w tmp/aoma-screenshots/${name}.png"
EOJS3

  echo "  ✅ Screenshot: ${name}.png"
  sleep 2
done

echo ""
echo "✅ All 10 pages captured!"
