#!/bin/bash

# run-coderabbit.sh
# Runs CodeRabbit review on uncommitted changes.
# This is used by the pre-commit hook.

echo "🐇 Running CodeRabbit Review..."

# check if coderabbit is installed
if ! command -v coderabbit &> /dev/null; then
    echo "❌ coderabbit CLI not found. Please install it first."
    exit 1
fi

# Run coderabbit review
# --type uncommitted: checks only staged/working directory changes
# --plain: non-interactive output
coderabbit review --type uncommitted --plain

EXIT_CODE=$?

if [ $EXIT_CODE -ne 0 ]; then
    echo "❌ CodeRabbit found issues or failed to run."
    exit $EXIT_CODE
fi

echo "✅ CodeRabbit check passed."
exit 0
