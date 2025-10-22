/**
 * Email Search API
 * POST /api/email-context/search - Search emails by content similarity
 */

import { NextRequest, NextResponse } from "next/server";
import { getEmailContextService } from "@/services/emailContextService";

/**
 * POST /api/email-context/search
 * Search emails using semantic similarity
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate query
    if (!body.query || typeof body.query !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: "Query string is required",
        },
        { status: 400 }
      );
    }

    const service = getEmailContextService();
    const results = await service.searchEmails(body.query, {
      matchThreshold: body.matchThreshold,
      matchCount: body.matchCount,
      dateFrom: body.dateFrom,
      dateTo: body.dateTo,
      participants: body.participants,
    });

    return NextResponse.json({
      success: true,
      query: body.query,
      count: results.length,
      results: results.map((r) => ({
        messageId: r.source_id,
        similarity: r.similarity,
        subject: r.metadata.subject,
        from: r.metadata.from,
        to: r.metadata.to,
        date: r.metadata.date,
        contentPreview: r.content.substring(0, 200) + "...",
        hasAttachments: r.metadata.hasAttachments,
        isReply: r.metadata.isReply,
      })),
    });
  } catch (error) {
    console.error("Email search failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
