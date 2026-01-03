# Tasks: FEAT-014 Smart Diagrams

**CRITICAL: Test after EVERY task. Do not proceed to the next task until the current one is verified working.**

---

## Phase 1: Mermaid Rendering Foundation

### Task 1: Install Mermaid Package

**Goal:** Add mermaid.js to the project

**Steps:**
1. Install mermaid package: `pnpm add mermaid`
2. Verify installation in package.json
3. Check for any peer dependency warnings

**TEST CHECKPOINT:**
```bash
pnpm add mermaid
grep mermaid package.json
npm run type-check
```

**Exit Criteria:** Package installed, no type errors.

---

### Task 2: Create MermaidDiagram Component

**Goal:** Create a reusable component that renders mermaid syntax as SVG

**File:** `src/components/ai-elements/mermaid-diagram.tsx`

**Requirements:**
- Use dynamic import to avoid bundle bloat
- Dark theme matching MAC Design System colors
- Error boundary for invalid mermaid syntax
- Fallback to raw code on render failure
- Unique ID generation for each diagram

**Theme Configuration:**
```typescript
const darkTheme = {
  theme: 'dark',
  themeVariables: {
    primaryColor: '#26c6da',      // Teal primary
    primaryTextColor: '#f5f5f5',
    primaryBorderColor: 'rgba(255,255,255,0.08)',
    lineColor: '#a855f7',         // Purple for lines
    secondaryColor: '#1e1e2e',
    tertiaryColor: '#0d0d0d',
    background: '#0a0a0a',
    mainBkg: '#1e1e2e',
    nodeBorder: 'rgba(255,255,255,0.12)',
    clusterBkg: '#1a1a2e',
    titleColor: '#f5f5f5',
    edgeLabelBackground: '#1e1e2e',
  }
};
```

**TEST CHECKPOINT:**
```bash
# Create a test page or use existing
# Render a simple mermaid diagram
npm run dev
# Navigate to a page with mermaid content
# VERIFY: Diagram renders as SVG, not raw text
# VERIFY: Dark theme applied
# VERIFY: No console errors
```

**Exit Criteria:** Mermaid diagrams render with dark theme.

---

### Task 3: Integrate Mermaid into CodeBlock

**Goal:** Make code blocks with `language="mermaid"` render as diagrams

**File:** `src/components/ai-elements/code-block.tsx`

**Changes:**
1. Import MermaidDiagram component (dynamic)
2. Check if `language === "mermaid"`
3. If mermaid, render MermaidDiagram instead of pre/code
4. Otherwise, render existing code block

**Code Pattern:**
```tsx
if (language === 'mermaid') {
  return <MermaidDiagram code={code} className={className} />;
}
// ... existing code block rendering
```

**TEST CHECKPOINT:**
```bash
npm run dev
# Ask AI a question that returns mermaid (or use seed data)
# VERIFY: Mermaid code blocks render as diagrams
# VERIFY: Non-mermaid code blocks still render as code
# VERIFY: No regression in normal code block behavior
```

**Exit Criteria:** Mermaid auto-renders, other code blocks unaffected.

---

## Phase 2: Upgrade Button

### Task 4: Create DiagramUpgradeButton Component

**Goal:** Subtle CTA below mermaid diagrams to upgrade to pro version

**File:** `src/components/ai-elements/diagram-upgrade-button.tsx`

**Requirements:**
- Subtle styling (italic, muted text, small)
- States: idle, loading, error
- Loading spinner during generation
- Pass click handler to parent

**Design:**
```
Improve this diagram →
```

When loading:
```
Generating professional diagram...
```

**TEST CHECKPOINT:**
```bash
# Add button to MermaidDiagram component
# VERIFY: Button appears below diagram
# VERIFY: Hover state works
# VERIFY: Clicking triggers callback
# VERIFY: Button matches MAC Design System
```

**Exit Criteria:** Button visible, clickable, properly styled.

---

### Task 5: Wire Upgrade Button to MermaidDiagram

**Goal:** Connect upgrade button to the mermaid diagram component

**File:** `src/components/ai-elements/mermaid-diagram.tsx`

**Changes:**
1. Add `onUpgrade` prop to MermaidDiagram
2. Add state for upgrade status (idle/loading/ready/error)
3. Include DiagramUpgradeButton below SVG
4. Pass mermaid source code in upgrade callback

**TEST CHECKPOINT:**
```bash
# VERIFY: Button appears below every mermaid diagram
# VERIFY: Clicking button logs mermaid source (for now)
# VERIFY: No errors in console
```

**Exit Criteria:** Upgrade button integrated into mermaid component.

---

## Phase 3: Nano Banana Pro Integration

### Task 6: Create ProDiagramPanel Component

**Goal:** Display Nano Banana Pro generated image with controls

**File:** `src/components/ai-elements/pro-diagram-panel.tsx`

**Requirements:**
- Expandable/collapsible container
- Loading state with spinner
- Generated image display
- Zoom in/out controls
- Download button
- Close/collapse button
- Error state with retry

**Reuse:** Borrow patterns from existing `response-with-diagram.tsx`

**TEST CHECKPOINT:**
```bash
# Create with mock image data
# VERIFY: Panel expands/collapses
# VERIFY: Zoom controls work
# VERIFY: Download works
# VERIFY: Matches MAC Design System
```

**Exit Criteria:** Panel displays image with all controls working.

---

### Task 7: Wire Nano Banana Pro API Call

**Goal:** Connect upgrade button to `/api/diagram` endpoint

**File:** `src/components/ai-elements/mermaid-diagram.tsx`

**Changes:**
1. On upgrade click, call `/api/diagram` POST
2. Send: `{ prompt: "Improve this diagram", context: mermaidSource, type: "workflow" }`
3. Handle response: extract base64 image
4. Display in ProDiagramPanel
5. Handle errors gracefully

**API Call:**
```typescript
const response = await fetch('/api/diagram', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prompt: 'Create a professional, polished version of this diagram',
    context: mermaidSource,
    type: detectDiagramType(mermaidSource), // workflow or explainer
  }),
});
```

**TEST CHECKPOINT:**
```bash
npm run dev
# Find a mermaid diagram
# Click "Improve this diagram"
# VERIFY: Loading state appears
# VERIFY: Pro diagram generates (may take 10-15s)
# VERIFY: Image displays correctly
# VERIFY: Zoom/download work
```

**Exit Criteria:** Full flow from mermaid to pro diagram works.

---

## Phase 4: AI Integration

### Task 8: Enhance System Prompt for Mermaid Generation

**Goal:** Make AI include mermaid diagrams for appropriate responses

**File:** `src/app/api/chat/route.ts` (or system prompt config)

**Addition to system prompt:**
```
DIAGRAM GUIDELINES:
When explaining workflows, architectures, multi-step processes, or system relationships,
include a mermaid diagram to visualize the concept. Use appropriate mermaid syntax:
- flowchart TB/LR for workflows and processes
- sequenceDiagram for interaction flows
- graph TD for hierarchies and relationships
- stateDiagram for state machines

Only include diagrams when they genuinely aid understanding. Do NOT add diagrams for:
- Simple factual answers
- Short responses (< 3 paragraphs)
- Questions you cannot answer
- Lists without relationships
```

**TEST CHECKPOINT:**
```bash
npm run dev
# Ask: "How does AOMA asset ingestion work?"
# VERIFY: Response includes mermaid diagram
# Ask: "What is AOMA?"
# VERIFY: Simple response, NO diagram (unless complex)
# Ask: "What's the difference between offers and assets?"
# VERIFY: May include comparison diagram
```

**Exit Criteria:** AI includes diagrams appropriately, not excessively.

---

## Phase 5: Polish & Testing

### Task 9: Add Diagram Type Detection

**Goal:** Detect mermaid diagram type for better Nano Banana Pro prompts

**File:** `src/components/ai-elements/mermaid-diagram.tsx`

**Logic:**
```typescript
function detectDiagramType(code: string): 'workflow' | 'explainer' {
  if (code.includes('sequenceDiagram')) return 'workflow';
  if (code.includes('flowchart') || code.includes('graph')) return 'workflow';
  if (code.includes('stateDiagram')) return 'workflow';
  return 'explainer';
}
```

**Exit Criteria:** Correct type passed to Nano Banana Pro.

---

### Task 10: Error Handling & Edge Cases

**Goal:** Graceful handling of all failure modes

**Test Cases:**
1. Invalid mermaid syntax → Show raw code with error message
2. Nano Banana Pro timeout → Show retry button
3. Nano Banana Pro rate limit → Show informative error
4. Empty mermaid block → Don't render anything
5. Very large diagram → Ensure scrollable

**TEST CHECKPOINT:**
```bash
# Test each failure mode
# VERIFY: User sees helpful error message
# VERIFY: No uncaught exceptions
# VERIFY: App doesn't crash
```

**Exit Criteria:** All error cases handled gracefully.

---

### Task 11: Performance Optimization

**Goal:** Ensure mermaid doesn't bloat bundle or slow rendering

**Checks:**
1. Mermaid is dynamically imported (not in main bundle)
2. Diagrams render in < 100ms
3. No memory leaks from repeated rendering
4. Bundle size increase is reasonable (< 50KB gzipped for mermaid chunk)

**Commands:**
```bash
npm run build
# Check bundle analyzer output
# Verify mermaid is in separate chunk
```

**Exit Criteria:** Bundle size acceptable, render performance good.

---

### Task 12: Final Integration Test

**Goal:** Full end-to-end demo flow works

**Demo Script:**
1. Start fresh chat
2. Ask: "Walk me through the AOMA multi-tenant architecture"
3. VERIFY: Response includes mermaid diagram
4. VERIFY: Diagram renders correctly (dark theme)
5. Click "Improve this diagram"
6. VERIFY: Loading state appears
7. VERIFY: Pro diagram generates
8. VERIFY: Zoom, download work
9. VERIFY: No console errors throughout

**Exit Criteria:** Full demo flow works flawlessly.

---

## Summary

| Task | Description | Estimate |
|------|-------------|----------|
| 1 | Install mermaid package | 5 min |
| 2 | Create MermaidDiagram component | 45 min |
| 3 | Integrate into CodeBlock | 20 min |
| 4 | Create DiagramUpgradeButton | 20 min |
| 5 | Wire upgrade to MermaidDiagram | 15 min |
| 6 | Create ProDiagramPanel | 30 min |
| 7 | Wire Nano Banana Pro API | 30 min |
| 8 | Enhance system prompt | 15 min |
| 9 | Add diagram type detection | 10 min |
| 10 | Error handling | 30 min |
| 11 | Performance optimization | 20 min |
| 12 | Final integration test | 20 min |
| **Total** | | **~4-5 hours** |

---

**REMEMBER: Test after each task. Do not skip verification steps!**
