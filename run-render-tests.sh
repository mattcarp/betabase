#!/bin/bash

# Run Playwright tests against Render.com deployment

echo "🎭 Running Playwright tests against Render deployment..."
echo "==========================================="
echo ""
echo "🎯 Target URL: https://siam.onrender.com"
echo ""

# Check if Playwright is installed
if ! npx playwright --version > /dev/null 2>&1; then
    echo "⚠️  Playwright not found. Installing..."
    npx playwright install
fi

# Select test suite to run
if [ "$1" == "smoke" ]; then
    echo "🔥 Running smoke tests only..."
    npx playwright test --config=playwright.config.render.ts --grep @smoke
elif [ "$1" == "auth" ]; then
    echo "🔐 Running auth tests..."
    npx playwright test --config=playwright.config.render.ts tests/auth
elif [ "$1" == "visual" ]; then
    echo "👁️  Running visual tests..."
    npx playwright test --config=playwright.config.render.ts tests/visual
elif [ "$1" == "all" ]; then
    echo "🚀 Running all tests..."
    npx playwright test --config=playwright.config.render.ts
else
    echo "📋 Running default test suite..."
    npx playwright test --config=playwright.config.render.ts --project=chromium
fi

echo ""
echo "==========================================="
echo "✅ Test run complete!"
echo ""
echo "📊 View detailed report with: npx playwright show-report"
