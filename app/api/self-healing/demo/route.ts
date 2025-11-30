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

// Real selectors from the SIAM codebase that could "break"
const DEMO_SCENARIOS = [
  {
    testName: "AOMA Asset Search",
    testFile: "tests/e2e/aoma/asset-search.spec.ts",
    originalSelector: '[data-testid="mcp-enable-toggle"]',
    domBefore: '<button data-testid="mcp-enable-toggle" class="toggle-btn">Enable MCP</button>',
    domAfter: '<button data-testid="mcp-toggle-switch" class="toggle-switch">Enable MCP</button>',
    scenario: "Component library upgrade changed toggle implementation",
  },
  {
    testName: "Error Boundary Recovery",
    testFile: "tests/e2e/components/error-boundary.spec.ts",
    originalSelector: '[data-testid="reload-button"]',
    domBefore: '<button data-testid="reload-button">Reload Page</button>',
    domAfter: '<button data-testid="error-reload-btn" class="mac-btn">Try Again</button>',
    scenario: "MAC Design System migration renamed components",
  },
  {
    testName: "Voice Interrupt Flow",
    testFile: "tests/e2e/voice/interrupt.spec.ts",
    originalSelector: '[data-testid="interrupt-button"]',
    domBefore: '<button data-testid="interrupt-button" aria-label="Stop">Interrupt</button>',
    domAfter: '<button data-testid="voice-stop-btn" aria-label="Stop Recording">Stop</button>',
    scenario: "Voice UI redesign for accessibility improvements",
  },
  {
    testName: "MCP Server Config",
    testFile: "tests/e2e/settings/mcp-config.spec.ts",
    originalSelector: '[data-testid="mcp-save-button"]',
    domBefore: '<button data-testid="mcp-save-button" type="submit">Save</button>',
    domAfter: '<button data-testid="config-submit" type="submit" class="mac-btn-primary">Save Configuration</button>',
    scenario: "Settings page unified button styling",
  },
  {
    testName: "Skeleton Loader Test",
    testFile: "tests/e2e/loading/skeleton.spec.ts",
    originalSelector: '[data-testid="skeleton-loader"]',
    domBefore: '<div data-testid="skeleton-loader" class="skeleton animate-pulse"></div>',
    domAfter: '<div data-testid="content-placeholder" class="mac-skeleton loading"></div>',
    scenario: "Loading state component refactor",
  },
];

// POST - Trigger a demo healing scenario
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { scenarioIndex, useRealAI = true } = body;

    // Pick a random scenario if not specified
    const idx = scenarioIndex !== undefined
      ? Math.min(scenarioIndex, DEMO_SCENARIOS.length - 1)
      : Math.floor(Math.random() * DEMO_SCENARIOS.length);

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
      // Use mock response for faster demos
      healingResult = {
        suggestedSelector: scenario.domAfter.match(/data-testid="([^"]+)"/)?.[1]
          ? `[data-testid="${scenario.domAfter.match(/data-testid="([^"]+)"/)?.[1]}"]`
          : scenario.originalSelector,
        confidence: 0.92,
        healingStrategy: "selector-update",
        rationale: `DOM analysis detected data-testid change. ${scenario.scenario}`,
      };
    }

    const executionTimeMs = Date.now() - startTime;

    // Calculate tier
    const tier = healingResult.confidence > 0.9 ? 1 : healingResult.confidence >= 0.6 ? 2 : 3;

    // Create the healing attempt record
    const attemptRecord = {
      test_name: scenario.testName,
      test_file: scenario.testFile,
      status: tier === 1 ? "success" : "review",
      tier,
      confidence: healingResult.confidence,
      original_selector: scenario.originalSelector,
      suggested_selector: healingResult.suggestedSelector,
      selector_type: "data-testid",
      dom_changes: [{
        type: "attribute_changed",
        attribute: "data-testid",
        before: scenario.originalSelector,
        after: healingResult.suggestedSelector,
      }],
      dom_snapshot_before: scenario.domBefore,
      dom_snapshot_after: scenario.domAfter,
      healing_strategy: healingResult.healingStrategy,
      healing_rationale: healingResult.rationale,
      similar_tests_affected: Math.floor(Math.random() * 8) + 1,
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
    })),
    count: DEMO_SCENARIOS.length,
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
