/**
 * RLHF Test Approval API
 * Approve or reject generated tests
 * Part of Testing Tab - Phase 5 (User Story 4)
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { action, reviewer, notes } = body;

    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Must be 'approve' or 'reject'" },
        { status: 400 }
      );
    }

    const updateData: any = {
      status: action === "approve" ? "approved" : "rejected",
      approved_by: reviewer || "unknown",
      approved_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (action === "reject" && notes) {
      updateData.rejection_reason = notes;
    }

    const { data, error } = await supabase
      .from("rlhf_generated_tests")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update test: ${error.message}`);
    }

    return NextResponse.json({
      success: true,
      message: `Test ${action}d successfully`,
      test: data,
    });
  } catch (error) {
    console.error("RLHF approval error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

