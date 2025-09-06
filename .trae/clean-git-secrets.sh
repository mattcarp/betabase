#!/bin/bash

# Git History Secret Cleanup Script
# This script helps remove sensitive data from Git history

echo "🔒 Git History Secret Cleanup"
echo "============================="
echo ""
echo "⚠️  WARNING: This will rewrite Git history!"
echo "Make sure you have:"
echo "  1. Backed up your repository"
echo "  2. Coordinated with your team (if applicable)"
echo "  3. Are ready to force-push to remote"
echo ""

# Check if git-filter-repo is installed
if ! command -v git-filter-repo &> /dev/null; then
    echo "❌ git-filter-repo is not installed"
    echo ""
    echo "To install it:"
    echo "  brew install git-filter-repo  (on macOS)"
    echo "  pip install git-filter-repo   (via Python)"
    echo ""
    exit 1
fi

echo "Files that will be cleaned from history:"
echo "  - .cursor/mcp.json"
echo "  - .mcp.json" 
echo "  - .roo/mcp.json"
echo "  - .windsurf/mcp.json"
echo "  - .claude/mcp.json"
echo "  - .trae/mcp.json"
echo ""

read -p "Do you want to proceed? (yes/no): " confirm
if [[ $confirm != "yes" ]]; then
    echo "Aborted."
    exit 0
fi

echo ""
echo "Creating backup branch..."
git branch backup-before-secret-cleanup

echo "Removing sensitive files from history..."

# Remove specific files containing secrets
git filter-repo --path .cursor/mcp.json --invert-paths --force
git filter-repo --path .mcp.json --invert-paths --force
git filter-repo --path .roo/mcp.json --invert-paths --force
git filter-repo --path .windsurf/mcp.json --invert-paths --force
git filter-repo --path .claude/mcp.json --invert-paths --force
git filter-repo --path .trae/mcp.json --invert-paths --force

echo ""
echo "✅ Git history has been cleaned!"
echo ""
echo "Next steps:"
echo "  1. Review the changes: git log --all --full-history"
echo "  2. Add cleaned config files back with environment variables"
echo "  3. Force push to remote: git push --force --all"
echo "  4. Have team members re-clone the repository"
echo "  5. ROTATE ALL EXPOSED API KEYS IMMEDIATELY!"
echo ""
echo "Backup branch created: backup-before-secret-cleanup"