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
  status:
    | "detecting"
    | "analyzing"
    | "healing"
    | "testing"
    | "success"
    | "failed"
    | "review"
    | "approved"
    | "rejected";
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
      return NextResponse.json({ error: "Failed to fetch healing attempts" }, { status: 500 });
    }

    // Get stats if requested
    let stats = null;
    if (includeStats) {
      const { data: statsData } = await supabaseAdmin.rpc("get_self_healing_analytics", {
        p_days: 14,
      });
      stats = statsData?.[0] || getDemoStats();
    }

    return NextResponse.json({ attempts: data || [], stats });
  } catch (error) {
    console.error("Self-healing fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
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
      return NextResponse.json(
        {
          id: `heal_demo_${Date.now()}`,
          ...attemptRecord,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          message: "Healing triggered (demo mode - database not configured)",
        },
        { status: 201 }
      );
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
      return NextResponse.json(
        {
          id: `heal_demo_${Date.now()}`,
          ...attemptRecord,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          message: `Healing triggered (demo mode - ${error.message || error.code || "database unavailable"})`,
        },
        { status: 201 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Self-healing trigger error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
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
          role: "user",

          parts: [{
            type: 'text',
            text: promptParts
          }]
        },
      ],
    });

    // Parse the JSON response
    const responseText = text.trim();
    // Remove any markdown code blocks if present
    const cleanJson = responseText
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

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

// Generate realistic demo data for the self-healing UX redesign demo
// This creates a compelling story with mixed statuses, tiers, and impact levels
function getDemoAttempts(): Partial<SelfHealingAttempt>[] {
  const now = new Date();

  return [
    // HIGH IMPACT - Tier 1 (Auto-approve candidates)
    {
      id: "heal-001",
      test_name: "Login Form Submit Button",
      test_file: "tests/e2e/auth/login.spec.ts",
      test_line_number: 42,
      status: "review",
      tier: 1,
      confidence: 0.97,
      original_selector: '[data-testid="login-btn"]',
      suggested_selector: '[data-testid="login-button-v2"]',
      selector_type: "data-testid",
      healing_strategy: "selector-update",
      healing_rationale:
        "The login button's data-testid attribute was renamed from 'login-btn' to 'login-button-v2' during the Q4 design system update. Semantic match confidence is high.",
      dom_changes: [
        {
          type: "attribute_change",
          attribute: "data-testid",
          old: "login-btn",
          new: "login-button-v2",
        },
      ],
      similar_tests_affected: 8,
      affected_test_files: [
        "tests/e2e/auth/login.spec.ts",
        "tests/e2e/auth/logout.spec.ts",
        "tests/e2e/onboarding/welcome.spec.ts",
      ],
      code_before: "await page.click('[data-testid=\"login-btn\"]');",
      code_after: "await page.click('[data-testid=\"login-button-v2\"]');",
      execution_time_ms: 1840,
      ai_model: "gemini-3-pro-preview",
      ai_tokens_used: 1250,
      created_at: new Date(now.getTime() - 1800000).toISOString(), // 30 min ago
    },
    {
      id: "heal-002",
      test_name: "Chat Input Field",
      test_file: "tests/e2e/chat/conversation.spec.ts",
      test_line_number: 78,
      status: "review",
      tier: 1,
      confidence: 0.96,
      original_selector: 'textarea[placeholder="Type your message"]',
      suggested_selector: '[data-testid="chat-message-input"]',
      selector_type: "css",
      healing_strategy: "selector-update",
      healing_rationale:
        "Chat input was refactored to use data-testid instead of placeholder text. This is more resilient to i18n changes.",
      dom_changes: [
        { type: "attribute_added", attribute: "data-testid", value: "chat-message-input" },
        {
          type: "attribute_change",
          attribute: "placeholder",
          old: "Type your message",
          new: "Ask anything...",
        },
      ],
      similar_tests_affected: 12,
      affected_test_files: [
        "tests/e2e/chat/conversation.spec.ts",
        "tests/e2e/chat/voice-input.spec.ts",
        "tests/e2e/ai/response-streaming.spec.ts",
      ],
      code_before: "await page.fill('textarea[placeholder=\"Type your message\"]', query);",
      code_after: "await page.fill('[data-testid=\"chat-message-input\"]', query);",
      execution_time_ms: 2100,
      ai_model: "gemini-3-pro-preview",
      ai_tokens_used: 1420,
      created_at: new Date(now.getTime() - 3600000).toISOString(), // 1 hour ago
    },

    // MEDIUM IMPACT - Tier 2 (Review Required)
    {
      id: "heal-003",
      test_name: "AOMA Asset Dropdown Filter",
      test_file: "tests/e2e/aoma/asset-search.spec.ts",
      test_line_number: 156,
      status: "review",
      tier: 2,
      confidence: 0.78,
      original_selector: ".filter-panel >> .dropdown >> nth=0",
      suggested_selector: '[data-testid="genre-filter-dropdown"]',
      selector_type: "css",
      healing_strategy: "selector-update",
      healing_rationale:
        "Positional selector '.dropdown >> nth=0' is fragile. The filter panel now has explicit test IDs. Medium confidence due to structural changes.",
      dom_changes: [
        {
          type: "structure_change",
          description: "Filter panel DOM restructured with semantic test IDs",
        },
        { type: "attribute_added", attribute: "data-testid", value: "genre-filter-dropdown" },
      ],
      similar_tests_affected: 15,
      affected_test_files: [
        "tests/e2e/aoma/asset-search.spec.ts",
        "tests/e2e/aoma/catalog-browse.spec.ts",
        "tests/e2e/aoma/advanced-filters.spec.ts",
      ],
      code_before: 'await page.click(".filter-panel >> .dropdown >> nth=0");',
      code_after: "await page.click('[data-testid=\"genre-filter-dropdown\"]');",
      execution_time_ms: 3450,
      ai_model: "gemini-3-pro-preview",
      ai_tokens_used: 2100,
      created_at: new Date(now.getTime() - 5400000).toISOString(), // 1.5 hours ago
    },
    {
      id: "heal-004",
      test_name: "Navigation Sidebar Link",
      test_file: "tests/e2e/navigation/sidebar.spec.ts",
      test_line_number: 89,
      status: "review",
      tier: 2,
      confidence: 0.72,
      original_selector: 'nav a:has-text("Dashboard")',
      suggested_selector: '[data-nav="dashboard"]',
      selector_type: "text",
      healing_strategy: "selector-update",
      healing_rationale:
        "Text selector is language-dependent. The nav now uses data-nav attributes for routing identification.",
      dom_changes: [
        { type: "attribute_added", attribute: "data-nav", value: "dashboard" },
        { type: "text_change", old: "Dashboard", new: "Home Dashboard" },
      ],
      similar_tests_affected: 6,
      affected_test_files: [
        "tests/e2e/navigation/sidebar.spec.ts",
        "tests/e2e/navigation/breadcrumbs.spec.ts",
      ],
      code_before: "await page.click('nav a:has-text(\"Dashboard\")');",
      code_after: "await page.click('[data-nav=\"dashboard\"]');",
      execution_time_ms: 2890,
      ai_model: "gemini-3-pro-preview",
      ai_tokens_used: 1680,
      created_at: new Date(now.getTime() - 7200000).toISOString(), // 2 hours ago
    },
    {
      id: "heal-005",
      test_name: "Track Row Selection",
      test_file: "tests/e2e/aoma/track-list.spec.ts",
      test_line_number: 134,
      status: "review",
      tier: 2,
      confidence: 0.68,
      original_selector: "table tbody tr:nth-child(1)",
      suggested_selector: '[data-testid="track-row"]:first-of-type',
      selector_type: "css",
      healing_strategy: "structure-adaptation",
      healing_rationale:
        "Track list changed from <table> to virtualized list. Selector needs to target the new component structure.",
      dom_changes: [
        { type: "element_replaced", old: "table", new: "div.virtual-list" },
        { type: "attribute_added", attribute: "data-testid", value: "track-row" },
      ],
      similar_tests_affected: 22,
      affected_test_files: [
        "tests/e2e/aoma/track-list.spec.ts",
        "tests/e2e/aoma/track-details.spec.ts",
        "tests/e2e/aoma/batch-operations.spec.ts",
      ],
      code_before: "await page.click('table tbody tr:nth-child(1)');",
      code_after: "await page.click('[data-testid=\"track-row\"]:first-of-type');",
      execution_time_ms: 4120,
      ai_model: "gemini-3-pro-preview",
      ai_tokens_used: 2450,
      created_at: new Date(now.getTime() - 10800000).toISOString(), // 3 hours ago
    },

    // LOW CONFIDENCE - Tier 3 (Architect Review)
    {
      id: "heal-006",
      test_name: "Upload Modal Container",
      test_file: "tests/e2e/aoma/file-upload.spec.ts",
      test_line_number: 67,
      status: "review",
      tier: 3,
      confidence: 0.45,
      original_selector: ".modal-overlay >> .upload-container",
      suggested_selector: '[role="dialog"][aria-label*="Upload"]',
      selector_type: "css",
      healing_strategy: "structure-adaptation",
      healing_rationale:
        "Modal system was completely rewritten using Radix UI. The upload flow now uses portal rendering. Architect review required for complex interaction testing.",
      dom_changes: [
        { type: "element_removed", element: ".modal-overlay" },
        { type: "element_added", element: "[data-radix-dialog-portal]" },
        {
          type: "structure_change",
          description: "Modal now renders via React Portal outside main DOM tree",
        },
      ],
      similar_tests_affected: 9,
      affected_test_files: [
        "tests/e2e/aoma/file-upload.spec.ts",
        "tests/e2e/aoma/bulk-import.spec.ts",
      ],
      code_before: 'await page.waitForSelector(".modal-overlay >> .upload-container");',
      code_after: 'await page.waitForSelector(\'[role="dialog"][aria-label*="Upload"]\');',
      execution_time_ms: 5670,
      ai_model: "gemini-3-pro-preview",
      ai_tokens_used: 3200,
      created_at: new Date(now.getTime() - 14400000).toISOString(), // 4 hours ago
    },
    {
      id: "heal-007",
      test_name: "Audio Player Controls",
      test_file: "tests/e2e/aoma/audio-preview.spec.ts",
      test_line_number: 203,
      status: "review",
      tier: 3,
      confidence: 0.38,
      original_selector: ".audio-player >> button.play-pause",
      suggested_selector: '[data-testid="audio-player"] >> [aria-label="Play"]',
      selector_type: "css",
      healing_strategy: "structure-adaptation",
      healing_rationale:
        "Audio player component was replaced with a third-party library. DOM structure is significantly different. Manual verification strongly recommended.",
      dom_changes: [
        { type: "component_replaced", old: "CustomAudioPlayer", new: "ReactAudioPlayer" },
        { type: "class_removed", class: "play-pause" },
        { type: "attribute_added", attribute: "aria-label", value: "Play" },
      ],
      similar_tests_affected: 7,
      affected_test_files: [
        "tests/e2e/aoma/audio-preview.spec.ts",
        "tests/e2e/aoma/track-player.spec.ts",
      ],
      code_before: 'await page.click(".audio-player >> button.play-pause");',
      code_after: 'await page.click(\'[data-testid="audio-player"] >> [aria-label="Play"]\');',
      execution_time_ms: 6340,
      ai_model: "gemini-3-pro-preview",
      ai_tokens_used: 3850,
      created_at: new Date(now.getTime() - 18000000).toISOString(), // 5 hours ago
    },

    // ALREADY PROCESSED - Show history
    {
      id: "heal-008",
      test_name: "Search Input Clear Button",
      test_file: "tests/e2e/search/global-search.spec.ts",
      test_line_number: 45,
      status: "approved",
      tier: 1,
      confidence: 0.99,
      original_selector: 'button[aria-label="Clear search"]',
      suggested_selector: '[data-testid="search-clear-btn"]',
      selector_type: "label",
      healing_strategy: "selector-update",
      healing_rationale: "Clear button now has explicit data-testid. High confidence match.",
      similar_tests_affected: 4,
      execution_time_ms: 1200,
      ai_model: "gemini-3-pro-preview",
      reviewed_by: "matt.carpenter@sonymusic.com",
      reviewed_at: new Date(now.getTime() - 86400000).toISOString(),
      reviewer_notes: "Approved - clear semantic match",
      created_at: new Date(now.getTime() - 86400000).toISOString(), // Yesterday
      healed_at: new Date(now.getTime() - 86400000).toISOString(),
    },
    {
      id: "heal-009",
      test_name: "Pagination Next Button",
      test_file: "tests/e2e/common/pagination.spec.ts",
      test_line_number: 112,
      status: "rejected",
      tier: 2,
      confidence: 0.65,
      original_selector: ".pagination >> button:last-child",
      suggested_selector: '[data-page="next"]',
      selector_type: "css",
      healing_strategy: "selector-update",
      healing_rationale:
        "Pagination buttons restructured. AI suggested selector doesn't account for disabled state.",
      similar_tests_affected: 3,
      execution_time_ms: 2800,
      ai_model: "gemini-3-pro-preview",
      reviewed_by: "qa.team@sonymusic.com",
      reviewed_at: new Date(now.getTime() - 172800000).toISOString(),
      reviewer_notes: "Rejected - test needs redesign for new disabled state handling",
      created_at: new Date(now.getTime() - 172800000).toISOString(), // 2 days ago
    },
    {
      id: "heal-010",
      test_name: "HUD Tab Selection",
      test_file: "tests/e2e/dashboard/hud.spec.ts",
      test_line_number: 88,
      status: "success",
      tier: 1,
      confidence: 0.98,
      original_selector: '[role="tab"]:has-text("HUD")',
      suggested_selector: '[data-testid="tab-hud"]',
      selector_type: "role",
      healing_strategy: "selector-update",
      healing_rationale: "Tab component now uses data-testid. Auto-approved due to 98% confidence.",
      similar_tests_affected: 5,
      execution_time_ms: 1500,
      ai_model: "gemini-3-pro-preview",
      created_at: new Date(now.getTime() - 259200000).toISOString(), // 3 days ago
      healed_at: new Date(now.getTime() - 259200000).toISOString(),
    },
  ];
}

function getDemoStats() {
  return {
    total_attempts: 1247,
    auto_healed: 1089,
    pending_review: 7,
    success_rate: 94.2,
    avg_heal_time_ms: 3150,
    total_tests_impacted: 84,
    tier1_count: 2,
    tier2_count: 3,
    tier3_count: 2,
  };
}
