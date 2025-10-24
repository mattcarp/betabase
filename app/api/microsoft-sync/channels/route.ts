/**
 * Microsoft Teams Channels API
 * GET /api/microsoft-sync/channels?accessToken=xxx&teamId=xxx - List team channels
 */

import { NextRequest, NextResponse } from "next/server";
import { getMicrosoftGraphService } from "../../../../src/services/microsoftGraphService";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const accessToken = searchParams.get("accessToken");
    const teamId = searchParams.get("teamId");

    if (!accessToken) {
      return NextResponse.json(
        {
          success: false,
          error: "Access token is required",
        },
        { status: 400 }
      );
    }

    if (!teamId) {
      return NextResponse.json(
        {
          success: false,
          error: "Team ID is required",
        },
        { status: 400 }
      );
    }

    const graphService = getMicrosoftGraphService({ accessToken });
    const channels = await graphService.getTeamChannels(teamId);

    return NextResponse.json({
      success: true,
      teamId,
      channels,
    });
  } catch (error) {
    console.error("Failed to get channels:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
