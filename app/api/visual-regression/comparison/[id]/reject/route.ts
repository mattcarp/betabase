/**
 * Visual Regression Rejection API
 * Reject a visual regression comparison
 */

import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: {
    id: string;
  };
}

/**
 * POST /api/visual-regression/comparison/:id/reject
 * Reject a visual regression comparison
 */
export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = params;
    const body = await request.json();
    const { reason, rejectedBy, rejectedAt } = body;

    if (!reason) {
      return NextResponse.json({ error: "Rejection reason is required" }, { status: 400 });
    }

    // TODO: Update comparison status in database
    console.log("Rejecting comparison:", id, "by:", rejectedBy, "reason:", reason);

    // Return updated comparison
    const updatedComparison = {
      id,
      status: "rejected",
      rejectedBy: rejectedBy || "current-user",
      rejectedAt: rejectedAt || new Date().toISOString(),
      comments: [
        {
          id: `comment-${Date.now()}`,
          author: rejectedBy || "current-user",
          content: `Rejected: ${reason}`,
          createdAt: new Date(),
        },
      ],
    };

    return NextResponse.json(updatedComparison);
  } catch (error) {
    console.error("Failed to reject comparison:", error);
    return NextResponse.json({ error: "Failed to reject comparison" }, { status: 500 });
  }
}
