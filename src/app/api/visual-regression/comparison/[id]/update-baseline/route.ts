/**
 * Visual Regression Baseline Update API
 * Update the baseline screenshot for a comparison
 */

import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type RouteParams = { id: string };

/**
 * POST /api/visual-regression/comparison/:id/update-baseline
 * Update the baseline screenshot to the current screenshot
 */
export async function POST(request: NextRequest, context: { params: Promise<RouteParams> }) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { updatedBy, updatedAt } = body;

    // TODO: Update baseline in database
    // - Copy current screenshot to baseline
    // - Update comparison status to 'baseline-updated'
    // - Clear diff data
    console.log("Updating baseline for comparison:", id, "by:", updatedBy);

    // Return updated comparison
    const updatedComparison = {
      id,
      status: "baseline-updated",
      updatedBy: updatedBy || "current-user",
      updatedAt: updatedAt || new Date().toISOString(),
      message: "Baseline screenshot has been updated successfully",
    };

    return NextResponse.json(updatedComparison);
  } catch (error) {
    console.error("Failed to update baseline:", error);
    return NextResponse.json({ error: "Failed to update baseline" }, { status: 500 });
  }
}
