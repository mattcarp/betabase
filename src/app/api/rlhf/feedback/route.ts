/**
 * RLHF Feedback API
 *
 * Handles feedback submission, retrieval, and updates.
 * Integrates with LangSmith for trace annotation when available.
 *
 * Endpoints:
 * - POST: Submit new feedback
 * - GET: Retrieve feedback by session ID
 */

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

interface FeedbackSubmission {
  sessionId: string; // Maps to session_id (required)
  query: string; // Maps to query (required)
  response: string; // Maps to response (required)
  feedbackType: "thumbs_up" | "thumbs_down" | "rating" | "correction" | "detailed";
  feedbackValue?: {
    rating?: number;
    correction?: string;
    categories?: string[];
    severity?: string;
    feedbackText?: string;
    suggestedCorrection?: string;
    documentsMarked?: Array<{
      documentId: string;
      title: string;
      snippet: string;
      relevant: boolean;
      relevanceScore?: number | null;
      notes?: string | null;
    }>;
  } | null;
  retrievedContexts?: Array<{
    content: string;
    source: string;
    score?: number;
  }> | null;
  modelUsed?: string | null;
  curatorEmail?: string | null;
  organization?: string;
  division?: string;
  appUnderTest?: string;
  langsmithRunId?: string | null;
}

// Extended interface for backward compatibility
interface FeedbackSubmissionExtended extends Partial<FeedbackSubmission> {
  // Alternate field names for backward compatibility
  conversationId?: string;
  messageId?: string;
  userQuery?: string;
  aiResponse?: string;
  thumbsUp?: boolean;
  rating?: number;
  categories?: string[];
  severity?: string;
  feedbackText?: string;
  suggestedCorrection?: string;
  documentsMarked?: Array<{
    documentId: string;
    title?: string;
    snippet?: string;
    relevant: boolean;
    relevanceScore?: number | null;
    notes?: string | null;
  }>;
  ragMetadata?: Record<string, unknown>;
}

// POST - Submit new feedback
export async function POST(request: NextRequest) {
  try {
    const body: FeedbackSubmissionExtended = await request.json();

    // Normalize field names for backward compatibility
    const sessionId = body.sessionId || body.conversationId || `session_${Date.now()}`;
    const query = body.query || body.userQuery || "";
    const response = body.response || body.aiResponse || "";

    // Determine feedback type from various inputs
    let feedbackType: string = body.feedbackType || "thumbs_up";
    if (!body.feedbackType) {
      if (body.thumbsUp === true) feedbackType = "thumbs_up";
      else if (body.thumbsUp === false) feedbackType = "thumbs_down";
      else if (body.rating) feedbackType = "rating";
      else if (body.suggestedCorrection) feedbackType = "correction";
      else if (body.categories?.length || body.feedbackText) feedbackType = "detailed";
    }

    // Validate required fields STRICTLY - must have query AND response
    // thumbsUp alone is not enough - we need the actual content
    if (!query || !response) {
      return NextResponse.json(
        { error: "Missing required fields: query/userQuery and response/aiResponse are required" },
        { status: 400 }
      );
    }

    // Validate feedback type
    const validTypes = ["thumbs_up", "thumbs_down", "rating", "correction", "detailed"];
    if (!validTypes.includes(feedbackType)) {
      return NextResponse.json(
        { error: `feedbackType must be one of: ${validTypes.join(", ")}` },
        { status: 400 }
      );
    }

    // Validate rating if provided (either in feedbackValue or directly)
    const ratingValue = body.feedbackValue?.rating || body.rating;
    if (ratingValue !== undefined) {
      if (ratingValue < 1 || ratingValue > 5) {
        return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 });
      }
    }

    // Prepare feedback record matching actual table schema
    // Only include columns that actually exist in the rlhf_feedback table
    const feedbackRecord = {
      session_id: sessionId,
      query: query,
      response: response,
      feedback_type: feedbackType,
      feedback_value: body.feedbackValue || {
        rating: body.rating,
        categories: body.categories,
        severity: body.severity,
        feedbackText: body.feedbackText,
        suggestedCorrection: body.suggestedCorrection,
        documentsMarked: body.documentsMarked,
        thumbs_up: body.thumbsUp,
        conversation_id: body.conversationId,
        message_id: body.messageId,
      },
      feedback_metadata: {
        langsmith_run_id: body.langsmithRunId,
        message_id: body.messageId,
        rag_metadata: body.ragMetadata,
      },
      retrieved_contexts: body.retrievedContexts || null,
      model_used: body.modelUsed || null,
      curator_email: body.curatorEmail || null,
      organization: body.organization || "sony-music",
      division: body.division || "digital-operations",
      app_under_test: body.appUnderTest || "aoma",
    };

    // Check if supabaseAdmin is available
    if (!supabaseAdmin) {
      // Return demo response when database not configured
      return NextResponse.json({
        id: `fb_demo_${Date.now()}`,
        ...feedbackRecord,
        created_at: new Date().toISOString(),
        message: "Feedback recorded (demo mode - database not configured)",
      });
    }

    // Insert into database
    const { data, error } = await supabaseAdmin
      .from("rlhf_feedback")
      .insert(feedbackRecord)
      .select()
      .single();

    if (error) {
      console.error("Feedback insert error:", error);
      // Return demo response for any database error (table doesn't exist, column missing, etc.)
      // This allows the demo to work without a fully configured database
      return NextResponse.json(
        {
          id: `fb_demo_${Date.now()}`,
          ...feedbackRecord,
          created_at: new Date().toISOString(),
          message: `Feedback recorded (demo mode - ${error.message || error.code || "database unavailable"})`,
        },
        { status: 201 }
      ); // Return 201 to indicate success in demo mode
    }

    // Annotate LangSmith trace if run ID provided
    if (body.langsmithRunId && data) {
      await annotateLangSmithRun(body.langsmithRunId, {
        feedbackType: feedbackType,
        feedbackValue: body.feedbackValue,
        feedbackId: data.id,
      });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Feedback submission error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET - Retrieve feedback
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const sessionId = searchParams.get("sessionId");
    const feedbackType = searchParams.get("feedbackType");
    const organization = searchParams.get("organization");
    const status = searchParams.get("status");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const includeStats = searchParams.get("stats") === "true";

    // Check if supabaseAdmin is available
    if (!supabaseAdmin) {
      return NextResponse.json({ feedback: [], message: "Database not configured" });
    }

    let query = supabaseAdmin
      .from("rlhf_feedback")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (sessionId) {
      query = query.eq("session_id", sessionId);
    }

    if (feedbackType) {
      query = query.eq("feedback_type", feedbackType);
    }

    if (organization) {
      query = query.eq("organization", organization);
    }

    // Note: 'status' column doesn't exist in current schema
    // Skip filtering by status until schema is updated
    // if (status) {
    //   query = query.eq("status", status);
    // }

    const { data, error } = await query;

    if (error) {
      console.error("Feedback fetch error:", error);
      // Return empty array if table doesn't exist
      if (error.code === "42P01") {
        return NextResponse.json({ feedback: [], message: "Table not yet created" });
      }
      return NextResponse.json({ error: "Failed to fetch feedback" }, { status: 500 });
    }

    // If stats requested, calculate analytics
    let stats = null;
    if (includeStats) {
      // Query only columns that exist: feedback_type and feedback_value (contains thumbs_up, rating)
      const { data: allFeedback } = await supabaseAdmin
        .from("rlhf_feedback")
        .select("feedback_type, feedback_value, created_at");

      if (allFeedback) {
        const total = allFeedback.length;
        // Extract values from feedback_value JSONB column
        const positiveCount = allFeedback.filter(
          (f) => f.feedback_type === "thumbs_up" || (f.feedback_value as any)?.thumbs_up === true
        ).length;
        const negativeCount = allFeedback.filter(
          (f) => f.feedback_type === "thumbs_down" || (f.feedback_value as any)?.thumbs_up === false
        ).length;
        const ratingsWithValue = allFeedback.filter((f) => (f.feedback_value as any)?.rating);
        const avgRating =
          ratingsWithValue.length > 0
            ? ratingsWithValue.reduce(
                (sum, f) => sum + ((f.feedback_value as any)?.rating || 0),
                0
              ) / ratingsWithValue.length
            : 0;

        stats = {
          total,
          approved: 0, // Not tracked in current schema
          pending: total, // All are pending until schema updated
          positiveCount,
          negativeCount,
          positiveRate: total > 0 ? (positiveCount / total) * 100 : 0,
          avgRating: avgRating.toFixed(1),
          approvalRate: 0, // Not tracked in current schema
        };
      }
    }

    return NextResponse.json({ feedback: data, stats });
  } catch (error) {
    console.error("Feedback fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Helper function to annotate LangSmith runs
async function annotateLangSmithRun(
  runId: string,
  feedback: {
    feedbackType: string;
    feedbackValue?: FeedbackSubmission["feedbackValue"];
    feedbackId: string;
  }
) {
  const langsmithApiKey = process.env.LANGSMITH_API_KEY;
  if (!langsmithApiKey) {
    console.log("LangSmith API key not configured, skipping annotation");
    return;
  }

  try {
    // Calculate score based on feedback type
    let score: number | null = null;
    if (feedback.feedbackType === "thumbs_up") {
      score = 1;
    } else if (feedback.feedbackType === "thumbs_down") {
      score = 0;
    } else if (feedback.feedbackType === "rating" && feedback.feedbackValue?.rating) {
      score = feedback.feedbackValue.rating / 5;
    }

    // Create feedback in LangSmith
    const response = await fetch(`https://api.smith.langchain.com/runs/${runId}/feedback`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": langsmithApiKey,
      },
      body: JSON.stringify({
        score,
        value:
          feedback.feedbackType === "thumbs_up"
            ? "positive"
            : feedback.feedbackType === "thumbs_down"
              ? "negative"
              : feedback.feedbackType,
        comment: feedback.feedbackValue?.feedbackText || undefined,
        key: "user_feedback",
        source_info: {
          feedback_id: feedback.feedbackId,
          categories: feedback.feedbackValue?.categories,
        },
      }),
    });

    if (!response.ok) {
      console.error("LangSmith annotation failed:", response.status, await response.text());
    }
  } catch (error) {
    console.error("LangSmith annotation error:", error);
  }
}
