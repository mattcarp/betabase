#!/bin/bash

echo "🔥 DESTROYING GAMING UI - GOING FULL PROFESSIONAL"

# Replace RadialProgress imports
echo "✓ Replacing RadialProgress with ProfessionalProgress..."
find ./src -type f -name "*.tsx" -exec sed -i '' \
  's|import.*RadialProgress.*from.*RadialProgress.*|import { CircularProfessionalProgress as RadialProgress } from "@/components/ui/ProfessionalProgress"|g' {} \;

# Fix all neon colors
echo "✓ Fixing neon colors..."
find ./src -type f \( -name "*.css" -o -name "*.tsx" -o -name "*.ts" \) -exec sed -i '' \
  -e 's/#00d4ff/#3B82F6/g' \
  -e 's/#00ff88/#10B981/g' \
  -e 's/#00ffff/#3B82F6/g' \
  -e 's/#0099cc/#6366F1/g' \
  -e 's/#ffaa00/#F59E0B/g' \
  -e 's/#ff4444/#EF4444/g' \
  -e 's/cyan-400/blue-600/g' \
  -e 's/cyan-500/blue-500/g' \
  -e 's/cyan-600/blue-400/g' \
  -e 's/text-cyan/text-blue/g' \
  -e 's/bg-cyan/bg-blue/g' \
  -e 's/border-cyan/border-blue/g' {} \;

# Remove all glow effects
echo "✓ Removing glow effects..."
find ./src -type f -name "*.css" -exec sed -i '' \
  -e 's/drop-shadow-glow/drop-shadow-none/g' \
  -e 's/animate-pulse-glow/animate-none/g' \
  -e 's/glow.*rgba[^;]*/none/g' {} \;

# Fix tailwind classes in components
echo "✓ Fixing tailwind classes..."
find ./src -type f -name "*.tsx" -exec sed -i '' \
  -e 's/shadow-glow/shadow-md/g' \
  -e 's/shadow-neon/shadow-lg/g' \
  -e 's/ring-cyan/ring-blue/g' \
  -e 's/ring-neon/ring-blue/g' {} \;

echo "✅ GAMING UI DESTROYED - NOW PROFESSIONAL!"
