/**
 * Email Context Extraction API
 * POST /api/email-context - Ingest single email
 * POST /api/email-context/batch - Ingest multiple emails
 */

import { NextRequest, NextResponse } from "next/server";
import { getEmailContextService } from "../../../src/services/emailContextService";
import { EmailData } from "../../../src/utils/emailParser";

/**
 * POST /api/email-context
 * Ingest a single email for context extraction and vectorization
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.messageId || !body.from || !body.to || !body.subject) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: messageId, from, to, subject",
        },
        { status: 400 }
      );
    }

    // Validate body or htmlBody exists
    if (!body.body && !body.htmlBody) {
      return NextResponse.json(
        {
          success: false,
          error: "Email must have either body or htmlBody",
        },
        { status: 400 }
      );
    }

    const emailData: EmailData = {
      messageId: body.messageId,
      from: body.from,
      to: Array.isArray(body.to) ? body.to : [body.to],
      cc: body.cc,
      bcc: body.bcc,
      subject: body.subject,
      body: body.body || "",
      htmlBody: body.htmlBody,
      date: body.date || new Date().toISOString(),
      threadId: body.threadId,
      inReplyTo: body.inReplyTo,
      references: body.references,
      attachments: body.attachments,
      headers: body.headers,
    };

    const service = getEmailContextService();
    const result = await service.ingestEmail(emailData);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      vectorId: result.vectorId,
    });
  } catch (error) {
    console.error("Email context extraction failed:", error);
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
 * GET /api/email-context
 * Get email statistics
 */
export async function GET() {
  try {
    const service = getEmailContextService();
    const stats = await service.getEmailStats();

    return NextResponse.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error("Failed to get email stats:", error);
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
 * DELETE /api/email-context?messageId=xxx
 * Delete email by message ID
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const messageId = searchParams.get("messageId");

    if (!messageId) {
      return NextResponse.json(
        {
          success: false,
          error: "messageId parameter is required",
        },
        { status: 400 }
      );
    }

    const service = getEmailContextService();
    const deleted = await service.deleteEmail(messageId);

    if (!deleted) {
      return NextResponse.json(
        {
          success: false,
          error: "Email not found or already deleted",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      messageId,
    });
  } catch (error) {
    console.error("Failed to delete email:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
