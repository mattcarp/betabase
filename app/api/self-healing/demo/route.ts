/**
 * Self-Healing Demo Trigger API
 *
 * Triggers a demo self-healing scenario using real selectors from the codebase.
 * This endpoint simulates a selector failure and healing process for demonstration.
 */

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";

// =============================================================================
// AOMA LOGIN BUTTON DEMO SCENARIOS - Three-Tier Self-Healing Demo
// =============================================================================
// These scenarios demonstrate the three-tier self-healing system using AOMA's
// login button as the application under test (AUT).
//
// TIER 1: Simple ID change (>90% confidence) - Auto-heals
// TIER 2: Position shift within tolerance (60-90% confidence) - Review queue
// TIER 3: Complete relocation (<60% confidence) - Architect review
// =============================================================================

interface DemoScenario {
  testName: string;
  testFile: string;
  originalSelector: string;
  domBefore: string;
  domAfter: string;
  scenario: string;
  tier: 1 | 2 | 3;
  expectedConfidence: number;
  demoNarrative: string;
}

const AOMA_LOGIN_SCENARIOS: DemoScenario[] = [
  // ==========================================================================
  // TIER 1: Simple ID Change - Auto-Heal
  // ==========================================================================
  {
    testName: "AOMA Login Button - ID Change",
    testFile: "tests/e2e/aoma/login.spec.ts",
    originalSelector: '[data-testid="button"]',
    domBefore: `<div class="login-form" style="display: flex; flex-direction: column; align-items: center; padding: 24px;">
  <h1>Welcome to AOMA</h1>
  <input type="text" placeholder="Username" />
  <input type="password" placeholder="Password" />
  <button data-testid="button" class="btn-primary" style="margin-top: 16px; padding: 12px 24px;">
    Log In
  </button>
</div>`,
    domAfter: `<div class="login-form" style="display: flex; flex-direction: column; align-items: center; padding: 24px;">
  <h1>Welcome to AOMA</h1>
  <input type="text" placeholder="Username" />
  <input type="password" placeholder="Password" />
  <button data-testid="login-button" class="btn-primary" style="margin-top: 16px; padding: 12px 24px;">
    Log In
  </button>
</div>`,
    scenario: "Developer renamed button ID from 'button' to 'login-button' for clarity",
    tier: 1,
    expectedConfidence: 0.96,
    demoNarrative: "The Playwright test looks for data-testid='button' but a developer renamed it to 'login-button'. The AI recognizes this is the SAME button - same position, same text, same function. This is a trivial change that should auto-heal immediately.",
  },

  // ==========================================================================
  // TIER 2: Position Shift Within Tolerance - Review Queue
  // ==========================================================================
  {
    testName: "AOMA Login Button - Position Shift",
    testFile: "tests/e2e/aoma/login.spec.ts",
    originalSelector: '[data-testid="login-button"]',
    domBefore: `<div class="login-form" style="display: flex; flex-direction: column; align-items: center; padding: 24px;">
  <h1>Welcome to AOMA</h1>
  <input type="text" placeholder="Username" />
  <input type="password" placeholder="Password" />
  <button data-testid="login-button" class="btn-primary" style="margin-top: 16px; padding: 12px 24px;">
    Log In
  </button>
</div>`,
    domAfter: `<div class="login-form" style="display: flex; flex-direction: column; align-items: center; padding: 24px;">
  <h1>Welcome to AOMA</h1>
  <input type="text" placeholder="Username" />
  <input type="password" placeholder="Password" />
  <div class="button-row" style="display: flex; gap: 12px; margin-top: 16px;">
    <button data-testid="login-button" class="btn-primary" style="padding: 12px 24px;">
      Log In
    </button>
    <button data-testid="forgot-password" class="btn-secondary" style="padding: 12px 24px;">
      Forgot Password?
    </button>
  </div>
</div>`,
    scenario: "Button moved into a button row with sibling - position shifted but ID unchanged",
    tier: 2,
    expectedConfidence: 0.78,
    demoNarrative: "The login button is still there with the same ID, but it moved into a button row container. The AI detects the structural change - within tolerance but flags for human review. The QA engineer should verify this is an intentional layout change, not a regression.",
  },

  // ==========================================================================
  // TIER 3: Complete Relocation - Architect Review
  // ==========================================================================
  {
    testName: "AOMA Login Button - Relocated to Sidebar",
    testFile: "tests/e2e/aoma/login.spec.ts",
    originalSelector: '[data-testid="login-button"]',
    domBefore: `<div class="login-page">
  <div class="main-content" style="display: flex; flex-direction: column; align-items: center; padding: 24px;">
    <h1>Welcome to AOMA</h1>
    <input type="text" placeholder="Username" />
    <input type="password" placeholder="Password" />
    <button data-testid="login-button" class="btn-primary" style="margin-top: 16px; padding: 12px 24px;">
      Log In
    </button>
  </div>
</div>`,
    domAfter: `<div class="login-page" style="display: flex;">
  <aside class="sidebar" style="position: fixed; top: 0; right: 0; width: 300px; padding: 24px; background: #1a1a2e;">
    <h2>Quick Access</h2>
    <button data-testid="login-button" class="btn-sidebar" style="width: 100%; padding: 12px;">
      Log In
    </button>
    <button data-testid="register-button" class="btn-sidebar" style="width: 100%; padding: 12px; margin-top: 8px;">
      Register
    </button>
  </aside>
  <div class="main-content" style="display: flex; flex-direction: column; align-items: center; padding: 24px; margin-right: 300px;">
    <h1>Welcome to AOMA</h1>
    <input type="text" placeholder="Username" />
    <input type="password" placeholder="Password" />
    <!-- Login button moved to sidebar -->
    <p class="help-text">Use the sidebar to log in</p>
  </div>
</div>`,
    scenario: "Major UI redesign - login button moved from center form to upper-right sidebar",
    tier: 3,
    expectedConfidence: 0.42,
    demoNarrative: "Whoa - the login button moved from the main form to a completely different location in the upper-right sidebar! The AI finds a button with the same ID but low confidence because the context is completely different. This needs architect review - is this intentional? Should the test be rewritten? The HITL queue captures this for expert judgment.",
  },
];

// Legacy scenarios for variety (can be triggered with scenarioIndex >= 3)
const LEGACY_SCENARIOS: DemoScenario[] = [
  {
    testName: "AOMA Asset Search Toggle",
    testFile: "tests/e2e/aoma/asset-search.spec.ts",
    originalSelector: '[data-testid="mcp-enable-toggle"]',
    domBefore: '<button data-testid="mcp-enable-toggle" class="toggle-btn">Enable MCP</button>',
    domAfter: '<button data-testid="mcp-toggle-switch" class="toggle-switch">Enable MCP</button>',
    scenario: "Component library upgrade changed toggle implementation",
    tier: 1,
    expectedConfidence: 0.92,
    demoNarrative: "Simple data-testid rename during component library upgrade.",
  },
  {
    testName: "Error Boundary Recovery",
    testFile: "tests/e2e/components/error-boundary.spec.ts",
    originalSelector: '[data-testid="reload-button"]',
    domBefore: '<button data-testid="reload-button">Reload Page</button>',
    domAfter: '<button data-testid="error-reload-btn" class="mac-btn">Try Again</button>',
    scenario: "MAC Design System migration renamed components",
    tier: 1,
    expectedConfidence: 0.89,
    demoNarrative: "Design system migration renamed the reload button.",
  },
  {
    testName: "Voice Interrupt Flow",
    testFile: "tests/e2e/voice/interrupt.spec.ts",
    originalSelector: '[data-testid="interrupt-button"]',
    domBefore: '<button data-testid="interrupt-button" aria-label="Stop">Interrupt</button>',
    domAfter: '<button data-testid="voice-stop-btn" aria-label="Stop Recording">Stop</button>',
    scenario: "Voice UI redesign for accessibility improvements",
    tier: 2,
    expectedConfidence: 0.74,
    demoNarrative: "Voice UI accessibility improvements changed button text and ID.",
  },
];

// Combined scenarios - AOMA login scenarios first for easy demo access
const DEMO_SCENARIOS = [...AOMA_LOGIN_SCENARIOS, ...LEGACY_SCENARIOS];

// POST - Trigger a demo healing scenario
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { scenarioIndex, useRealAI = true, tier: requestedTier } = body;

    // Pick scenario based on tier if specified, otherwise by index
    let idx: number;
    if (requestedTier !== undefined) {
      // Find first scenario matching the requested tier
      idx = DEMO_SCENARIOS.findIndex(s => s.tier === requestedTier);
      if (idx === -1) idx = 0;
    } else if (scenarioIndex !== undefined) {
      idx = Math.min(scenarioIndex, DEMO_SCENARIOS.length - 1);
    } else {
      // Random from AOMA scenarios (first 3)
      idx = Math.floor(Math.random() * 3);
    }

    const scenario = DEMO_SCENARIOS[idx];
    const startTime = Date.now();

    let healingResult: {
      suggestedSelector: string;
      confidence: number;
      healingStrategy: string;
      rationale: string;
      tokensUsed?: number;
    };

    if (useRealAI) {
      // Use real Gemini 3 Pro for healing
      healingResult = await performDemoHealing(scenario);
    } else {
      // Use mock response with expected values from scenario
      const newTestId = scenario.domAfter.match(/data-testid="([^"]+)"/)?.[1];
      healingResult = {
        suggestedSelector: newTestId
          ? `[data-testid="${newTestId}"]`
          : scenario.originalSelector,
        confidence: scenario.expectedConfidence,
        healingStrategy: "selector-update",
        rationale: scenario.demoNarrative,
      };
    }

    const executionTimeMs = Date.now() - startTime;

    // Use expected tier from scenario for consistent demo behavior
    const tier = scenario.tier;
    // Adjust confidence to match tier if AI returned something different
    const confidence = useRealAI ? healingResult.confidence : scenario.expectedConfidence;

    // Determine similar tests affected based on tier
    const similarTestsAffected = tier === 1 ? Math.floor(Math.random() * 5) + 3
      : tier === 2 ? Math.floor(Math.random() * 3) + 1
      : 0;

    // Create the healing attempt record
    const attemptRecord = {
      test_name: scenario.testName,
      test_file: scenario.testFile,
      status: tier === 1 ? "success" : "review",
      tier,
      confidence,
      original_selector: scenario.originalSelector,
      suggested_selector: healingResult.suggestedSelector,
      selector_type: "data-testid",
      dom_changes: [{
        type: tier === 3 ? "structure_changed" : "attribute_changed",
        attribute: "data-testid",
        before: scenario.originalSelector,
        after: healingResult.suggestedSelector,
        context: scenario.scenario,
      }],
      dom_snapshot_before: scenario.domBefore,
      dom_snapshot_after: scenario.domAfter,
      healing_strategy: tier === 3 ? "structure-adaptation" : healingResult.healingStrategy,
      healing_rationale: healingResult.rationale,
      similar_tests_affected: similarTestsAffected,
      affected_test_files: [scenario.testFile],
      code_before: `await page.click('${scenario.originalSelector}');`,
      code_after: `await page.click('${healingResult.suggestedSelector}');`,
      execution_time_ms: executionTimeMs,
      retry_count: 0,
      ai_model: "gemini-3-pro-preview",
      ai_tokens_used: healingResult.tokensUsed,
      organization: "sony-music",
      healed_at: tier === 1 ? new Date().toISOString() : null,
    };

    // Try to save to database
    if (supabaseAdmin) {
      const { data, error } = await supabaseAdmin
        .from("self_healing_attempts")
        .insert(attemptRecord)
        .select()
        .single();

      if (!error && data) {
        return NextResponse.json({
          ...data,
          scenario: scenario.scenario,
          demo: true,
        }, { status: 201 });
      }
    }

    // Return demo response if database unavailable
    return NextResponse.json({
      id: `demo_${Date.now()}`,
      ...attemptRecord,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      scenario: scenario.scenario,
      demo: true,
      demoNarrative: scenario.demoNarrative,
      tierDescription: tier === 1
        ? "Tier 1: Auto-heal - High confidence change, no human intervention needed"
        : tier === 2
          ? "Tier 2: Review Queue - Medium confidence, queued for QA review"
          : "Tier 3: Architect Review - Low confidence, major structural change detected",
      message: "Demo healing triggered successfully",
    }, { status: 201 });

  } catch (error) {
    console.error("Demo trigger error:", error);
    return NextResponse.json(
      { error: "Failed to trigger demo healing" },
      { status: 500 }
    );
  }
}

// GET - List available demo scenarios
export async function GET() {
  return NextResponse.json({
    scenarios: DEMO_SCENARIOS.map((s, i) => ({
      index: i,
      testName: s.testName,
      testFile: s.testFile,
      scenario: s.scenario,
      originalSelector: s.originalSelector,
      tier: s.tier,
      expectedConfidence: s.expectedConfidence,
      demoNarrative: s.demoNarrative,
      tierDescription: s.tier === 1
        ? "Tier 1: Auto-heal (>90% confidence)"
        : s.tier === 2
          ? "Tier 2: Review Queue (60-90% confidence)"
          : "Tier 3: Architect Review (<60% confidence)",
    })),
    count: DEMO_SCENARIOS.length,
    aomaScenarios: AOMA_LOGIN_SCENARIOS.length,
    usage: {
      triggerTier1: 'POST /api/self-healing/demo { "tier": 1, "useRealAI": false }',
      triggerTier2: 'POST /api/self-healing/demo { "tier": 2, "useRealAI": false }',
      triggerTier3: 'POST /api/self-healing/demo { "tier": 3, "useRealAI": false }',
      triggerRandom: 'POST /api/self-healing/demo { "useRealAI": false }',
      triggerWithAI: 'POST /api/self-healing/demo { "tier": 1, "useRealAI": true }',
    },
  });
}

// Perform real AI healing for demo
async function performDemoHealing(scenario: typeof DEMO_SCENARIOS[0]): Promise<{
  suggestedSelector: string;
  confidence: number;
  healingStrategy: string;
  rationale: string;
  tokensUsed?: number;
}> {
  try {
    const google = createGoogleGenerativeAI({
      apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    });

    const prompt = `You are an expert Playwright test engineer. A test selector has broken.

ORIGINAL SELECTOR: ${scenario.originalSelector}
TEST FILE: ${scenario.testFile}

DOM BEFORE (working):
${scenario.domBefore}

DOM AFTER (broken):
${scenario.domAfter}

CHANGE CONTEXT: ${scenario.scenario}

Analyze the DOM change and provide a JSON response with:
1. suggestedSelector: The new selector that should work (prefer data-testid if available)
2. confidence: A number 0-1 indicating confidence (be realistic - minor data-testid renames should be ~0.95)
3. healingStrategy: One of "selector-update", "wait-strategy", "structure-adaptation", "data-fix"
4. rationale: Brief explanation of the change and fix

Respond ONLY with valid JSON.`;

    const result = await generateText({
      model: google("gemini-3-pro-preview"),
      prompt,
    });

    const responseText = result.text.trim();
    const cleanJson = responseText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(cleanJson);

    return {
      suggestedSelector: parsed.suggestedSelector,
      confidence: Math.max(0, Math.min(1, parsed.confidence)),
      healingStrategy: parsed.healingStrategy || "selector-update",
      rationale: parsed.rationale,
      tokensUsed: result.usage?.totalTokens,
    };
  } catch (error) {
    console.error("AI demo healing error:", error);
    // Fallback
    const newTestId = scenario.domAfter.match(/data-testid="([^"]+)"/)?.[1];
    return {
      suggestedSelector: newTestId ? `[data-testid="${newTestId}"]` : scenario.originalSelector,
      confidence: 0.85,
      healingStrategy: "selector-update",
      rationale: `Detected data-testid change. ${scenario.scenario}`,
    };
  }
}
