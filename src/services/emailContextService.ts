/**
 * Email Context Service
 * Coordinates email parsing, vectorization, and storage
 */

import { EmailParser, EmailData, ParsedEmailContext } from "../utils/emailParser";
import { getSupabaseVectorService } from "./supabaseVectorService";

export interface EmailIngestionResult {
  success: boolean;
  messageId: string;
  vectorId?: string;
  error?: string;
}

export interface BatchIngestionResult {
  total: number;
  successful: number;
  failed: number;
  results: EmailIngestionResult[];
}

export class EmailContextService {
  private vectorService = getSupabaseVectorService();

  /**
   * Ingest a single email into the vector store
   */
  async ingestEmail(email: EmailData): Promise<EmailIngestionResult> {
    try {
      // Validate email data
      if (!EmailParser.validateEmailData(email)) {
        return {
          success: false,
          messageId: email.messageId || "unknown",
          error: "Invalid email data format",
        };
      }

      // Parse email to extract context
      const parsed = EmailParser.parseEmail(email);

      // Generate embedding and store in vector database
      const vectorId = await this.storeEmailVector(parsed);

      return {
        success: true,
        messageId: email.messageId,
        vectorId,
      };
    } catch (error) {
      console.error(`Failed to ingest email ${email.messageId}:`, error);
      return {
        success: false,
        messageId: email.messageId,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Ingest multiple emails in batch
   */
  async ingestEmailBatch(emails: EmailData[]): Promise<BatchIngestionResult> {
    const results: EmailIngestionResult[] = [];
    let successful = 0;
    let failed = 0;

    // Process emails in parallel batches for efficiency
    const batchSize = parseInt(process.env.EMAIL_BATCH_SIZE || "10", 10);
    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize);

      const batchResults = await Promise.all(batch.map((email) => this.ingestEmail(email)));

      batchResults.forEach((result) => {
        results.push(result);
        if (result.success) {
          successful++;
        } else {
          failed++;
        }
      });

      // Log progress for large batches
      if (emails.length > batchSize) {
        console.log(
          `Email ingestion progress: ${results.length}/${emails.length} ` +
            `(${successful} successful, ${failed} failed)`
        );
      }
    }

    return {
      total: emails.length,
      successful,
      failed,
      results,
    };
  }

  /**
   * Store parsed email context as a vector
   */
  private async storeEmailVector(parsed: ParsedEmailContext): Promise<string> {
    const vectorId = await this.vectorService.upsertVector(
      parsed.content,
      "email",
      parsed.messageId,
      {
        ...parsed.metadata,
        threadId: parsed.threadId,
      }
    );

    return vectorId;
  }

  /**
   * Search for emails by content similarity
   */
  async searchEmails(
    query: string,
    options: {
      matchThreshold?: number;
      matchCount?: number;
      dateFrom?: string;
      dateTo?: string;
      participants?: string[];
    } = {}
  ) {
    const results = await this.vectorService.searchVectors(query, {
      matchThreshold: options.matchThreshold || 0.78,
      matchCount: options.matchCount || 10,
      sourceTypes: ["email"],
    });

    // Apply additional filters if provided
    let filtered = results;

    if (options.dateFrom) {
      filtered = filtered.filter((r) => new Date(r.metadata.date) >= new Date(options.dateFrom!));
    }

    if (options.dateTo) {
      filtered = filtered.filter((r) => new Date(r.metadata.date) <= new Date(options.dateTo!));
    }

    if (options.participants && options.participants.length > 0) {
      filtered = filtered.filter((r) => {
        const threadParticipants = r.metadata.threadParticipants || [];
        return options.participants!.some((p) => threadParticipants.includes(p));
      });
    }

    return filtered;
  }

  /**
   * Get email statistics from vector store
   */
  async getEmailStats(): Promise<{
    totalEmails: number;
    dateRange: { earliest: string; latest: string } | null;
    topParticipants: Array<{ email: string; count: number }>;
  }> {
    try {
      const stats = await this.vectorService.getVectorStats();

      // Find email-specific stats
      const emailStats = Array.isArray(stats)
        ? stats.find((s: any) => s.source_type === "email")
        : null;

      if (!emailStats) {
        return {
          totalEmails: 0,
          dateRange: null,
          topParticipants: [],
        };
      }

      return {
        totalEmails: emailStats.total_count || 0,
        dateRange: emailStats.date_range || null,
        topParticipants: emailStats.top_participants || [],
      };
    } catch (error) {
      console.error("Failed to get email stats:", error);
      return {
        totalEmails: 0,
        dateRange: null,
        topParticipants: [],
      };
    }
  }

  /**
   * Delete email vectors by message ID
   */
  async deleteEmail(messageId: string): Promise<boolean> {
    try {
      const count = await this.vectorService.deleteVectorsBySource("email", messageId);
      return count > 0;
    } catch (error) {
      console.error(`Failed to delete email ${messageId}:`, error);
      return false;
    }
  }

  /**
   * Delete all email vectors (use with caution!)
   */
  async deleteAllEmails(): Promise<number> {
    try {
      return await this.vectorService.deleteVectorsBySource("email");
    } catch (error) {
      console.error("Failed to delete all emails:", error);
      throw error;
    }
  }

  /**
   * Re-index an existing email (useful if parsing logic changes)
   */
  async reindexEmail(email: EmailData): Promise<EmailIngestionResult> {
    // Delete existing vector first
    await this.deleteEmail(email.messageId);

    // Re-ingest with updated parsing
    return await this.ingestEmail(email);
  }

  /**
   * Validate and repair email vectors
   * Useful for maintenance and data quality checks
   */
  async validateEmailVectors(): Promise<{
    total: number;
    valid: number;
    invalid: number;
    issues: Array<{ messageId: string; issue: string }>;
  }> {
    // This would query all email vectors and check for:
    // - Missing required metadata fields
    // - Malformed dates
    // - Empty content
    // - Invalid message IDs
    // Implementation depends on your specific validation rules

    // Placeholder implementation
    return {
      total: 0,
      valid: 0,
      invalid: 0,
      issues: [],
    };
  }
}

// Singleton instance
let instance: EmailContextService | null = null;

export function getEmailContextService(): EmailContextService {
  if (!instance) {
    instance = new EmailContextService();
  }
  return instance;
}

export default EmailContextService;
