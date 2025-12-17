#!/bin/bash
# git-safe-commit.sh - Handles git lock file issues automatically
# 
# ROOT CAUSE: Cursor's agent and IDE run git commands that sometimes hang
# or timeout, leaving zombie processes that hold .git/index.lock
#
# This script:
# 1. Kills any stuck git processes
# 2. Removes any lock files  
# 3. Then runs git add + commit
#
# Usage: ./scripts/git-safe-commit.sh "commit message"

set -e

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

# Function to clean up git locks
cleanup_git_locks() {
    echo "🧹 Cleaning up git locks..."
    
    # Kill any stuck git processes for THIS repo
    local pids=$(ps aux | grep -E "git (add|commit|status)" | grep "$REPO_ROOT" | grep -v grep | awk '{print $2}')
    if [ -n "$pids" ]; then
        echo "  Killing stuck git processes: $pids"
        echo "$pids" | xargs kill -9 2>/dev/null || true
        sleep 0.5
    fi
    
    # Remove any lock files
    find "$REPO_ROOT/.git" -name "*.lock" -delete 2>/dev/null || true
    
    echo "✅ Git locks cleaned"
}

# Main
if [ -z "$1" ]; then
    echo "Usage: $0 'commit message'"
    exit 1
fi

cleanup_git_locks

echo "📦 Staging changes..."
git add .

echo "💾 Committing..."
git commit -m "$1"

echo "🎉 Done!"




