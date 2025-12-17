import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export interface SelfHealingAttempt {
  id: string;
  test_id: string;
  test_name: string;
  test_file: string;
  test_suite: string | null;
  change_type: string;
  old_selector: string;
  new_selector: string;
  selector_type: string;
  dom_snapshot_before: string | null;
  dom_snapshot_after: string | null;
  dom_changes: any | null;
  healing_tier: number;
  confidence: number;
  healing_strategy: string;
  healing_rationale: string;
  code_before: string | null;
  code_after: string | null;
  similar_tests_affected: number;
  affected_test_files: string[] | null;
  status: string;
  resolved_by: string | null;
  resolved_at: string | null;
  resolution_notes: string | null;
  ai_model: string;
  ai_tokens_used: number | null;
  execution_time_ms: number | null;
  retry_count: number;
  error_message: string | null;
  error_stack: string | null;
  detected_at: string;
  healed_at: string | null;
  created_at: string;
  updated_at: string;
}

// GET: Fetch self-healing attempts (queue and history)
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { searchParams } = new URL(request.url);

    // Filters
    const status = searchParams.get("status"); // pending, approved, rejected, applied
    const tier = searchParams.get("tier"); // 1, 2, 3
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Check if table exists
    const { data: tableCheck, error: tableError } = await supabase
      .from("self_healing_attempts")
      .select("id")
      .limit(1);

    if (tableError && tableError.code === "42P01") {
      // Table doesn't exist - return mock data for demo
      return NextResponse.json({
        attempts: getMockAttempts(),
        stats: getMockStats(),
        tableExists: false,
        message: "Using mock data - run migration to create self_healing_attempts table",
      });
    }

    // Build query
    let query = supabase
      .from("self_healing_attempts")
      .select("*", { count: "exact" })
      .order("detected_at", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }

    if (tier) {
      query = query.eq("healing_tier", parseInt(tier));
    }

    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error("Error fetching self-healing attempts:", error);
      return NextResponse.json(
        { error: "Failed to fetch attempts", details: error.message },
        { status: 500 }
      );
    }

    // Calculate stats
    const { data: statsData } = await supabase
      .from("self_healing_attempts")
      .select("status, healing_tier");

    const stats = {
      total: statsData?.length || 0,
      pending: statsData?.filter(s => s.status === "pending").length || 0,
      autoApproved: statsData?.filter(s => s.status === "auto_approved").length || 0,
      approved: statsData?.filter(s => s.status === "approved").length || 0,
      rejected: statsData?.filter(s => s.status === "rejected").length || 0,
      applied: statsData?.filter(s => s.status === "applied").length || 0,
      tier1: statsData?.filter(s => s.healing_tier === 1).length || 0,
      tier2: statsData?.filter(s => s.healing_tier === 2).length || 0,
      tier3: statsData?.filter(s => s.healing_tier === 3).length || 0,
    };

    return NextResponse.json({
      attempts: data || [],
      stats,
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: offset + limit < (count || 0),
      },
      tableExists: true,
    });
  } catch (error) {
    console.error("Error in self-healing API:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}

// POST: Create a new self-healing attempt (from test runner)
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const body = await request.json();

    const {
      test_id,
      test_name,
      test_file,
      test_suite,
      change_type,
      old_selector,
      new_selector,
      selector_type,
      dom_changes,
      confidence,
      healing_strategy,
      healing_rationale,
      code_before,
      code_after,
      similar_tests_affected,
      affected_test_files,
      ai_model,
      ai_tokens_used,
      execution_time_ms,
    } = body;

    // Determine tier based on confidence
    let healing_tier = 3;
    if (confidence >= 0.9) healing_tier = 1;
    else if (confidence >= 0.7) healing_tier = 2;

    // Auto-approve tier 1
    const status = healing_tier === 1 ? "auto_approved" : "pending";

    const { data, error } = await supabase
      .from("self_healing_attempts")
      .insert({
        test_id,
        test_name,
        test_file,
        test_suite,
        change_type,
        old_selector,
        new_selector,
        selector_type,
        dom_changes,
        healing_tier,
        confidence,
        healing_strategy,
        healing_rationale,
        code_before,
        code_after,
        similar_tests_affected: similar_tests_affected || 0,
        affected_test_files,
        status,
        ai_model: ai_model || "gemini-2.0-flash",
        ai_tokens_used,
        execution_time_ms,
        healed_at: healing_tier === 1 ? new Date().toISOString() : null,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating healing attempt:", error);
      return NextResponse.json(
        { error: "Failed to create attempt", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      attempt: data,
      autoApproved: healing_tier === 1,
    });
  } catch (error) {
    console.error("Error in self-healing POST:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}

// PATCH: Update status (approve/reject)
export async function PATCH(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const body = await request.json();

    const { id, status, resolved_by, resolution_notes } = body;

    if (!id || !status) {
      return NextResponse.json(
        { error: "id and status are required" },
        { status: 400 }
      );
    }

    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (resolved_by) updateData.resolved_by = resolved_by;
    if (resolution_notes) updateData.resolution_notes = resolution_notes;
    if (status === "approved" || status === "applied") {
      updateData.resolved_at = new Date().toISOString();
      updateData.healed_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from("self_healing_attempts")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating healing attempt:", error);
      return NextResponse.json(
        { error: "Failed to update attempt", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      attempt: data,
    });
  } catch (error) {
    console.error("Error in self-healing PATCH:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}

// Mock data for demo when table doesn't exist
function getMockAttempts(): SelfHealingAttempt[] {
  return [
    {
      id: "mock-001",
      test_id: "test-001",
      test_name: "User Login Flow",
      test_file: "tests/auth/login.spec.ts",
      test_suite: "Authentication",
      change_type: "selector",
      old_selector: "button.login-btn",
      new_selector: 'button[data-testid="login-submit"]',
      selector_type: "css",
      dom_snapshot_before: null,
      dom_snapshot_after: null,
      dom_changes: [{ type: "class_removed", element: "button", class: "login-btn" }],
      healing_tier: 1,
      confidence: 0.95,
      healing_strategy: "testid_fallback",
      healing_rationale: "Class name changed but data-testid attribute is stable",
      code_before: 'await page.click("button.login-btn")',
      code_after: 'await page.click(\'button[data-testid="login-submit"]\')',
      similar_tests_affected: 3,
      affected_test_files: ["tests/auth/logout.spec.ts", "tests/auth/session.spec.ts"],
      status: "auto_approved",
      resolved_by: "system",
      resolved_at: new Date().toISOString(),
      resolution_notes: null,
      ai_model: "gemini-2.0-flash",
      ai_tokens_used: 450,
      execution_time_ms: 1200,
      retry_count: 0,
      error_message: null,
      error_stack: null,
      detected_at: new Date(Date.now() - 3600000).toISOString(),
      healed_at: new Date().toISOString(),
      created_at: new Date(Date.now() - 3600000).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "mock-002",
      test_id: "test-002",
      test_name: "Search Results Display",
      test_file: "tests/search/results.spec.ts",
      test_suite: "Search",
      change_type: "structure",
      old_selector: "div.results-container > ul > li",
      new_selector: 'div[role="list"] > div[role="listitem"]',
      selector_type: "css",
      dom_snapshot_before: null,
      dom_snapshot_after: null,
      dom_changes: [
        { type: "element_replaced", from: "ul", to: "div[role=list]" },
        { type: "element_replaced", from: "li", to: "div[role=listitem]" },
      ],
      healing_tier: 2,
      confidence: 0.72,
      healing_strategy: "semantic_role",
      healing_rationale: "DOM structure changed from ul/li to divs with ARIA roles",
      code_before: null,
      code_after: null,
      similar_tests_affected: 5,
      affected_test_files: null,
      status: "pending",
      resolved_by: null,
      resolved_at: null,
      resolution_notes: null,
      ai_model: "gemini-2.0-flash",
      ai_tokens_used: 680,
      execution_time_ms: 2100,
      retry_count: 1,
      error_message: null,
      error_stack: null,
      detected_at: new Date(Date.now() - 7200000).toISOString(),
      healed_at: null,
      created_at: new Date(Date.now() - 7200000).toISOString(),
      updated_at: new Date(Date.now() - 7200000).toISOString(),
    },
    {
      id: "mock-003",
      test_id: "test-003",
      test_name: "Asset Upload Modal",
      test_file: "tests/assets/upload.spec.ts",
      test_suite: "Assets",
      change_type: "timing",
      old_selector: 'await page.waitForSelector(".upload-complete", { timeout: 5000 })',
      new_selector: 'await page.waitForSelector(".upload-complete", { timeout: 10000 })',
      selector_type: "timing",
      dom_snapshot_before: null,
      dom_snapshot_after: null,
      dom_changes: null,
      healing_tier: 3,
      confidence: 0.45,
      healing_strategy: "timeout_increase",
      healing_rationale: "Upload completion taking longer than expected; may indicate performance regression",
      code_before: null,
      code_after: null,
      similar_tests_affected: 1,
      affected_test_files: null,
      status: "pending",
      resolved_by: null,
      resolved_at: null,
      resolution_notes: null,
      ai_model: "gemini-2.0-flash",
      ai_tokens_used: 320,
      execution_time_ms: 890,
      retry_count: 2,
      error_message: null,
      error_stack: null,
      detected_at: new Date(Date.now() - 86400000).toISOString(),
      healed_at: null,
      created_at: new Date(Date.now() - 86400000).toISOString(),
      updated_at: new Date(Date.now() - 86400000).toISOString(),
    },
  ];
}

function getMockStats() {
  return {
    total: 47,
    pending: 12,
    autoApproved: 28,
    approved: 4,
    rejected: 2,
    applied: 1,
    tier1: 28,
    tier2: 14,
    tier3: 5,
  };
}

