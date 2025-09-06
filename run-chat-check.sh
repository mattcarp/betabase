#!/bin/bash

echo "Checking if development server is running on port 3000..."
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Development server is running"
    echo "Running chat input verification..."
    npm run check-chat
else
    echo "❌ Development server is not responding on http://localhost:3000"
    echo "Please ensure the development server is running with: npm run dev"
fi