#!/bin/bash

# Watch for HTML files and auto-process them to vector store

WATCH_DIR="tmp/aoma-html"
mkdir -p "$WATCH_DIR"

echo "👀 Watching $WATCH_DIR for HTML files..."
echo "Save AOMA pages here and they'll be auto-processed!"
echo ""

# Use fswatch if available, otherwise poll
if command -v fswatch &> /dev/null; then
  fswatch -0 "$WATCH_DIR" | while read -d "" event; do
    if [[ "$event" == *.html ]]; then
      echo "📄 Detected: $event"
      node scripts/process-aoma-html.js "$event"
    fi
  done
else
  # Fallback: poll every 2 seconds
  while true; do
    for file in "$WATCH_DIR"/*.html; do
      if [ -f "$file" ] && [ $(stat -f%z "$file") -gt 100 ]; then
        echo "📄 Processing: $file"
        node scripts/process-aoma-html.js "$file"
      fi
    done
    sleep 2
  done
fi
