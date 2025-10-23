/**
 * Batch Email Context Extraction API
 * POST /api/email-context/batch - Ingest multiple emails
 */

import { NextRequest, NextResponse } from "next/server";
import { getEmailContextService } from "../../../../src/services/emailContextService";
import { EmailData } from "@/utils/emailParser";

/**
 * POST /api/email-context/batch
 * Ingest multiple emails for context extraction and vectorization
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input is an array
    if (!Array.isArray(body.emails)) {
      return NextResponse.json(
        {
          success: false,
          error: "Request body must contain an 'emails' array",
        },
        { status: 400 }
      );
    }

    // Limit batch size to prevent abuse
    const maxBatchSize = parseInt(process.env.MAX_EMAIL_BATCH_SIZE || "100", 10);
    if (body.emails.length > maxBatchSize) {
      return NextResponse.json(
        {
          success: false,
          error: `Batch size exceeds maximum of ${maxBatchSize} emails`,
        },
        { status: 400 }
      );
    }

    // Validate each email has required fields
    const validEmails: EmailData[] = [];
    const validationErrors: Array<{ index: number; error: string }> = [];

    body.emails.forEach((email: any, index: number) => {
      if (!email.messageId) {
        validationErrors.push({ index, error: "Missing messageId" });
        return;
      }
      if (!email.from) {
        validationErrors.push({ index, error: "Missing from" });
        return;
      }
      if (!email.to) {
        validationErrors.push({ index, error: "Missing to" });
        return;
      }
      if (!email.subject) {
        validationErrors.push({ index, error: "Missing subject" });
        return;
      }
      if (!email.body && !email.htmlBody) {
        validationErrors.push({ index, error: "Missing body or htmlBody" });
        return;
      }

      validEmails.push({
        messageId: email.messageId,
        from: email.from,
        to: Array.isArray(email.to) ? email.to : [email.to],
        cc: email.cc,
        bcc: email.bcc,
        subject: email.subject,
        body: email.body || "",
        htmlBody: email.htmlBody,
        date: email.date || new Date().toISOString(),
        threadId: email.threadId,
        inReplyTo: email.inReplyTo,
        references: email.references,
        attachments: email.attachments,
        headers: email.headers,
      });
    });

    // If there are validation errors, return them
    if (validationErrors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Some emails have validation errors",
          validationErrors,
        },
        { status: 400 }
      );
    }

    // Process batch
    const service = getEmailContextService();
    const result = await service.ingestEmailBatch(validEmails);

    return NextResponse.json({
      success: true,
      total: result.total,
      successful: result.successful,
      failed: result.failed,
      results: result.results,
    });
  } catch (error) {
    console.error("Batch email context extraction failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
