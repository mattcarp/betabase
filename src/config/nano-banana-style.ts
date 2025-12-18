/**
 * 🍌 Nano Banana Pro - Global Style Template
 * 
 * This is THE master style definition for all Gemini-generated infographics.
 * Edit this ONCE, and every infographic inherits the style automatically.
 * 
 * 📝 TODO: Mattie, replace this placeholder with your written style guide!
 */

export const NANO_BANANA_BASE_STYLE = `
Visual Style (Mattie's Signature Aesthetic):
Minimal line art infographic, editorial layout, modern bold stick figures (not goofy - exciting and professional), dotted flow paths connecting stages, pastel accent colors, clean sans serif labels, process diagram, storytelling workflow, magazine editorial style.

Bold, playful, fun, and modern. Flat design with interesting visual elements that pop. Stick figure humans should be simple but energetic and contemporary - think modern tech company presentation style, not sketchy or childish.

Complete creative freedom. Make it exciting!

Technical specs: 16:9 aspect ratio, 2K resolution for clarity.
`;

/**
 * Diagram-type specific style additions
 */
const DIAGRAM_TYPE_STYLES = {
  erd: `
  Additional for ERDs:
  - Show hierarchical relationships top-to-bottom
  - Use connecting arrows with labels
  - Show data isolation barriers (padlocks, crossed barriers)
  - Cloud or rounded shapes for entities
  - Clear tier labeling with badges/callouts
  `,
  
  process: `
  Additional for Process Diagrams:
  - Sequential steps numbered 1, 2, 3, 4
  - Decision points as diamonds or branching paths
  - Color-code phases (e.g., prep=blue, upload=green, archive=purple)
  - Show flow with directional arrows
  - Include success/error paths where relevant
  `,
  
  cycle: `
  Additional for Cyclical Diagrams:
  - Circular or loop layout
  - Arrows connecting back to start
  - Show continuous improvement/feedback concept
  - Use rotation or spiral visual pattern
  - Emphasize the virtuous cycle concept
  `,
  
  comparison: `
  Additional for Before/After or A/B Comparisons:
  - Side-by-side or top/bottom split
  - Clear visual separator
  - Use ✅ and ❌ icons for good/bad
  - Before state in muted colors, After in vibrant
  - Arrows showing improvement or change
  `
};

/**
 * Build a complete Nano Banana prompt with user content + type-specific + global style
 */
export function buildNanoBananaPrompt(
  userContent: string,
  diagramType?: keyof typeof DIAGRAM_TYPE_STYLES
): string {
  const typeStyle = diagramType ? DIAGRAM_TYPE_STYLES[diagramType] : '';
  
  return `${userContent}

${typeStyle}

${NANO_BANANA_BASE_STYLE}`.trim();
}

/**
 * Quick templates for common demo diagrams
 */
export const DEMO_TEMPLATES = {
  betabaseERD: (organizations: string[] = ['Sony Music', 'SMEJ (Sony Music Entertainment Japan)', 'Other Music']) => 
    buildNanoBananaPrompt(`
      Create an infographic showing The Betabase's three-tier multi-tenant database architecture:
      - Organization Level (top tier): ${organizations.join(', ')}
        * Sony Music (left) - use real Sony Music logo/branding
        * SMEJ / Sony Music Entertainment Japan (center) - use real SMEJ logo
        * Other Music (right) - create a modern, playful music company logo for this fictional company
      - Division Level (middle tier): Digital Operations, Legal, Finance
      - Application Under Test Level (bottom tier): AOMA, Alexandria, USM, Confluence
      Show data isolation between organizations with barriers/padlocks.
      Use arrows showing the hierarchy.
      Title: "The Betabase: Three-Tier Multi-Tenant Database Architecture"
    `, 'erd'),
  
  rlhfLoop: () =>
    buildNanoBananaPrompt(`
      Create a cyclical diagram showing the RLHF feedback loop with 4 steps:
      1. "AI Response" - chat bubble with sample text
      2. "Human Feedback" - thumbs up/down icons, star rating  
      3. "Embedding Re-weight" - brain icon with neural network weights adjusting
      4. "Better Retrieval" - improved search results, checkmarks
      Connect with circular arrows back to step 1.
      Title: "RLHF Virtuous Cycle: Humans Train AI"
    `, 'cycle'),
  
  selfHealing: () =>
    buildNanoBananaPrompt(`
      Create a 4-step process diagram:
      1. "Test Fails" - Red X icon, example: "Selector '#login-btn' not found"
      2. "AI Analyzes" - Blue brain icon, "DOM diff: button moved to sidebar"
      3. "Fix Applied" - Purple wrench icon, "Selector updated"  
      4. "Test Passes" - Green checkmark, "95% confidence"
      
      Below the process, show three confidence tiers as horizontal bars:
      - Green: "Tier 1: Auto-Apply (90%+ confidence)"
      - Yellow: "Tier 2: QA Review (70-90% confidence)"
      - Red: "Tier 3: Architect Decision (<70% confidence)"
      
      Title: "Self-Healing Test Intelligence"
    `, 'process')
};

