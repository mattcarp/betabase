#!/usr/bin/env python3
"""
Safely remove duplicate files with ' 2' suffix after verification.
Only removes files that are identical to their originals.
"""

import os
import sys
import filecmp
from pathlib import Path

def find_duplicates(root_dir):
    """Find all files with ' 2' suffix."""
    duplicates = []
    for root, dirs, files in os.walk(root_dir):
        # Skip node_modules and .next directories
        dirs[:] = [d for d in dirs if d not in ['node_modules', '.next', '.git']]

        for file in files:
            if ' 2.' in file:
                duplicates.append(os.path.join(root, file))

    return duplicates

def get_original_path(dup_path):
    """Get the original file path by removing ' 2' from filename."""
    dir_name = os.path.dirname(dup_path)
    filename = os.path.basename(dup_path)

    # Replace ' 2.' with '.' to get original filename
    original_filename = filename.replace(' 2.', '.', 1)
    return os.path.join(dir_name, original_filename)

def main():
    root_dir = '/home/user/siam'

    print("🔍 Scanning for duplicate files with ' 2' suffix...\n")

    duplicates = find_duplicates(root_dir)

    if not duplicates:
        print("✅ No duplicate files found!")
        return 0

    print(f"Found {len(duplicates)} potential duplicates\n")

    stats = {
        'identical_deleted': 0,
        'different_kept': 0,
        'orphaned_kept': 0,
        'errors': 0
    }

    different_files = []

    for dup_file in sorted(duplicates):
        rel_path = os.path.relpath(dup_file, root_dir)
        original_file = get_original_path(dup_file)

        print(f"Checking: {rel_path}")

        if not os.path.exists(original_file):
            print(f"  ⚠️  No original found - keeping for manual review")
            stats['orphaned_kept'] += 1
            different_files.append(rel_path)

        elif filecmp.cmp(dup_file, original_file, shallow=False):
            print(f"  ✅ IDENTICAL - deleting duplicate")
            try:
                os.remove(dup_file)
                stats['identical_deleted'] += 1
            except Exception as e:
                print(f"  ❌ Error deleting: {e}")
                stats['errors'] += 1

        else:
            print(f"  ⚠️  DIFFERENT from original - keeping for manual review")
            stats['different_kept'] += 1
            different_files.append(rel_path)

        print()

    print("\n" + "="*60)
    print("SUMMARY")
    print("="*60)
    print(f"✅ Identical (deleted):     {stats['identical_deleted']}")
    print(f"⚠️  Different (kept):        {stats['different_kept']}")
    print(f"⚠️  Orphaned (kept):         {stats['orphaned_kept']}")
    print(f"❌ Errors:                  {stats['errors']}")

    if different_files:
        print("\n" + "="*60)
        print("FILES REQUIRING MANUAL REVIEW")
        print("="*60)
        for f in different_files:
            print(f"  - {f}")

    return 0 if stats['errors'] == 0 else 1

if __name__ == '__main__':
    sys.exit(main())
