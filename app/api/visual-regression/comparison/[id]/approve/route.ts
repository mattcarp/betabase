/**
 * Visual Regression Approval API
 * Approve a visual regression comparison
 */

import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: {
    id: string;
  };
}

/**
 * POST /api/visual-regression/comparison/:id/approve
 * Approve a visual regression comparison
 */
export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = params;
    const body = await request.json();
    const { comment, approvedBy, approvedAt } = body;

    // TODO: Update comparison status in database
    console.log("Approving comparison:", id, "by:", approvedBy);

    // Return updated comparison
    const updatedComparison = {
      id,
      status: "approved",
      approvedBy: approvedBy || "current-user",
      approvedAt: approvedAt || new Date().toISOString(),
      comments: comment
        ? [
            {
              id: `comment-${Date.now()}`,
              author: approvedBy || "current-user",
              content: comment,
              createdAt: new Date(),
            },
          ]
        : [],
    };

    return NextResponse.json(updatedComparison);
  } catch (error) {
    console.error("Failed to approve comparison:", error);
    return NextResponse.json({ error: "Failed to approve comparison" }, { status: 500 });
  }
}
