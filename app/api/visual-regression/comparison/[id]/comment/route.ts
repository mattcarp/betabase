/**
 * Visual Regression Comment API
 * Add comments to a visual regression comparison
 */

import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: {
    id: string;
  };
}

/**
 * POST /api/visual-regression/comparison/:id/comment
 * Add a comment to a comparison
 */
export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = params;
    const body = await request.json();
    const { comment, author, coordinates, createdAt } = body;

    if (!comment) {
      return NextResponse.json({ error: "Comment content is required" }, { status: 400 });
    }

    // TODO: Add comment to database
    console.log("Adding comment to comparison:", id, "by:", author);

    // Return the new comment
    const newComment = {
      id: `comment-${Date.now()}`,
      author: author || "current-user",
      content: comment,
      createdAt: createdAt || new Date().toISOString(),
      x: coordinates?.x,
      y: coordinates?.y,
    };

    return NextResponse.json(newComment, { status: 201 });
  } catch (error) {
    console.error("Failed to add comment:", error);
    return NextResponse.json({ error: "Failed to add comment" }, { status: 500 });
  }
}
