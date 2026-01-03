# Plan: FEAT-014 Smart Diagrams

## Implementation Phases

### Phase 1: Mermaid Rendering (Core Foundation)

**Goal:** Make mermaid code blocks render as actual diagrams

**Approach:**
1. Install `mermaid` package
2. Create `MermaidDiagram` component with dark theme
3. Modify `code-block.tsx` to detect `language="mermaid"` and render via MermaidDiagram
4. Handle render errors gracefully (fallback to raw code)

**Files to modify:**
- `package.json` - add mermaid dependency
- `src/components/ai-elements/code-block.tsx` - add mermaid detection
- NEW: `src/components/ai-elements/mermaid-diagram.tsx` - mermaid renderer

**Risk:** Mermaid.js is a large library. Use dynamic import to avoid bundle bloat.

---

### Phase 2: "Improve This Diagram" Button

**Goal:** Add upgrade CTA below mermaid diagrams

**Approach:**
1. Create `DiagramUpgradeButton` component
2. Style as subtle, non-intrusive (italic text, muted color)
3. Pass mermaid source code to parent for upgrade flow
4. Add loading state for when Nano Banana Pro is generating

**Files to modify:**
- NEW: `src/components/ai-elements/diagram-upgrade-button.tsx`
- `src/components/ai-elements/mermaid-diagram.tsx` - include upgrade button

**Design:**
```
┌─────────────────────────────────────┐
│                                     │
│     [Rendered Mermaid Diagram]      │
│                                     │
└─────────────────────────────────────┘
       Improve this diagram →
```

---

### Phase 3: Nano Banana Pro Integration

**Goal:** Wire upgrade button to generate professional diagram

**Approach:**
1. On upgrade click, call `/api/diagram` with:
   - `prompt`: Generate based on this diagram
   - `context`: The mermaid source code
   - `type`: "workflow" or "explainer" based on mermaid type
2. Display generated image in expandable panel
3. Add zoom, download, collapse controls

**Files to modify:**
- `src/components/ai-elements/mermaid-diagram.tsx` - add upgrade handler
- Reuse existing `ResponseWithDiagram` image display logic

---

### Phase 4: AI System Prompt Enhancement

**Goal:** Make AI include mermaid diagrams when appropriate

**Approach:**
1. Add instruction to system prompt for diagram-worthy responses
2. Use existing detection keywords (workflow, architecture, process, etc.)
3. Ensure AI doesn't over-use diagrams (conservative approach)

**System prompt addition:**
```
When explaining workflows, architectures, processes, or step-by-step procedures,
include a mermaid diagram to visualize the concept. Use flowchart, sequence, or
graph syntax as appropriate. Only include diagrams when they genuinely aid
understanding - not for simple factual answers.
```

**Files to modify:**
- `src/app/api/chat/route.ts` or system prompt configuration

---

### Phase 5: Polish & Integration

**Goal:** Ensure everything works smoothly in the chat flow

**Approach:**
1. Test with various diagram-worthy queries
2. Verify non-diagram queries don't get diagrams
3. Test error states (mermaid syntax errors, API failures)
4. Performance check (mermaid render time, bundle size)
5. MAC Design System compliance check

---

## Architecture Decision: Component Structure

```
Response (AI message)
  └── MermaidDiagram (renders mermaid code blocks)
        ├── Rendered SVG (mermaid.js output)
        ├── DiagramUpgradeButton ("Improve this diagram")
        └── ProDiagramPanel (when upgraded)
              ├── Loading state
              ├── Generated image
              └── Controls (zoom, download, collapse)
```

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Mermaid bundle size | Dynamic import, code split |
| Mermaid syntax errors | Try/catch, fallback to raw code |
| AI over-generates diagrams | Conservative system prompt, user testing |
| Nano Banana Pro slow/fails | Loading state, retry button, graceful error |
| False positives | Use existing detection logic from infographicService |

## Estimated Effort

| Phase | Effort | Priority |
|-------|--------|----------|
| Phase 1: Mermaid Rendering | 2 hours | P0 |
| Phase 2: Upgrade Button | 1 hour | P0 |
| Phase 3: Nano Banana Pro | 1.5 hours | P1 |
| Phase 4: System Prompt | 30 min | P1 |
| Phase 5: Polish | 1 hour | P1 |
| **Total** | **~6 hours** | |

## Demo Script

1. Ask: "How does AOMA asset ingestion work?"
2. Show: AI response with mermaid diagram rendering inline
3. Point out: "Improve this diagram" button
4. Click: Watch Nano Banana Pro generate professional version
5. Demo: Zoom, download features
6. Compare: Before (mermaid) vs After (pro)
