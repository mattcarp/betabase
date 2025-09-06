#!/bin/bash

cd /Users/matt/Documents/projects/siam

# Make sure we're in the right directory
echo "📍 Current directory: $(pwd)"
echo "🚀 Starting mce-autosize-textarea console error check..."

# Run the console check script
node temp-console-check.js

echo "✅ Check completed!"