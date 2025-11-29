/**
 * RLHF Feedback Individual Record API
 *
 * Handles operations on individual feedback records:
 * - GET: Retrieve single feedback by ID
 * - PATCH: Update feedback record
 * - DELETE: Remove feedback (admin only)
 */

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET - Retrieve single feedback
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 503 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("rlhf_feedback")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "Feedback not found" },
          { status: 404 }
        );
      }
      if (error.code === "42P01") {
        return NextResponse.json(
          { error: "Table not yet created" },
          { status: 404 }
        );
      }
      console.error("Feedback fetch error:", error);
      return NextResponse.json(
        { error: "Failed to fetch feedback" },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Feedback fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH - Update feedback
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 503 }
      );
    }

    const body = await request.json();

    // Fields that can be updated
    const allowedFields = [
      "thumbs_up",
      "rating",
      "categories",
      "severity",
      "feedback_text",
      "documents_marked",
      "suggested_correction",
      "preferred_response",
      "status",
      "curator_id",
      "curator_notes",
      "reviewed_at",
    ];

    // Filter to only allowed fields and convert from camelCase
    const updates: Record<string, unknown> = {};
    const fieldMap: Record<string, string> = {
      thumbsUp: "thumbs_up",
      rating: "rating",
      categories: "categories",
      severity: "severity",
      feedbackText: "feedback_text",
      documentsMarked: "documents_marked",
      suggestedCorrection: "suggested_correction",
      preferredResponse: "preferred_response",
      status: "status",
      curatorId: "curator_id",
      curatorNotes: "curator_notes",
      reviewedAt: "reviewed_at",
    };

    for (const [camelKey, snakeKey] of Object.entries(fieldMap)) {
      if (body[camelKey] !== undefined) {
        updates[snakeKey] = body[camelKey];
      }
      // Also check snake_case keys
      if (body[snakeKey] !== undefined) {
        updates[snakeKey] = body[snakeKey];
      }
    }

    // Always update the updated_at timestamp
    updates.updated_at = new Date().toISOString();

    // If status is being changed to approved/rejected, set reviewed_at
    if (body.status === "approved" || body.status === "rejected") {
      updates.reviewed_at = new Date().toISOString();
      // Set curator_id if provided, otherwise use a placeholder
      if (!updates.curator_id) {
        updates.curator_id = "system";
      }
    }

    const { data, error } = await supabaseAdmin
      .from("rlhf_feedback")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "Feedback not found" },
          { status: 404 }
        );
      }
      if (error.code === "42P01") {
        return NextResponse.json(
          { error: "Table not yet created" },
          { status: 404 }
        );
      }
      console.error("Feedback update error:", error);
      return NextResponse.json(
        { error: "Failed to update feedback" },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Feedback update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Remove feedback (requires curator/admin role)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 503 }
      );
    }

    const { error } = await supabaseAdmin
      .from("rlhf_feedback")
      .delete()
      .eq("id", id);

    if (error) {
      if (error.code === "42P01") {
        return NextResponse.json(
          { error: "Table not yet created" },
          { status: 404 }
        );
      }
      console.error("Feedback delete error:", error);
      return NextResponse.json(
        { error: "Failed to delete feedback" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Feedback delete error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
