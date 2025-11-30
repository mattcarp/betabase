/**
 * Self-Healing Individual Attempt API
 *
 * Handles individual healing attempt operations.
 *
 * Endpoints:
 * - GET: Retrieve a specific healing attempt
 * - PATCH: Update status (approve/reject/retry)
 * - DELETE: Remove a healing attempt
 */

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET - Retrieve a specific healing attempt
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    if (!supabaseAdmin) {
      return NextResponse.json({
        id,
        test_name: "Demo Test",
        test_file: "tests/demo.spec.ts",
        status: "review",
        tier: 2,
        confidence: 0.75,
        original_selector: '[data-testid="demo"]',
        suggested_selector: '[data-testid="demo-new"]',
        message: "Database not configured - returning demo data",
      });
    }

    const { data, error } = await supabaseAdmin
      .from("self_healing_attempts")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "Healing attempt not found" },
          { status: 404 }
        );
      }
      console.error("Self-healing fetch error:", error);
      return NextResponse.json(
        { error: "Failed to fetch healing attempt" },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Self-healing fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH - Update a healing attempt (approve/reject/retry)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    const {
      status,
      reviewerNotes,
      reviewedBy,
    } = body;

    // Validate status if provided
    const validStatuses = ["detecting", "analyzing", "healing", "testing", "success", "failed", "review", "approved", "rejected"];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` },
        { status: 400 }
      );
    }

    // Build update object
    const updateData: Record<string, any> = {};

    if (status) {
      updateData.status = status;

      // Set healed_at timestamp when approved
      if (status === "approved" || status === "success") {
        updateData.healed_at = new Date().toISOString();
      }
    }

    if (reviewerNotes !== undefined) {
      updateData.reviewer_notes = reviewerNotes;
    }

    if (reviewedBy !== undefined) {
      updateData.reviewed_by = reviewedBy;
      updateData.reviewed_at = new Date().toISOString();
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    if (!supabaseAdmin) {
      return NextResponse.json({
        id,
        ...updateData,
        updated_at: new Date().toISOString(),
        message: "Update applied (demo mode - database not configured)",
      });
    }

    const { data, error } = await supabaseAdmin
      .from("self_healing_attempts")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "Healing attempt not found" },
          { status: 404 }
        );
      }
      console.error("Self-healing update error:", error);
      return NextResponse.json(
        { error: "Failed to update healing attempt" },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Self-healing update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Remove a healing attempt
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    if (!supabaseAdmin) {
      return NextResponse.json({
        message: "Healing attempt deleted (demo mode)",
        id,
      });
    }

    const { error } = await supabaseAdmin
      .from("self_healing_attempts")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Self-healing delete error:", error);
      return NextResponse.json(
        { error: "Failed to delete healing attempt" },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "Healing attempt deleted", id });
  } catch (error) {
    console.error("Self-healing delete error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
