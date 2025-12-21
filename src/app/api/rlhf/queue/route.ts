/**
 * RLHF Annotation Queue API
 *
 * Provides annotation queue management for CuratorWorkspace:
 * - GET: Retrieve pending feedback for annotation
 * - PATCH: Update feedback status (approve/reject/revision)
 *
 * Multi-tenant: Supports organization, division, app_under_test filtering
 */

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import type { AnnotationQueueItem, FeedbackRecord } from "@/src/components/rlhf/types";

// Demo queue for when database is not available
const DEMO_QUEUE: AnnotationQueueItem[] = [
  {
    id: "q1",
    feedback: {
      id: "f1",
      conversationId: "conv-123",
      messageId: "msg-456",
      userQuery: "What are the royalty calculation rules in AOMA 9.1?",
      aiResponse:
        "The royalty calculation in AOMA 9.1 follows a tiered structure based on sales volume. For digital sales, the base rate is 15% of net receipts, with adjustments for territory-specific agreements.",
      thumbsUp: false,
      rating: 2,
      categories: ["accuracy", "completeness"],
      severity: "major",
      feedbackText:
        "The response is missing the new streaming royalty rates introduced in the Q3 update.",
      suggestedCorrection:
        "The royalty calculation in AOMA 9.1 has been updated as of Q3 2025. For digital sales, the base rate is 15% of net receipts. **NEW: Streaming royalties are now calculated at 0.004 per stream with a minimum threshold of 1000 streams.** Territory-specific adjustments apply.",
      preferredResponse: null,
      documentsMarked: null,
      userEmail: "user@example.com",
      sessionId: "sess-789",
      modelUsed: "gemini-3-pro",
      ragMetadata: {
        strategy: "agentic",
        documentsUsed: 5,
        confidence: 0.72,
        timeMs: 1234,
        reranked: true,
        agentSteps: ["search", "rerank", "generate"],
      },
      status: "pending",
      curatorId: null,
      curatorNotes: null,
      reviewedAt: null,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    priority: 10,
    assignedTo: null,
    queueName: "high-priority",
    addedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    dueBy: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    tags: ["accuracy", "rlhf-candidate"],
  },
  {
    id: "q2",
    feedback: {
      id: "f2",
      conversationId: "conv-234",
      messageId: "msg-567",
      userQuery: "How do I set up a new content deal in AOMA?",
      aiResponse:
        "To set up a new content deal, navigate to Deals > New Deal and fill in the required fields.",
      thumbsUp: false,
      rating: 1,
      categories: ["completeness", "helpfulness"],
      severity: "critical",
      feedbackText: "This is way too brief. Users need step-by-step guidance with screenshots.",
      suggestedCorrection: null,
      preferredResponse: null,
      documentsMarked: null,
      userEmail: "user2@example.com",
      sessionId: "sess-890",
      modelUsed: "gemini-3-pro",
      ragMetadata: {
        strategy: "standard",
        documentsUsed: 2,
        confidence: 0.45,
        timeMs: 890,
        reranked: false,
        agentSteps: null,
      },
      status: "pending",
      curatorId: null,
      curatorNotes: null,
      reviewedAt: null,
      createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    },
    priority: 8,
    assignedTo: null,
    queueName: "standard",
    addedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    dueBy: null,
    tags: ["completeness"],
  },
];

// GET - Retrieve annotation queue
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const status = searchParams.get("status") || "pending";
    const organization = searchParams.get("organization");
    const division = searchParams.get("division");
    const appUnderTest = searchParams.get("appUnderTest");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);

    // Check if supabaseAdmin is available
    if (!supabaseAdmin) {
      // Return demo queue when database not configured
      return NextResponse.json({
        queue: DEMO_QUEUE,
        stats: {
          total: DEMO_QUEUE.length,
          pending: DEMO_QUEUE.filter((q) => q.feedback.status === "pending").length,
          approved: 0,
          rejected: 0,
        },
        message: "Demo mode - database not configured",
      });
    }

    // Try to fetch from database
    let query = supabaseAdmin
      .from("rlhf_feedback")
      .select("*")
      .order("priority", { ascending: false })
      .order("created_at", { ascending: true })
      .limit(limit);

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    if (organization) {
      query = query.eq("organization", organization);
    }

    if (division) {
      query = query.eq("division", division);
    }

    if (appUnderTest) {
      query = query.eq("app_under_test", appUnderTest);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Queue fetch error:", error);
      // Return demo queue if table doesn't exist or has issues
      return NextResponse.json({
        queue: DEMO_QUEUE,
        stats: {
          total: DEMO_QUEUE.length,
          pending: DEMO_QUEUE.filter((q) => q.feedback.status === "pending").length,
          approved: 0,
          rejected: 0,
        },
        message: `Demo mode - ${error.message || error.code || "database error"}`,
      });
    }

    // Transform database records to AnnotationQueueItem format
    const queue: AnnotationQueueItem[] = (data || []).map((record, index) => {
      // Extract values from feedback_value JSONB if needed
      const feedbackValue = (record.feedback_value as Record<string, unknown>) || {};

      return {
        id: `q${index + 1}`,
        feedback: {
          id: record.id,
          conversationId: record.session_id || (feedbackValue.conversation_id as string) || "",
          messageId: (feedbackValue.message_id as string) || "",
          userQuery: record.user_query || record.query || "",
          aiResponse: record.ai_response || record.response || "",
          thumbsUp: record.thumbs_up ?? (feedbackValue.thumbs_up as boolean) ?? null,
          rating: record.rating ?? (feedbackValue.rating as number) ?? null,
          categories: record.categories || (feedbackValue.categories as string[]) || [],
          severity: record.severity || (feedbackValue.severity as string) || null,
          feedbackText: (feedbackValue.feedbackText as string) || null,
          suggestedCorrection:
            record.suggested_correction || (feedbackValue.suggestedCorrection as string) || null,
          preferredResponse: null,
          documentsMarked:
            (feedbackValue.documentsMarked as FeedbackRecord["documentsMarked"]) || null,
          userEmail: record.curator_email || "",
          sessionId: record.session_id || "",
          modelUsed: record.model_used || null,
          ragMetadata: (record.rag_metadata as FeedbackRecord["ragMetadata"]) || null,
          status: record.status || "pending",
          curatorId: null, // curator_id column doesn't exist in schema
          curatorNotes: record.curator_notes || null,
          reviewedAt: record.reviewed_at || null,
          createdAt: record.created_at,
          updatedAt: record.updated_at,
        },
        priority: record.priority || 5,
        assignedTo: null,
        queueName: record.priority >= 8 ? "high-priority" : "standard",
        addedAt: record.created_at,
        dueBy: null,
        tags: record.categories || [],
      };
    });

    // Get stats
    const { data: statsData } = await supabaseAdmin
      .from("rlhf_feedback")
      .select("status")
      .in("status", ["pending", "approved", "rejected", "revision_requested"]);

    const stats = {
      total: statsData?.length || 0,
      pending: statsData?.filter((r) => r.status === "pending").length || 0,
      approved: statsData?.filter((r) => r.status === "approved").length || 0,
      rejected: statsData?.filter((r) => r.status === "rejected").length || 0,
      revisionRequested: statsData?.filter((r) => r.status === "revision_requested").length || 0,
    };

    return NextResponse.json({ queue, stats });
  } catch (error) {
    console.error("Queue fetch error:", error);
    // Return demo queue on any error
    return NextResponse.json({
      queue: DEMO_QUEUE,
      stats: {
        total: DEMO_QUEUE.length,
        pending: DEMO_QUEUE.length,
        approved: 0,
        rejected: 0,
      },
      message: "Demo mode - server error",
    });
  }
}

// PATCH - Update feedback status
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();

    const { feedbackId, status, curatorId, curatorNotes } = body;

    if (!feedbackId || !status) {
      return NextResponse.json(
        { error: "Missing required fields: feedbackId and status" },
        { status: 400 }
      );
    }

    const validStatuses = ["pending", "reviewing", "approved", "rejected", "revision_requested"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` },
        { status: 400 }
      );
    }

    // Check if supabaseAdmin is available
    if (!supabaseAdmin) {
      return NextResponse.json({
        success: true,
        feedbackId,
        status,
        message: "Status updated (demo mode - database not configured)",
      });
    }

    // Update the feedback record
    const updateData: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    };

    // Note: curator_id column doesn't exist in schema
    // curatorId is accepted from client but not persisted

    if (curatorNotes) {
      updateData.curator_notes = curatorNotes;
    }

    if (status !== "pending" && status !== "reviewing") {
      updateData.reviewed_at = new Date().toISOString();
    }

    const { data, error } = await supabaseAdmin
      .from("rlhf_feedback")
      .update(updateData)
      .eq("id", feedbackId)
      .select()
      .single();

    if (error) {
      console.error("Feedback update error:", error);
      // Return success in demo mode
      return NextResponse.json({
        success: true,
        feedbackId,
        status,
        message: `Status updated (demo mode - ${error.message || error.code || "database error"})`,
      });
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Queue update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
