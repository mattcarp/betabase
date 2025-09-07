#!/bin/bash

# Fix ALL @/ import aliases to relative paths
# This is CRITICAL for production builds!

echo "🔧 Fixing ALL @/ import aliases..."

# Fix app/test-mac-components/page.tsx
sed -i '' 's|@/components/ui/button|../src/components/ui/button|g' app/test-mac-components/page.tsx
sed -i '' 's|@/components/ui/input|../src/components/ui/input|g' app/test-mac-components/page.tsx
sed -i '' 's|@/components/ui/form|../src/components/ui/form|g' app/test-mac-components/page.tsx

# Fix app/layout.tsx
sed -i '' 's|@/components/CustomElementGuard|../src/components/CustomElementGuard|g' app/layout.tsx

# Fix all files in src/components/ui/
find src/components/ui -name "*.tsx" -exec sed -i '' 's|@/components/ui/|./|g' {} \;

# Fix auth components
find src/components/auth -name "*.tsx" -exec sed -i '' 's|@/components/ui/|../../ui/|g' {} \;
find "src/components/auth 2" -name "*.tsx" -exec sed -i '' 's|@/components/ui/|../../ui/|g' {} \;

# Fix AOMAPerformanceDashboard
sed -i '' "s|@/components/ui/|./ui/|g" src/components/AOMAPerformanceDashboard.tsx

# Fix SystemHealthMonitor
sed -i '' 's|@/components/ui/|./ui/|g' src/components/SystemHealthMonitor.tsx

# Fix hooks
find src/hooks -name "*.ts" -exec sed -i '' 's|@/components/ui/toast|../components/ui/toast|g' {} \;

# Fix TestApp and ComponentPlayground
sed -i '' 's|@/components/ui/|./components/ui/|g' src/TestApp.tsx
sed -i '' 's|@/components/ui/|./components/ui/|g' src/ComponentPlayground.tsx

echo "✅ Import fixes complete!"
echo ""
echo "Verifying no @ imports remain..."
remaining=$(grep -r "@/components" app/ src/ --include="*.tsx" --include="*.ts" | grep -v node_modules | wc -l)

if [ "$remaining" -eq 0 ]; then
    echo "✅ SUCCESS: All @ imports have been fixed!"
else
    echo "⚠️  WARNING: $remaining @ imports still remain:"
    grep -r "@/components" app/ src/ --include="*.tsx" --include="*.ts" | grep -v node_modules
fi