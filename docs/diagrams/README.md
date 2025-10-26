# Diagram Rendering Guide

## Three Ways to Render These Diagrams

### Option 1: Mermaid Live Editor (FASTEST - 5 minutes)

1. Go to https://mermaid.live
2. Open each `.md` file in this directory
3. Copy the mermaid code block (everything between `mermaid and `)
4. Paste into Mermaid Live
5. Click "Export" → "PNG" or "SVG"
6. Save to this directory

**Pros:** Instant, no installation
**Cons:** Manual export for each diagram

---

### Option 2: VS Code with Mermaid Extension (RECOMMENDED)

1. Install extension: "Markdown Preview Mermaid Support"
2. Open any `.md` file in this directory
3. Cmd+Shift+V to preview
4. Right-click diagram → "Copy as SVG" or take screenshot
5. Save to this directory

**Pros:** Preview directly in VS Code, easy iteration
**Cons:** Need to install extension

---

### Option 3: Excalidraw Plus (If you have subscription)

1. Open Excalidraw
2. Menu → Insert → Mermaid
3. Paste the mermaid code
4. It renders automatically
5. Style as needed
6. Export as PNG

**Pros:** Can further customize in Excalidraw
**Cons:** Need Excalidraw Plus subscription

---

## Quick Rendering Script

Want to render all three at once? Run this:

```bash
cd ~/Documents/projects/siam/docs/diagrams

# Install mermaid-cli if you haven't
npm install -g @mermaid-js/mermaid-cli

# Render all diagrams
mmdc -i 01-system-architecture.md -o 01-system-architecture.png -t dark -b transparent
mmdc -i 02-mcp-integration-flow.md -o 02-mcp-integration-flow.png -t dark -b transparent
mmdc -i 03-rag-pipeline-antihallucination.md -o 03-rag-pipeline-antihallucination.png -t dark -b transparent
```

---

## For Presentation

**Recommended approach:**

1. Render as PNG with transparent background
2. Import into Keynote or PowerPoint
3. Add on dark background (matches your UI aesthetic)
4. One diagram per slide
5. Talk through the flow

**Style notes:**

- Diagrams use your color scheme (dark blues, purples, pinks)
- Text is white for visibility on dark backgrounds
- Key components highlighted with colors matching your branding

---

## Files in This Directory

- `01-system-architecture.md` - High-level system components
- `02-mcp-integration-flow.md` - MCP request/response sequence
- `03-rag-pipeline-antihallucination.md` - RAG flow with protection layers
- `README.md` - This file

---

**Next Step:** Render the diagrams (5-10 min), then test Playwright script!
