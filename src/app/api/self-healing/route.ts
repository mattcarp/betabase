/**
 * Self-Healing Tests API
 *
 * Handles self-healing test attempt management.
 * Integrates with Gemini 3 Pro for AI-powered selector healing.
 *
 * Endpoints:
 * - GET: Retrieve healing attempts with filters
 * - POST: Trigger a new healing attempt
 */

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";

// Types for self-healing
export interface SelfHealingAttempt {
  id: string;
  test_name: string;
  test_file: string;
  test_line_number?: number;
  status: "detecting" | "analyzing" | "healing" | "testing" | "success" | "failed" | "review" | "approved" | "rejected";
  tier: 1 | 2 | 3;
  confidence: number;
  original_selector: string;
  suggested_selector?: string;
  selector_type?: string;
  dom_changes?: any[];
  dom_snapshot_before?: string;
  dom_snapshot_after?: string;
  healing_strategy?: "selector-update" | "wait-strategy" | "structure-adaptation" | "data-fix";
  healing_rationale?: string;
  similar_tests_affected: number;
  affected_test_files?: string[];
  code_before?: string;
  code_after?: string;
  diff_hunks?: any[];
  execution_time_ms?: number;
  retry_count: number;
  ai_model: string;
  ai_tokens_used?: number;
  error_message?: string;
  error_stack?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  reviewer_notes?: string;
  organization: string;
  created_at: string;
  updated_at: string;
  healed_at?: string;
}

// Calculate tier from confidence score
function calculateTier(confidence: number): 1 | 2 | 3 {
  if (confidence > 0.9) return 1;
  if (confidence >= 0.6) return 2;
  return 3;
}

// GET - Retrieve healing attempts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const status = searchParams.get("status");
    const tier = searchParams.get("tier");
    const testFile = searchParams.get("testFile");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const includeStats = searchParams.get("stats") === "true";

    // Check if supabaseAdmin is available
    if (!supabaseAdmin) {
      // Return demo data when database not configured
      return NextResponse.json({
        attempts: getDemoAttempts(),
        stats: getDemoStats(),
        message: "Database not configured - returning demo data",
      });
    }

    let query = supabaseAdmin
      .from("self_healing_attempts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (status) {
      query = query.eq("status", status);
    }

    if (tier) {
      query = query.eq("tier", parseInt(tier));
    }

    if (testFile) {
      query = query.ilike("test_file", `%${testFile}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Self-healing fetch error:", error);
      // Return demo data if table doesn't exist
      if (error.code === "42P01") {
        return NextResponse.json({
          attempts: getDemoAttempts(),
          stats: getDemoStats(),
          message: "Table not yet created - returning demo data",
        });
      }
      return NextResponse.json(
        { error: "Failed to fetch healing attempts" },
        { status: 500 }
      );
    }

    // Get stats if requested
    let stats = null;
    if (includeStats) {
      const { data: statsData } = await supabaseAdmin.rpc("get_self_healing_analytics", { p_days: 14 });
      stats = statsData?.[0] || getDemoStats();
    }

    return NextResponse.json({ attempts: data || [], stats });
  } catch (error) {
    console.error("Self-healing fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Trigger a new healing attempt
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      testName,
      testFile,
      testLineNumber,
      originalSelector,
      selectorType,
      domSnapshotBefore,
      domSnapshotAfter,
      errorMessage,
      errorStack,
      codeContext,
      screenshot, // Base64 encoded screenshot
    } = body;

    // Validate required fields
    if (!testName || !testFile || !originalSelector) {
      return NextResponse.json(
        { error: "Missing required fields: testName, testFile, originalSelector" },
        { status: 400 }
      );
    }

    const startTime = Date.now();

    // Call the AI healing function
    const healingResult = await performAIHealing({
      originalSelector,
      selectorType,
      domSnapshotBefore,
      domSnapshotAfter,
      testFile,
      codeContext,
      screenshot,
    });

    const executionTimeMs = Date.now() - startTime;

    // Calculate tier based on confidence
    const tier = calculateTier(healingResult.confidence);

    // Determine status based on tier and confidence
    let status: SelfHealingAttempt["status"] = "review";
    if (tier === 1 && healingResult.confidence > 0.95) {
      status = "success"; // Auto-approve high confidence
    } else if (tier === 3) {
      status = "review"; // Architect review needed
    }

    // Create the healing attempt record
    const attemptRecord = {
      test_name: testName,
      test_file: testFile,
      test_line_number: testLineNumber,
      status,
      tier,
      confidence: healingResult.confidence,
      original_selector: originalSelector,
      suggested_selector: healingResult.suggestedSelector,
      selector_type: selectorType || detectSelectorType(originalSelector),
      dom_changes: healingResult.domChanges || [],
      dom_snapshot_before: domSnapshotBefore,
      dom_snapshot_after: domSnapshotAfter,
      healing_strategy: healingResult.healingStrategy,
      healing_rationale: healingResult.rationale,
      similar_tests_affected: healingResult.similarTestsAffected || 0,
      affected_test_files: healingResult.affectedTestFiles || [],
      code_before: codeContext,
      code_after: healingResult.codeAfter,
      execution_time_ms: executionTimeMs,
      retry_count: 0,
      ai_model: "gemini-3-pro-preview",
      ai_tokens_used: healingResult.tokensUsed,
      error_message: errorMessage,
      error_stack: errorStack,
      organization: "sony-music",
      healed_at: status === "success" ? new Date().toISOString() : null,
    };

    // Check if supabaseAdmin is available
    if (!supabaseAdmin) {
      // Return demo response when database not configured
      return NextResponse.json({
        id: `heal_demo_${Date.now()}`,
        ...attemptRecord,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        message: "Healing triggered (demo mode - database not configured)",
      }, { status: 201 });
    }

    // Insert into database
    const { data, error } = await supabaseAdmin
      .from("self_healing_attempts")
      .insert(attemptRecord)
      .select()
      .single();

    if (error) {
      console.error("Self-healing insert error:", error);
      // Return demo response for any database error
      return NextResponse.json({
        id: `heal_demo_${Date.now()}`,
        ...attemptRecord,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        message: `Healing triggered (demo mode - ${error.message || error.code || "database unavailable"})`,
      }, { status: 201 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Self-healing trigger error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Detect selector type from the selector string
function detectSelectorType(selector: string): string {
  if (selector.includes("data-testid")) return "data-testid";
  if (selector.startsWith("//") || selector.includes("xpath")) return "xpath";
  if (selector.includes("[role=")) return "role";
  if (selector.includes(":has-text(") || selector.includes("text=")) return "text";
  if (selector.includes("[aria-label")) return "label";
  return "css";
}

// AI-powered healing using Gemini 3 Pro
async function performAIHealing(params: {
  originalSelector: string;
  selectorType?: string;
  domSnapshotBefore?: string;
  domSnapshotAfter?: string;
  testFile: string;
  codeContext?: string;
  screenshot?: string; // Base64 encoded screenshot
}): Promise<{
  suggestedSelector: string;
  confidence: number;
  healingStrategy: "selector-update" | "wait-strategy" | "structure-adaptation" | "data-fix";
  rationale: string;
  domChanges?: any[];
  similarTestsAffected?: number;
  affectedTestFiles?: string[];
  codeAfter?: string;
  tokensUsed?: number;
}> {
  const google = createGoogleGenerativeAI({
    apiKey: process.env.GOOGLE_API_KEY,
  });

  // Construct the multi-modal prompt
  const textPrompt = `You are a world-class test automation engineer specializing in Playwright.
A test has failed. Your goal is to analyze the failure and provide a ROBUST, SELF-HEALING fix.

CONTEXT:
- Test File: ${params.testFile}
- Broken Selector: ${params.originalSelector}
- Selector Concept: ${params.selectorType || "unknown"}

DATA PROVIDED:
${params.domSnapshotBefore ? `- DOM (Working State available)` : ""}
${params.domSnapshotAfter ? `- DOM (Broken State available)` : ""}
${params.screenshot ? `- Screenshot (Visual State available)` : ""}
${params.codeContext ? `- Code Context:\n${params.codeContext}` : ""}

TASK:
1. Analyze the visual and DOM changes to understand WHY the selector failed.
2. Determine if the element was renamed, moved, replaced, or visual-only change.
3. Generate a NEW, ROBUST Playwright selector or code snippet to fix the test.
4. Provide a JSON response with your analysis and fix.

RESPONSE FORMAT (JSON ONLY):
{
  "suggestedSelector": "The new robust selector",
  "confidence": 0.0 to 1.0,
  "healingStrategy": "selector-update" | "wait-strategy" | "structure-adaptation" | "data-fix",
  "rationale": "Clear explanation of the fix",
  "domChanges": [{"type": "attribute_change", "details": "..."}],
  "similarTestsAffected": estimated_count,
  "codeAfter": "The complete replacement code line(s)"
}
`;

  try {
    const promptParts: any[] = [{ text: textPrompt }];
    
    // Add image if available
    if (params.screenshot) {
      // Remove data URL prefix if present
      const base64Image = params.screenshot.replace(/^data:image\/(png|jpeg|webp);base64,/, "");
      promptParts.push({ image: base64Image });
    }

    const { text, usage } = await generateText({
    model: google("gemini-3-pro-preview"), // Leveraging multimodal capabilities
      messages: [
        {
          role: 'user',
          content: promptParts,
        },
      ],
    });

    // Parse the JSON response
    const responseText = text.trim();
    // Remove any markdown code blocks if present
    const cleanJson = responseText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    const parsed = JSON.parse(cleanJson);

    return {
      suggestedSelector: parsed.suggestedSelector || params.originalSelector,
      confidence: Math.max(0, Math.min(1, parsed.confidence || 0.5)),
      healingStrategy: parsed.healingStrategy || "selector-update",
      rationale: parsed.rationale || "AI analysis completed",
      domChanges: parsed.domChanges || [],
      similarTestsAffected: parsed.similarTestsAffected || 1,
      affectedTestFiles: parsed.affectedTestFiles || [params.testFile],
      codeAfter: parsed.codeAfter || "",
      tokensUsed: usage.totalTokens,
    };
  } catch (error) {
    console.error("AI healing error:", error);
    // Fallback to heuristic healing
    return performHeuristicHealing(params);
  }
}

// Fallback heuristic healing when AI fails
function performHeuristicHealing(params: {
  originalSelector: string;
  selectorType?: string;
  testFile: string;
}): {
  suggestedSelector: string;
  confidence: number;
  healingStrategy: "selector-update" | "wait-strategy" | "structure-adaptation" | "data-fix";
  rationale: string;
  domChanges: any[];
  similarTestsAffected: number;
  affectedTestFiles: string[];
} {
  const { originalSelector, testFile } = params;

  // Simple heuristic: if data-testid, try role-based fallback
  if (originalSelector.includes("data-testid")) {
    const testIdMatch = originalSelector.match(/data-testid="([^"]+)"/);
    if (testIdMatch) {
      const testId = testIdMatch[1];
      // Convert testid to potential role/text selector
      const parts = testId.split("-");
      const elementType = parts[parts.length - 1]; // e.g., "button", "input"

      return {
        suggestedSelector: `[role="${elementType}"], button:has-text("${parts.slice(0, -1).join(" ")}")`,
        confidence: 0.4,
        healingStrategy: "selector-update",
        rationale: "Heuristic fallback: converted data-testid to role/text selector",
        domChanges: [{ type: "attribute_removed", attribute: "data-testid" }],
        similarTestsAffected: 1,
        affectedTestFiles: [testFile],
      };
    }
  }

  return {
    suggestedSelector: originalSelector,
    confidence: 0.2,
    healingStrategy: "selector-update",
    rationale: "Unable to determine fix - manual review required",
    domChanges: [],
    similarTestsAffected: 0,
    affectedTestFiles: [testFile],
  };
}

// Demo data for when database is not configured
function getDemoAttempts(): Partial<SelfHealingAttempt>[] {
  const now = new Date();
  return [
    {
      id: "demo-1",
      test_name: "AOMA Login Flow",
      test_file: "tests/e2e/aoma/login.spec.ts",
      status: "success",
      tier: 1,
      confidence: 0.95,
      original_selector: '[data-testid="login-submit-btn"]',
      suggested_selector: '[data-testid="login-submit-button"]',
      healing_strategy: "selector-update",
      healing_rationale: "Button renamed from 'btn' to 'button' in recent refactor",
      similar_tests_affected: 3,
      execution_time_ms: 2340,
      ai_model: "gemini-3-pro-preview",
      created_at: new Date(now.getTime() - 3600000).toISOString(),
    },
    {
      id: "demo-2",
      test_name: "Asset Search Filters",
      test_file: "tests/e2e/aoma/asset-search.spec.ts",
      status: "review",
      tier: 2,
      confidence: 0.72,
      original_selector: '.filter-dropdown >> nth=0',
      suggested_selector: '[data-testid="genre-filter-dropdown"]',
      healing_strategy: "selector-update",
      healing_rationale: "Positional selector replaced with explicit data-testid",
      similar_tests_affected: 7,
      execution_time_ms: 4120,
      ai_model: "gemini-3-pro-preview",
      created_at: new Date(now.getTime() - 7200000).toISOString(),
    },
    {
      id: "demo-3",
      test_name: "Catalog Navigation",
      test_file: "tests/e2e/aoma/catalog.spec.ts",
      status: "review",
      tier: 3,
      confidence: 0.45,
      original_selector: 'div.nav-tree >> li:has-text("Albums")',
      suggested_selector: '[role="treeitem"][aria-label*="Albums"]',
      healing_strategy: "structure-adaptation",
      healing_rationale: "Navigation tree restructured - needs architect review",
      similar_tests_affected: 12,
      execution_time_ms: 5890,
      ai_model: "gemini-3-pro-preview",
      created_at: new Date(now.getTime() - 10800000).toISOString(),
    },
  ];
}

function getDemoStats() {
  return {
    total_attempts: 1247,
    auto_healed: 1175,
    pending_review: 18,
    success_rate: 94.2,
    avg_heal_time_ms: 4200,
    total_tests_impacted: 3421,
    tier1_count: 1089,
    tier2_count: 134,
    tier3_count: 24,
  };
}
