#!/bin/bash

# Render Priority Diagrams for Demo
# Run from project root: ./scripts/render-demo-diagrams.sh

echo "🎨 Rendering demo diagrams..."

# Create export directory
mkdir -p docs/diagrams/exports

# Check if mermaid-cli is installed
if ! command -v mmdc &> /dev/null; then
    echo "⚠️  mermaid-cli not installed"
    echo "Install with: npm install -g @mermaid-js/mermaid-cli"
    echo ""
    echo "Or use Mermaid Live instead:"
    echo "1. Go to https://mermaid.live"
    echo "2. Copy diagram from docs/SIAM-MERMAID-DIAGRAMS.md"
    echo "3. Export as PNG (1920x1080)"
    exit 1
fi

# Extract and render specific diagrams
# Note: mmdc has issues with multiple diagrams in one file
# This is a workaround - may need manual export from Mermaid Live

echo "✅ Use Mermaid Live for best results:"
echo ""
echo "Priority Diagrams:"
echo "1. SIAM High-Level Architecture (lines 10-64)"
echo "2. AOMA Mesh MCP Server Architecture (lines 268-343)"
echo "3. AOMA Orchestrator Decision Logic (lines 173-220)"
echo "4. Performance Comparison (lines 452-479)"
echo ""
echo "Steps:"
echo "1. Open: https://mermaid.live"
echo "2. Copy diagram code from docs/SIAM-MERMAID-DIAGRAMS.md"
echo "3. Paste into Mermaid Live"
echo "4. Click Actions → Export PNG"
echo "5. Set size: 1920x1080"
echo "6. Save to: docs/diagrams/exports/"
echo ""
echo "Naming convention:"
echo "- 01-siam-architecture.png"
echo "- 06-mcp-architecture.png"
echo "- 04-orchestrator-logic.png"
echo "- 09-performance-comparison.png"
