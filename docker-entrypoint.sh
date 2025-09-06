#!/bin/sh
set -e

echo "🚀 Starting SIAM application..."
echo "📍 Environment: ${NODE_ENV:-development}"
echo "🔌 Port: ${PORT:-10000}"
echo "🏠 Hostname: ${HOSTNAME:-0.0.0.0}"

# Handle termination signals gracefully
trap 'echo "📴 Received shutdown signal, gracefully stopping..."; exit 0' SIGTERM SIGINT

# Check if we're in standalone mode
if [ -f "server.js" ]; then
    echo "✅ Running in standalone mode"
    exec node server.js
else
    echo "⚠️  No standalone build found, starting with next start"
    exec npm start
fi