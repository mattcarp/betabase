/**
 * RLHF DPO Training Data Export API
 *
 * Exports feedback data in DPO-compatible format for model training.
 * Supports multiple export formats:
 * - DPO JSONL (chosen/rejected pairs)
 * - Standard JSON
 * - CSV for spreadsheet analysis
 *
 * @see https://arxiv.org/abs/2305.18290 (DPO Paper)
 */

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

interface DPOExample {
  prompt: string;
  chosen: string;
  rejected: string;
  metadata?: {
    feedbackId: string;
    categories: string[];
    curatorApproved: boolean;
    confidence: number;
    model?: string;
    timestamp: string;
  };
}

interface FeedbackRow {
  id: string;
  conversation_id: string;
  message_id: string;
  user_query: string;
  ai_response: string;
  thumbs_up: boolean | null;
  rating: number | null;
  categories: string[] | null;
  severity: string | null;
  feedback_text: string | null;
  suggested_correction: string | null;
  status: string;
  curator_id: string | null;
  model_used: string | null;
  created_at: string;
  updated_at: string;
}

interface ComparisonRow {
  id: string;
  query: string;
  response_a: string;
  response_b: string;
  model_a: string | null;
  model_b: string | null;
  preferred_response: "A" | "B" | "tie" | null;
  reason: string | null;
  annotator_id: string | null;
  created_at: string;
}

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") || "dpo";
    const status = searchParams.get("status") || "approved";
    const limit = Math.min(parseInt(searchParams.get("limit") || "1000"), 10000);
    const includeMetadata = searchParams.get("metadata") !== "false";
    const minRating = parseFloat(searchParams.get("minRating") || "0");
    const onlyCorrections = searchParams.get("onlyCorrections") === "true";

    // Validate format FIRST before any database operations
    const validFormats = ["dpo", "jsonl", "json", "csv"];
    if (!validFormats.includes(format)) {
      return NextResponse.json(
        { error: `Unsupported format: ${format}. Valid formats: ${validFormats.join(", ")}` },
        { status: 400 }
      );
    }

    // Check if supabaseAdmin is available
    if (!supabaseAdmin) {
      return generateEmptyResponse(format, "Database not configured");
    }

    // Fetch feedback data
    let query = supabaseAdmin
      .from("rlhf_feedback")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    // Filter by status if specified
    if (status !== "all") {
      query = query.eq("status", status);
    }

    // Filter by minimum rating
    if (minRating > 0) {
      query = query.gte("rating", minRating);
    }

    // Filter only feedback with corrections
    if (onlyCorrections) {
      query = query.not("suggested_correction", "is", null);
    }

    const { data: feedbackData, error: feedbackError } = await query;

    if (feedbackError) {
      // Table might not exist - return empty data with helpful message
      console.error("Feedback fetch error:", feedbackError);
      return generateEmptyResponse(format, "No feedback data available yet");
    }

    // Also fetch comparison data for DPO pairs
    const { data: comparisonData, error: comparisonError } = await supabaseAdmin
      .from("rlhf_comparisons")
      .select("*")
      .not("preferred_response", "is", null)
      .neq("preferred_response", "tie")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (comparisonError) {
      console.error("Comparison fetch error:", comparisonError);
      // Continue without comparison data
    }

    // Generate DPO training examples
    const dpoExamples: DPOExample[] = [];

    // Convert feedback with corrections to DPO format
    if (feedbackData) {
      for (const fb of feedbackData as FeedbackRow[]) {
        // Only include feedback with suggested corrections (gives us chosen/rejected pairs)
        if (fb.suggested_correction && fb.suggested_correction.trim()) {
          // If thumbs down with correction: original is rejected, correction is chosen
          // If thumbs up with correction: original is chosen, correction is alternate (skip)
          if (fb.thumbs_up === false || fb.rating !== null && fb.rating < 3) {
            dpoExamples.push({
              prompt: fb.user_query,
              chosen: fb.suggested_correction,
              rejected: fb.ai_response,
              ...(includeMetadata && {
                metadata: {
                  feedbackId: fb.id,
                  categories: fb.categories || [],
                  curatorApproved: fb.status === "approved",
                  confidence: calculateConfidence(fb),
                  model: fb.model_used || undefined,
                  timestamp: fb.created_at,
                },
              }),
            });
          }
        }
      }
    }

    // Convert A/B comparisons to DPO format
    if (comparisonData) {
      for (const cmp of comparisonData as ComparisonRow[]) {
        if (cmp.preferred_response === "A") {
          dpoExamples.push({
            prompt: cmp.query,
            chosen: cmp.response_a,
            rejected: cmp.response_b,
            ...(includeMetadata && {
              metadata: {
                feedbackId: cmp.id,
                categories: [],
                curatorApproved: true,
                confidence: 0.9, // High confidence for explicit comparison
                model: cmp.model_a || undefined,
                timestamp: cmp.created_at,
              },
            }),
          });
        } else if (cmp.preferred_response === "B") {
          dpoExamples.push({
            prompt: cmp.query,
            chosen: cmp.response_b,
            rejected: cmp.response_a,
            ...(includeMetadata && {
              metadata: {
                feedbackId: cmp.id,
                categories: [],
                curatorApproved: true,
                confidence: 0.9,
                model: cmp.model_b || undefined,
                timestamp: cmp.created_at,
              },
            }),
          });
        }
      }
    }

    // Return data in requested format
    switch (format) {
      case "dpo":
      case "jsonl":
        return generateDPOResponse(dpoExamples);

      case "json":
        return NextResponse.json({
          success: true,
          count: dpoExamples.length,
          exportedAt: new Date().toISOString(),
          examples: dpoExamples,
        });

      case "csv":
        return generateCSVResponse(dpoExamples);

      default:
        return NextResponse.json(
          { error: `Unsupported format: ${format}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("DPO export error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function calculateConfidence(fb: FeedbackRow): number {
  let confidence = 0.5;

  // Higher confidence for curator-approved feedback
  if (fb.status === "approved") confidence += 0.2;

  // Higher confidence for feedback with ratings
  if (fb.rating !== null) {
    confidence += 0.1;
    // Even higher for extreme ratings (clear preference)
    if (fb.rating === 1 || fb.rating === 5) confidence += 0.1;
  }

  // Higher confidence for feedback with categories (more thought put in)
  if (fb.categories && fb.categories.length > 0) {
    confidence += Math.min(fb.categories.length * 0.05, 0.15);
  }

  // Higher confidence for feedback with written explanation
  if (fb.feedback_text && fb.feedback_text.length > 20) {
    confidence += 0.1;
  }

  return Math.min(confidence, 1.0);
}

function generateDPOResponse(examples: DPOExample[]): NextResponse {
  // Generate JSONL format (one JSON object per line)
  const jsonl = examples
    .map((example) => JSON.stringify(example))
    .join("\n");

  return new NextResponse(jsonl, {
    headers: {
      "Content-Type": "application/jsonl",
      "Content-Disposition": `attachment; filename="dpo-training-data-${Date.now()}.jsonl"`,
    },
  });
}

function generateCSVResponse(examples: DPOExample[]): NextResponse {
  // CSV header
  const headers = [
    "prompt",
    "chosen",
    "rejected",
    "feedback_id",
    "categories",
    "curator_approved",
    "confidence",
    "model",
    "timestamp",
  ];

  // Escape CSV fields
  const escapeCSV = (value: string | undefined | null): string => {
    if (value === null || value === undefined) return "";
    const str = String(value);
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  // Generate CSV rows
  const rows = examples.map((ex) => [
    escapeCSV(ex.prompt),
    escapeCSV(ex.chosen),
    escapeCSV(ex.rejected),
    escapeCSV(ex.metadata?.feedbackId),
    escapeCSV(ex.metadata?.categories?.join("; ")),
    escapeCSV(ex.metadata?.curatorApproved?.toString()),
    escapeCSV(ex.metadata?.confidence?.toFixed(2)),
    escapeCSV(ex.metadata?.model),
    escapeCSV(ex.metadata?.timestamp),
  ]);

  const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join(
    "\n"
  );

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="dpo-training-data-${Date.now()}.csv"`,
    },
  });
}

function generateEmptyResponse(
  format: string,
  message: string
): NextResponse {
  switch (format) {
    case "dpo":
    case "jsonl":
      return new NextResponse("", {
        headers: {
          "Content-Type": "application/jsonl",
          "Content-Disposition": `attachment; filename="dpo-training-data-${Date.now()}.jsonl"`,
          "X-Export-Message": message,
        },
      });

    case "csv":
      return new NextResponse(
        "prompt,chosen,rejected,feedback_id,categories,curator_approved,confidence,model,timestamp\n",
        {
          headers: {
            "Content-Type": "text/csv",
            "Content-Disposition": `attachment; filename="dpo-training-data-${Date.now()}.csv"`,
            "X-Export-Message": message,
          },
        }
      );

    default:
      return NextResponse.json({
        success: true,
        count: 0,
        message,
        exportedAt: new Date().toISOString(),
        examples: [],
      });
  }
}

// POST endpoint for custom export queries
export async function POST(request: NextRequest) {
  try {
    // Check if supabaseAdmin is available
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 503 }
      );
    }

    const body = await request.json();
    const {
      format = "dpo",
      feedbackIds,
      dateRange,
      categories,
      minConfidence = 0,
    } = body;

    // Build custom query
    let query = supabaseAdmin
      .from("rlhf_feedback")
      .select("*")
      .eq("status", "approved")
      .not("suggested_correction", "is", null);

    // Filter by specific IDs
    if (feedbackIds && feedbackIds.length > 0) {
      query = query.in("id", feedbackIds);
    }

    // Filter by date range
    if (dateRange) {
      if (dateRange.start) {
        query = query.gte("created_at", dateRange.start);
      }
      if (dateRange.end) {
        query = query.lte("created_at", dateRange.end);
      }
    }

    // Filter by categories
    if (categories && categories.length > 0) {
      query = query.overlaps("categories", categories);
    }

    const { data: feedbackData, error: feedbackError } = await query;

    if (feedbackError) {
      console.error("Custom export query error:", feedbackError);
      return NextResponse.json(
        { error: "Failed to fetch feedback data" },
        { status: 500 }
      );
    }

    // Convert to DPO format
    const dpoExamples: DPOExample[] = [];

    if (feedbackData) {
      for (const fb of feedbackData as FeedbackRow[]) {
        if (fb.suggested_correction && (fb.thumbs_up === false || (fb.rating !== null && fb.rating < 3))) {
          const confidence = calculateConfidence(fb);
          if (confidence >= minConfidence) {
            dpoExamples.push({
              prompt: fb.user_query,
              chosen: fb.suggested_correction,
              rejected: fb.ai_response,
              metadata: {
                feedbackId: fb.id,
                categories: fb.categories || [],
                curatorApproved: fb.status === "approved",
                confidence,
                model: fb.model_used || undefined,
                timestamp: fb.created_at,
              },
            });
          }
        }
      }
    }

    // Return in requested format
    switch (format) {
      case "dpo":
      case "jsonl":
        return generateDPOResponse(dpoExamples);

      case "csv":
        return generateCSVResponse(dpoExamples);

      default:
        return NextResponse.json({
          success: true,
          count: dpoExamples.length,
          exportedAt: new Date().toISOString(),
          examples: dpoExamples,
        });
    }
  } catch (error) {
    console.error("Custom DPO export error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
