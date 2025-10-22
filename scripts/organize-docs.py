#!/usr/bin/env python3
"""
Organize scattered documentation into a structured hierarchy.
Moves non-essential .md files from root to appropriate docs/ subdirectories.
"""

import os
import shutil
from pathlib import Path

# Files to keep in root directory
ROOT_DOCS = {
    'README.md',
    'CLAUDE.md',
    'CLAUDE.local.md',
    'CONTRIBUTING.md',
    'TESTING_FUNDAMENTALS.md',
}

# Documentation categories and their target directories
DOC_CATEGORIES = {
    'AOMA': 'docs/aoma',
    'DATA': 'docs/data-collection',
    'DEPLOY': 'docs/deployment',
    'TEST': 'docs/testing',
    'ARCHITECTURE': 'docs/architecture',
    'GUIDE': 'docs/guides',
}

# Mapping patterns to categories
CATEGORY_PATTERNS = {
    'AOMA': ['AOMA', 'aoma'],
    'DATA': ['DATA-COLLECTION', 'COLLECTION', 'CRAWLER', 'CRAWL'],
    'DEPLOY': ['DEPLOYMENT', 'PRODUCTION', 'RENDER', 'RAILWAY'],
    'TEST': ['TESTING', 'TEST'],
    'ARCHITECTURE': ['ARCHITECTURE', 'HYBRID'],
    'GUIDE': ['GUIDE', 'QUICK', 'TASK'],
}

def categorize_file(filename: str) -> str:
    """Determine which category a file belongs to."""
    upper_name = filename.upper()

    for category, patterns in CATEGORY_PATTERNS.items():
        for pattern in patterns:
            if pattern in upper_name:
                return category

    # Default category for uncategorized files
    return 'GUIDE'

def main():
    root_dir = Path('/home/user/siam')
    docs_dir = root_dir / 'docs'

    # Ensure docs subdirectories exist
    for category_dir in DOC_CATEGORIES.values():
        (root_dir / category_dir).mkdir(parents=True, exist_ok=True)

    print("📚 Organizing documentation...\n")

    moved_count = 0
    kept_count = 0

    # Find all .md files in root
    for md_file in root_dir.glob('*.md'):
        filename = md_file.name

        # Skip files that should stay in root
        if filename in ROOT_DOCS:
            print(f"✓ Keeping in root: {filename}")
            kept_count += 1
            continue

        # Determine category
        category = categorize_file(filename)
        target_dir = root_dir / DOC_CATEGORIES[category]

        # Move file
        target_path = target_dir / filename

        # Handle duplicates
        if target_path.exists():
            print(f"⚠️  File already exists in target: {filename} - skipping")
            continue

        try:
            shutil.move(str(md_file), str(target_path))
            print(f"→ Moved to {DOC_CATEGORIES[category]}: {filename}")
            moved_count += 1
        except Exception as e:
            print(f"❌ Error moving {filename}: {e}")

    print(f"\n{'='*60}")
    print(f"SUMMARY")
    print(f"{'='*60}")
    print(f"Files kept in root:  {kept_count}")
    print(f"Files moved to docs: {moved_count}")

    # Create index file
    create_docs_index(root_dir / 'docs')

    return 0

def create_docs_index(docs_dir: Path):
    """Create a comprehensive index of all documentation."""

    index_content = """# SIAM Documentation Index

## Quick Links

- [Main README](../README.md) - Project overview and setup
- [CLAUDE.md](../CLAUDE.md) - AI assistant development guide
- [Contributing Guide](../CONTRIBUTING.md) - Contribution guidelines
- [Testing Fundamentals](../TESTING_FUNDAMENTALS.md) - Testing strategy and guides
- [Coding Standards](./CODING_STANDARDS.md) - Code style and best practices

## Documentation Categories

### AOMA Integration
Location: `docs/aoma/`

Documentation related to AOMA Stage authentication, crawling, and knowledge base integration.

### Data Collection
Location: `docs/data-collection/`

Documentation for data collection scripts, crawlers, and data processing.

### Deployment
Location: `docs/deployment/`

Deployment guides, production configuration, and environment setup.

### Testing
Location: `docs/testing/`

Test documentation, strategies, and test-specific guides.

### Architecture
Location: `docs/architecture/`

System architecture documentation and design decisions.

### Guides
Location: `docs/guides/`

General guides, quick references, and how-to documents.

## Navigation Tips

1. **Use the search**: Most markdown editors support full-text search
2. **Check the category**: Files are organized by topic
3. **Start with CLAUDE.md**: Essential commands and project info
4. **Check TESTING_FUNDAMENTALS.md**: Before running tests

## Contributing to Documentation

When adding documentation:

1. Place it in the appropriate category directory
2. Use clear, descriptive filenames
3. Update this index if adding major new docs
4. Follow the [Coding Standards](./CODING_STANDARDS.md) for markdown formatting

---

**Last Updated**: October 2025
"""

    index_path = docs_dir / 'README.md'

    # Only create if doesn't exist or ask to overwrite
    if index_path.exists():
        print(f"\n📄 Docs index already exists at {index_path}")
    else:
        with open(index_path, 'w') as f:
            f.write(index_content)
        print(f"\n📄 Created documentation index at {index_path}")

if __name__ == '__main__':
    import sys
    sys.exit(main())
