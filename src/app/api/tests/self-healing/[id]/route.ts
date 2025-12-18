/**
 * Self-Healing Attempt Update API
 * Approve or reject self-healing suggestions
 * Part of Testing Tab - Phase 6 (User Story 5)
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { status, reviewedBy, reviewNotes } = body;

    const validStatuses = ["approved", "rejected", "review", "pending"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` },
        { status: 400 }
      );
    }

    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (reviewedBy) {
      updateData.reviewed_by = reviewedBy;
    }

    if (reviewNotes) {
      updateData.review_notes = reviewNotes;
    }

    if (status === "approved") {
      updateData.healed_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from("self_healing_attempts")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update healing attempt: ${error.message}`);
    }

    return NextResponse.json({
      success: true,
      message: `Healing attempt updated to ${status}`,
      attempt: data,
    });
  } catch (error) {
    console.error("Self-healing update error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

