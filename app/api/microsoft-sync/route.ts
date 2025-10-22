/**
 * Microsoft Graph Sync API
 * POST /api/microsoft-sync - Sync Outlook emails and Teams messages
 */

import { NextRequest, NextResponse } from "next/server";
import { getMicrosoftGraphService } from "@/services/microsoftGraphService";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate access token
    if (!body.accessToken) {
      return NextResponse.json(
        {
          success: false,
          error: "Microsoft access token is required",
        },
        { status: 400 }
      );
    }

    const graphService = getMicrosoftGraphService({
      accessToken: body.accessToken,
    });

    const results: any = {
      success: true,
      outlook: null,
      teams: [],
      meetings: null,
    };

    // Sync Outlook emails if requested
    if (body.syncOutlook !== false) {
      console.log("Syncing Outlook emails...");
      results.outlook = await graphService.syncOutlookEmails({
        folder: body.outlookFolder || "inbox",
        top: body.outlookTop || 50,
        filter: body.outlookFilter,
      });
    }

    // Sync Teams messages if team/channel specified
    if (body.teams && Array.isArray(body.teams)) {
      console.log(`Syncing ${body.teams.length} Teams channels...`);
      for (const team of body.teams) {
        if (!team.teamId || !team.channelId) {
          continue;
        }

        const teamResult = await graphService.syncTeamsMessages(
          team.teamId,
          team.channelId,
          {
            top: team.top || 50,
            since: team.since,
          }
        );

        results.teams.push({
          teamId: team.teamId,
          channelId: team.channelId,
          ...teamResult,
        });
      }
    }

    // Sync meetings if requested
    if (body.syncMeetings) {
      console.log("Syncing calendar meetings...");
      results.meetings = await graphService.syncMeetings({
        startDateTime: body.meetingsStartDate,
        endDateTime: body.meetingsEndDate,
        top: body.meetingsTop || 50,
      });
    }

    // Calculate totals
    const totalSuccessful =
      (results.outlook?.successful || 0) +
      results.teams.reduce((sum: number, t: any) => sum + (t.successful || 0), 0) +
      (results.meetings?.successful || 0);

    const totalFailed =
      (results.outlook?.failed || 0) +
      results.teams.reduce((sum: number, t: any) => sum + (t.failed || 0), 0) +
      (results.meetings?.failed || 0);

    return NextResponse.json({
      success: true,
      summary: {
        totalSuccessful,
        totalFailed,
      },
      details: results,
    });
  } catch (error) {
    console.error("Microsoft sync failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/microsoft-sync/teams - List user's teams
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const accessToken = searchParams.get("accessToken");

    if (!accessToken) {
      return NextResponse.json(
        {
          success: false,
          error: "Access token is required",
        },
        { status: 400 }
      );
    }

    const graphService = getMicrosoftGraphService({ accessToken });
    const teams = await graphService.getUserTeams();

    return NextResponse.json({
      success: true,
      teams,
    });
  } catch (error) {
    console.error("Failed to get teams:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
