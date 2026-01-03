# FEAT-014: Smart Diagrams - Two-Stage Visualization

## Problem

Users asking about workflows, architectures, or processes receive text-only responses. Visual learners struggle to understand complex relationships from prose. The existing diagram infrastructure (Nano Banana Pro) is not integrated into the chat flow, and there's no lightweight option for quick visualizations.

Current pain points:
1. AI responses include raw mermaid code blocks that don't render as diagrams
2. No automatic diagram generation for diagram-worthy content
3. Nano Banana Pro exists but isn't accessible from chat
4. Users have no upgrade path from quick diagrams to polished slides

## Solution

Implement a two-stage diagram system:

**Stage 1: Mermaid (Fast, Inline)**
- AI automatically includes mermaid diagrams when responses involve workflows, architectures, or processes
- Code blocks with `language="mermaid"` render as actual diagrams (not raw text)
- Instant, no API call required (client-side rendering)
- Clean, dark-themed rendering matching MAC Design System

**Stage 2: "Improve this diagram" (Nano Banana Pro)**
- Subtle button appears below rendered mermaid diagrams
- Clicking triggers Nano Banana Pro to generate a professional slide-quality image
- Uses mermaid source as context for the AI image generation
- Result is a polished, presentation-ready infographic

## User Flow

```
User asks: "How does the AOMA asset ingestion workflow work?"
                    │
                    ▼
        AI responds with text explanation
        + mermaid diagram embedded in response
                    │
                    ▼
        Mermaid renders inline (instant)
        + subtle "Improve this diagram" button
                    │
                    ▼ (optional click)
        Nano Banana Pro generates
        professional slide-quality diagram
```

## Scope

**In Scope:**
- Mermaid.js integration in code-block component
- System prompt enhancement for mermaid generation
- "Improve this diagram" CTA button
- Nano Banana Pro upgrade flow
- MAC Design System themed mermaid rendering

**Out of Scope:**
- Mermaid editing/modification in UI
- Diagram version history
- Export to PowerPoint/Keynote
- Collaborative diagram editing

## Acceptance Criteria

- [ ] Mermaid code blocks render as actual diagrams (not raw text)
- [ ] Mermaid diagrams use dark theme matching MAC Design System
- [ ] AI includes mermaid when response involves workflow/architecture/process
- [ ] "Improve this diagram" button appears below mermaid diagrams
- [ ] Clicking upgrade button generates Nano Banana Pro image
- [ ] Generated image displays in expandable container with zoom/download
- [ ] Non-diagram responses do NOT show diagram prompts (no false positives)
- [ ] Loading state shown during Nano Banana Pro generation
- [ ] Error handling for failed generation

## Success Metrics

| Metric | Target |
|--------|--------|
| Mermaid render time | < 100ms client-side |
| Nano Banana Pro generation | < 15s |
| False positive rate | < 5% (diagrams offered when not useful) |
| User upgrade click rate | Track for demo feedback |

## Technical Notes

**Mermaid Integration:**
- Use `mermaid` npm package for client-side rendering
- Initialize with dark theme configuration
- Handle render errors gracefully (show raw code as fallback)

**Detection Logic:**
- Leverage existing `shouldOfferDiagram()` from DiagramOffer.tsx
- Keywords: workflow, process, steps, architecture, flow, pipeline, sequence
- Exclude: "I don't know" responses, short answers (< 100 chars)

**Nano Banana Pro:**
- Endpoint: `/api/diagram` (already exists)
- Model: `gemini-3-pro-image-preview`
- Pass mermaid source as context for better generation

## Dependencies

- `mermaid` npm package (add to dependencies)
- Existing `/api/diagram` endpoint (working)
- Existing `infographicService.ts` detection logic

## References

- B006 in features.json (Infographic/Diagram API Enhancement)
- Existing `DiagramOffer.tsx` component
- Existing `response-with-diagram.tsx` component
- `/api/diagram/route.ts` - Nano Banana Pro endpoint
