import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// GET: Fetch RLHF-generated tests
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { searchParams } = new URL(request.url);

    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Check if table exists
    const { error: tableError } = await supabase
      .from("rlhf_generated_tests")
      .select("id")
      .limit(1);

    if (tableError && tableError.code === "42P01") {
      // Table doesn't exist - check for feedback that could generate tests
      const { data: feedbackData, count: feedbackCount } = await supabase
        .from("rlhf_feedback")
        .select("id, original_query, corrected_response", { count: "exact" })
        .eq("status", "approved")
        .limit(5);

      return NextResponse.json({
        tests: [],
        stats: {
          total: 0,
          pending: 0,
          approved: 0,
          passing: 0,
          failing: 0,
          flaky: 0,
        },
        tableExists: false,
        pendingFeedback: feedbackCount || 0,
        sampleFeedback: feedbackData || [],
        message: "Run migration to create rlhf_generated_tests table",
      });
    }

    // Build query
    let query = supabase
      .from("rlhf_generated_tests")
      .select("*", { count: "exact" })
      .order("generated_at", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }

    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error("Error fetching RLHF tests:", error);
      return NextResponse.json(
        { error: "Failed to fetch tests", details: error.message },
        { status: 500 }
      );
    }

    // Calculate stats
    const { data: statsData } = await supabase
      .from("rlhf_generated_tests")
      .select("status");

    const stats = {
      total: statsData?.length || 0,
      pending: statsData?.filter(s => s.status === "pending").length || 0,
      approved: statsData?.filter(s => s.status === "approved").length || 0,
      passing: statsData?.filter(s => s.status === "passing").length || 0,
      failing: statsData?.filter(s => s.status === "failing").length || 0,
      flaky: statsData?.filter(s => s.status === "flaky").length || 0,
      rejected: statsData?.filter(s => s.status === "rejected").length || 0,
    };

    return NextResponse.json({
      tests: data || [],
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
    console.error("Error in RLHF tests API:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}

// POST: Generate test from feedback
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const body = await request.json();

    const { 
      feedbackId, 
      sourceQuery, 
      sourceCorrection,
      testName,
      testCode,
      confidence,
    } = body;

    const { data, error } = await supabase
      .from("rlhf_generated_tests")
      .insert({
        source_feedback_id: feedbackId || null,
        source_query: sourceQuery,
        source_correction: sourceCorrection,
        test_name: testName,
        test_description: `Generated from RLHF feedback: ${sourceQuery?.substring(0, 100)}...`,
        test_code: testCode,
        test_language: "typescript",
        test_framework: "playwright",
        status: "pending",
        confidence: confidence || 0.7,
        generation_model: "gemini-2.0-flash",
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating RLHF test:", error);
      return NextResponse.json(
        { error: "Failed to create test", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      test: data,
    });
  } catch (error) {
    console.error("Error in RLHF POST:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}

// PATCH: Update test status (approve/reject/run result)
export async function PATCH(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const body = await request.json();

    const { id, status, approved_by, rejection_reason, last_run_result } = body;

    if (!id) {
      return NextResponse.json(
        { error: "id is required" },
        { status: 400 }
      );
    }

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (status) updateData.status = status;
    if (approved_by) {
      updateData.approved_by = approved_by;
      updateData.approved_at = new Date().toISOString();
    }
    if (rejection_reason) updateData.rejection_reason = rejection_reason;
    if (last_run_result) {
      updateData.last_run_result = last_run_result;
      updateData.last_run_at = new Date().toISOString();
      updateData.run_count = supabase.rpc("increment", { row_id: id, column: "run_count" });
      
      // Update pass/fail counts based on result
      if (last_run_result === "passed") {
        // Would need RPC for atomic increment
      }
    }

    const { data, error } = await supabase
      .from("rlhf_generated_tests")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating RLHF test:", error);
      return NextResponse.json(
        { error: "Failed to update test", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      test: data,
    });
  } catch (error) {
    console.error("Error in RLHF PATCH:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}

