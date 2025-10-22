#!/bin/bash
# Script to safely remove duplicate " 2.*" files after verification

set -e

echo "Checking for duplicate files with ' 2' suffix..."
echo ""

# Find all files with " 2" suffix
duplicates=$(find /home/user/siam -name "* 2.*" -type f 2>/dev/null | grep -v node_modules | grep -v .next || true)

if [ -z "$duplicates" ]; then
    echo "No duplicate files found!"
    exit 0
fi

count=0
identical=0
different=0
orphaned=0

echo "$duplicates" | while IFS= read -r dup_file; do
    count=$((count + 1))

    # Extract the original filename (remove " 2" before extension)
    dir=$(dirname "$dup_file")
    filename=$(basename "$dup_file")

    # Handle different cases: "name 2.ext", "name 2.spec.ts", etc.
    if [[ "$filename" =~ ^(.*)\ 2\.(.*)$ ]]; then
        base="${BASH_REMATCH[1]}"
        ext="${BASH_REMATCH[2]}"
        original="$dir/$base.$ext"
    else
        echo "⚠️  Cannot parse: $filename"
        continue
    fi

    echo "Checking: $filename"

    if [ -f "$original" ]; then
        if diff -q "$dup_file" "$original" >/dev/null 2>&1; then
            echo "  ✅ IDENTICAL to original - Deleting..."
            rm "$dup_file"
            identical=$((identical + 1))
        else
            echo "  ⚠️  DIFFERENT from original - Keeping for manual review"
            different=$((different + 1))
        fi
    else
        echo "  ❌ NO ORIGINAL FOUND - Orphaned file, keeping for manual review"
        orphaned=$((orphaned + 1))
    fi
    echo ""
done

echo "Summary:"
echo "  - Identical (deleted): $identical"
echo "  - Different (kept): $different"
echo "  - Orphaned (kept): $orphaned"
