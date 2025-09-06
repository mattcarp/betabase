#!/bin/bash

# Run console check script with proper error handling
echo "🚀 Running SIAM console check for mce-autosize-textarea errors..."

cd /Users/matt/Documents/projects/siam

# Run the console check
node check-site-console.js

# Check if screenshots were created
echo ""
echo "📸 Checking for generated screenshots..."
if [ -f "/Users/matt/Downloads/baseline-loginform.png" ]; then
    echo "✅ Baseline screenshot created successfully"
    open "/Users/matt/Downloads/baseline-loginform.png"
else
    echo "⚠️  Baseline screenshot not found"
fi

if [ -f "/Users/matt/Downloads/login-form-screenshot.png" ]; then
    echo "✅ Login form screenshot created successfully"  
    open "/Users/matt/Downloads/login-form-screenshot.png"
else
    echo "⚠️  Login form screenshot not found"
fi

if [ -f "/Users/matt/Downloads/siam-console-report.json" ]; then
    echo "✅ Console report created successfully"
    echo ""
    echo "📊 Opening detailed report..."
    open "/Users/matt/Downloads/siam-console-report.json"
else
    echo "⚠️  Console report not found"
fi

echo ""
echo "🎯 Console check complete!"