# Multi-Tenant ERD Workflow

## Overview
The multi-tenant ERD shows the 3-tier hierarchy:
- **Tier 1**: Organizations (Sony Music, SMEJ, Sony Pictures)
- **Tier 2**: Divisions (Digital Operations - only under Sony Music)
- **Tier 3**: Applications (AOMA, Media Conversion, Promo - only under Digital Operations)

## How It Works

### Step 1: User Asks for ERD
User can trigger this by asking:
- "Show me the ERD"
- "What's the multi-tenant architecture?"
- "Entity relationship diagram"
- "Tenant structure"

### Step 2: AI Calls Tool
The AI automatically calls `getMultiTenantERD` tool which returns:
```json
{
  "title": "Multi-Tenant Hierarchy",
  "description": "3-level tenant structure...",
  "mermaidDiagram": "erDiagram\n    ORGANIZATION ||--o{ DIVISION...",
  "explanation": "Multiple organizations supported...",
  "nanoBananaProPrompt": "Create a professional multi-tenant..."
}
```

### Step 3: AI Renders Mermaid Diagram
The AI formats the response as:
````markdown
```mermaid
erDiagram
    ORGANIZATION ||--o{ DIVISION : "has many"
    DIVISION ||--o{ APPLICATION : "has many"
    ...
```
````

### Step 4: Mermaid Component Auto-Renders
The `<Response>` component detects `language="mermaid"` and uses `<MermaidDiagram>`:
- Renders SVG with dark theme
- Shows "Improve this diagram" button
- Starts generating NanoBanana Pro version in background

### Step 5: User Gets Enhanced Version (Optional)
When user clicks "Improve this diagram" or says "make it fancier":
- Shows loading state
- Displays enhanced NanoBanana Pro infographic with:
  - Sketchy/hand-drawn style
  - Soft pastel colors
  - Cloud shapes for organizations
  - Lock icons and red X marks for "ISOLATED DATA DOMAIN"
  - Stick figure people icons
  - Action words around boxes

## Files Changed

### Core Implementation
- `src/services/siamTools.ts` - Tool definition with Mermaid diagram and NanoBanana Pro prompt
- `src/app/api/chat/route.ts` - Registered siamTools in main chat route
- `src/components/ai-elements/response.tsx` - Detects mermaid code blocks
- `src/components/ai-elements/mermaid-diagram.tsx` - Renders Mermaid + NanoBanana Pro

### API Endpoint
- `src/app/api/diagram/route.ts` - NanoBanana Pro generation endpoint

## Testing

### Manual Test Flow
1. Start dev server: `infisical run --env=dev -- npx next dev -p 3000`
2. Navigate to chat
3. Ask: "Show me the ERD for the multi-tenant architecture"
4. Verify: Mermaid diagram renders as SVG
5. Click: "Improve this diagram" button
6. Verify: Enhanced infographic loads

### What Should Render
**Mermaid (Step 1):**
- Clean ERD with 3 tables
- Relationships shown with lines
- Dark theme with teal accents
- Zoom controls at bottom

**NanoBanana Pro (Step 2):**
- 3 cloud shapes at top (Sony Music, SMEJ, Sony Pictures)
- Only Sony Music flows downward
- SMEJ and Sony Pictures show "..." with no children
- Digital Operations box in middle
- 3 application boxes at bottom (AOMA, Media Conversion, Promo)
- Hand-drawn sketchy style with soft pastels

## Known Issues
- None currently!

## Previous Issues (Fixed)
- ✅ Tool wasn't registered in main chat route
- ✅ Mermaid diagrams showed as code instead of rendering
- ✅ Wrong diagram was being generated (generic architecture vs tenant structure)
