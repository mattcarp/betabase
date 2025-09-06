#!/bin/bash

# ELIMINATE ALL GAMING AESTHETICS - PROFESSIONAL ONLY
echo "🎯 ELIMINATING ALL GAMING ELEMENTS..."

# Remove floating orbs from all component files
echo "Removing floating orbs from components..."
find src -type f \( -name "*.tsx" -o -name "*.jsx" \) -exec sed -i '' '/<div className="mac-floating-orb"><\/div>/d' {} \;

# Remove floating orb CSS from all stylesheets
echo "Removing floating orb CSS..."
find src -type f -name "*.css" -exec sed -i '' '/.mac-floating-orb/,/^}/d' {} \;

# Remove glow animations
echo "Removing glow animations..."
find src -type f -name "*.css" -exec sed -i '' '/@keyframes mac-glow/,/^}/d' {} \;
find src -type f -name "*.css" -exec sed -i '' '/animation:.*mac-glow/d' {} \;
find src -type f -name "*.css" -exec sed -i '' '/text-shadow:.*[0-9][0-9]px/d' {} \;

# Remove shimmer effects
echo "Removing shimmer effects..."
find src -type f -name "*.css" -exec sed -i '' '/.mac-shimmer/,/^}/d' {} \;
find src -type f -name "*.css" -exec sed -i '' '/@keyframes mac-shimmer/,/^}/d' {} \;

# Fix MAC display text (remove glow)
echo "Fixing display text..."
find src -type f -name "*.css" -exec sed -i '' 's/text-shadow: 0 0 [0-9]*px.*/\/\* text-shadow removed \*\//g' {} \;

# Remove float animations
echo "Removing float animations..."
find src -type f -name "*.css" -exec sed -i '' '/@keyframes mac-float/,/^}/d' {} \;

# Remove pulse animations
echo "Removing pulse animations..."
find src -type f -name "*.css" -exec sed -i '' '/@keyframes.*pulse/,/^}/d' {} \;
find src -type f -name "*.css" -exec sed -i '' '/animation:.*pulse/d' {} \;

# Remove excessive scale transforms
echo "Fixing excessive transforms..."
find src -type f -name "*.css" -exec sed -i '' 's/scale(1\.[1-9][0-9]*)/scale(1.01)/g' {} \;

# Remove neon color references in class names
echo "Removing neon class references..."
find src -type f \( -name "*.tsx" -o -name "*.jsx" \) -exec sed -i '' 's/className=".*neon.*"/className=""/g' {} \;
find src -type f \( -name "*.tsx" -o -name "*.jsx" \) -exec sed -i '' 's/className=".*glow.*"/className=""/g' {} \;

echo "✅ Gaming elements eliminated!"
echo "🎯 Professional standards enforced!"