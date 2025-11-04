#!/bin/bash
# Run integration tests with a local dev server
# This script starts the dev server, waits for it to be ready,
# runs integration tests, then kills the server

set -e

echo "🚀 Starting dev server..."
npm run dev &
SERVER_PID=$!

# Function to cleanup server on exit
cleanup() {
  echo "🧹 Cleaning up..."
  kill $SERVER_PID 2>/dev/null || true
}

# Register cleanup function
trap cleanup EXIT

# Wait for server to be ready
echo "⏳ Waiting for server to be ready..."
sleep 5

# Check if server is responding
max_attempts=10
attempt=0
while [ $attempt -lt $max_attempts ]; do
  if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Server is ready!"
    break
  fi
  attempt=$((attempt + 1))
  echo "   Waiting... (attempt $attempt/$max_attempts)"
  sleep 1
done

if [ $attempt -eq $max_attempts ]; then
  echo "❌ Server failed to start"
  exit 1
fi

# Run integration tests
echo "🧪 Running integration tests..."
INTEGRATION_TESTS=1 npm run test:integration

echo "✅ Integration tests complete"
