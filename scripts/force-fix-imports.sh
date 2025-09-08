#!/bin/bash

# Force fix ALL @ imports with brute force - YOLO MODE!

echo "🔥 YOLO: FORCING ALL @ IMPORTS TO RELATIVE PATHS!"

# Find all TypeScript files and fix @ imports
find . -type f \( -name "*.ts" -o -name "*.tsx" \) \
  -not -path "./node_modules/*" \
  -not -path "./.next/*" | while read file; do
  
  # Count the depth to determine the relative path
  depth=$(echo "$file" | tr '/' '\n' | grep -c '\.')
  
  # Build the relative prefix based on depth
  if [[ "$file" == *"src/components/ui/"* ]]; then
    # For components/ui files, go up 2 levels to reach src
    sed -i '' "s|from '@/lib/|from '../../lib/|g" "$file"
    sed -i '' "s|from '@/styles/|from '../../styles/|g" "$file"
    sed -i '' "s|from '@/components/|from '../../components/|g" "$file"
    sed -i '' "s|from '@/utils/|from '../../utils/|g" "$file"
    sed -i '' "s|from '@/hooks/|from '../../hooks/|g" "$file"
    sed -i '' "s|from '@/types/|from '../../types/|g" "$file"
    sed -i '' "s|import '@/|import '../../|g" "$file"
  elif [[ "$file" == *"src/components/"* ]]; then
    # For other components files, go up 1 level to reach src
    sed -i '' "s|from '@/lib/|from '../lib/|g" "$file"
    sed -i '' "s|from '@/styles/|from '../styles/|g" "$file"
    sed -i '' "s|from '@/components/|from './|g" "$file"
    sed -i '' "s|from '@/utils/|from '../utils/|g" "$file"
    sed -i '' "s|from '@/hooks/|from '../hooks/|g" "$file"
    sed -i '' "s|from '@/types/|from '../types/|g" "$file"
    sed -i '' "s|import '@/|import '../|g" "$file"
  elif [[ "$file" == *"app/"* ]]; then
    # For app files, path to src folder
    sed -i '' "s|from '@/lib/|from '../src/lib/|g" "$file"
    sed -i '' "s|from '@/styles/|from '../src/styles/|g" "$file"
    sed -i '' "s|from '@/components/|from '../src/components/|g" "$file"
    sed -i '' "s|from '@/utils/|from '../src/utils/|g" "$file"
    sed -i '' "s|from '@/hooks/|from '../src/hooks/|g" "$file"
    sed -i '' "s|from '@/types/|from '../src/types/|g" "$file"
    sed -i '' "s|import '@/|import '../src/|g" "$file"
  fi
done

echo "✅ YOLO: ALL @ IMPORTS FORCEFULLY FIXED!"

# Verify no @ imports remain
remaining=$(grep -r "@/lib\|@/styles\|@/components\|@/utils\|@/hooks\|@/types" \
  --include="*.ts" --include="*.tsx" \
  --exclude-dir="node_modules" \
  --exclude-dir=".next" \
  . 2>/dev/null | wc -l)

if [ "$remaining" -gt 0 ]; then
  echo "⚠️  Warning: $remaining @ imports still remain"
  grep -r "@/lib\|@/styles\|@/components\|@/utils\|@/hooks\|@/types" \
    --include="*.ts" --include="*.tsx" \
    --exclude-dir="node_modules" \
    --exclude-dir=".next" \
    . 2>/dev/null | head -5
else
  echo "🎉 SUCCESS: All @ imports eliminated!"
fi