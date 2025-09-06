#!/bin/bash
# Production build script that handles symlinks with spaces
# This script temporarily moves symlinks during build to prevent ENOENT errors

echo "🔨 Starting production build..."

# Create temp directory for symlinks
mkdir -p .temp-symlinks

# Find and move all symlinks with spaces in their names
echo "📦 Moving symlinks with spaces temporarily..."
find . -maxdepth 1 -type l -name "* *" | while IFS= read -r link; do
    basename_link=$(basename "$link")
    echo "  Moving: $basename_link"
    mv "$link" ".temp-symlinks/$basename_link" 2>/dev/null || true
done

# Also move problematic symlinks without spaces
for link in .cursorrules .windsurfrules machine mc-design-system; do
    if [ -L "$link" ]; then
        echo "  Moving: $link"
        mv "$link" ".temp-symlinks/$link" 2>/dev/null || true
    fi
done

# Run the actual build (use build:next to avoid recursion)
echo "🚀 Running Next.js build..."
npm run build:next
BUILD_EXIT_CODE=$?

# Restore symlinks (only in development, not in production)
if [ "$NODE_ENV" != "production" ] && [ -d ".temp-symlinks" ]; then
    echo "♻️  Restoring symlinks..."
    find .temp-symlinks -type l | while IFS= read -r link; do
        basename_link=$(basename "$link")
        echo "  Restoring: $basename_link"
        mv "$link" "./$basename_link" 2>/dev/null || true
    done
    rmdir .temp-symlinks 2>/dev/null || true
fi

# In production (Render), we don't need to restore symlinks
if [ "$NODE_ENV" = "production" ]; then
    echo "✅ Production build complete (symlinks not needed in production)"
    rm -rf .temp-symlinks 2>/dev/null || true
fi

exit $BUILD_EXIT_CODE