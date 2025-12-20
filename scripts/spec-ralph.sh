#!/bin/bash
# spec-ralph.sh - Bridge script for running Ralph on SpecKit specs
#
# Usage:
#   ./scripts/spec-ralph.sh FEAT-006-latency 1
#   ./scripts/spec-ralph.sh FEAT-006-latency 1 30  # custom max iterations
#
# This generates the Ralph command for you to copy/paste.

SPEC_ID="${1:-}"
TASK_NUM="${2:-1}"
MAX_ITER="${3:-20}"

if [ -z "$SPEC_ID" ]; then
    echo "Usage: ./scripts/spec-ralph.sh <SPEC-ID> [task-number] [max-iterations]"
    echo ""
    echo "Examples:"
    echo "  ./scripts/spec-ralph.sh FEAT-006-latency 1"
    echo "  ./scripts/spec-ralph.sh FEAT-006-latency 2 30"
    echo ""
    echo "Available specs:"
    ls -1 .specify/specs/ 2>/dev/null || echo "  (none found)"
    exit 1
fi

SPEC_PATH=".specify/specs/$SPEC_ID/"

if [ ! -d "$SPEC_PATH" ]; then
    echo "Error: Spec not found at $SPEC_PATH"
    echo ""
    echo "Available specs:"
    ls -1 .specify/specs/
    exit 1
fi

echo "=========================================="
echo "Ralph + SpecKit Command"
echo "=========================================="
echo ""
echo "Copy and run this command:"
echo ""
echo "/ralph-loop \"Implement $SPEC_ID task $TASK_NUM. See $SPEC_PATH\" --max-iterations $MAX_ITER"
echo ""
echo "=========================================="
echo ""
echo "Spec files:"
echo "  - ${SPEC_PATH}spec.md"
echo "  - ${SPEC_PATH}plan.md"
echo "  - ${SPEC_PATH}tasks.md"
echo ""

# Show the task content if tasks.md exists
if [ -f "${SPEC_PATH}tasks.md" ]; then
    echo "Task $TASK_NUM content:"
    echo "---"
    sed -n "/^## Task $TASK_NUM/,/^## Task/p" "${SPEC_PATH}tasks.md" | head -n -1
    echo "---"
fi
