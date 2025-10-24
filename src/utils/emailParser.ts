/**
 * Email Parser Utility
 * Extracts relevant context from email data for vectorization
 */

export interface EmailData {
  messageId: string;
  from: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  htmlBody?: string;
  date: Date | string;
  threadId?: string;
  inReplyTo?: string;
  references?: string[];
  attachments?: Array<{
    filename: string;
    contentType: string;
    size: number;
  }>;
  headers?: Record<string, string>;
}

export interface ParsedEmailContext {
  // Core identifiers
  messageId: string;
  threadId?: string;

  // Extracted content for vectorization
  content: string;

  // Metadata for filtering and context
  metadata: {
    from: string;
    to: string[];
    cc?: string[];
    subject: string;
    date: string;
    hasAttachments: boolean;
    attachmentCount: number;
    isReply: boolean;
    threadParticipants: string[];
    contentLength: number;
    extractedAt: string;
  };
}

export class EmailParser {
  /**
   * Parse email and extract context for vectorization
   */
  static parseEmail(email: EmailData): ParsedEmailContext {
    const content = this.buildSearchableContent(email);
    const threadParticipants = this.extractThreadParticipants(email);

    return {
      messageId: email.messageId,
      threadId: email.threadId,
      content,
      metadata: {
        from: email.from,
        to: email.to,
        cc: email.cc,
        subject: email.subject,
        date: this.normalizeDate(email.date),
        hasAttachments: (email.attachments?.length || 0) > 0,
        attachmentCount: email.attachments?.length || 0,
        isReply: !!email.inReplyTo || !!email.references?.length,
        threadParticipants,
        contentLength: content.length,
        extractedAt: new Date().toISOString(),
      },
    };
  }

  /**
   * Build searchable content string from email components
   * This is what gets vectorized
   */
  private static buildSearchableContent(email: EmailData): string {
    const parts: string[] = [];

    // Subject is critical for context
    if (email.subject) {
      parts.push(`Subject: ${email.subject}`);
    }

    // From/To context
    parts.push(`From: ${email.from}`);
    parts.push(`To: ${email.to.join(", ")}`);

    if (email.cc && email.cc.length > 0) {
      parts.push(`CC: ${email.cc.join(", ")}`);
    }

    // Clean and extract body text
    const bodyText = this.extractTextFromBody(email);
    if (bodyText) {
      parts.push(`\nContent:\n${bodyText}`);
    }

    // Attachment context (names only, not content)
    if (email.attachments && email.attachments.length > 0) {
      const attachmentNames = email.attachments.map((a) => a.filename).join(", ");
      parts.push(`\nAttachments: ${attachmentNames}`);
    }

    return parts.join("\n");
  }

  /**
   * Extract plain text from email body (HTML or plain text)
   */
  private static extractTextFromBody(email: EmailData): string {
    // Prefer HTML body if available (usually more complete)
    if (email.htmlBody) {
      return this.stripHtml(email.htmlBody);
    }

    // Fallback to plain text body
    if (email.body) {
      return this.cleanText(email.body);
    }

    return "";
  }

  /**
   * Strip HTML tags and extract text content
   */
  private static stripHtml(html: string): string {
    // Remove script and style tags completely
    let text = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
    text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "");

    // Replace common HTML elements with appropriate text
    text = text.replace(/<br\s*\/?>/gi, "\n");
    text = text.replace(/<\/p>/gi, "\n\n");
    text = text.replace(/<\/div>/gi, "\n");
    text = text.replace(/<\/li>/gi, "\n");
    text = text.replace(/<\/tr>/gi, "\n");

    // Remove all remaining HTML tags
    text = text.replace(/<[^>]+>/g, "");

    // Decode HTML entities
    text = this.decodeHtmlEntities(text);

    // Clean up whitespace
    return this.cleanText(text);
  }

  /**
   * Clean and normalize text content
   */
  private static cleanText(text: string): string {
    // Normalize line breaks
    text = text.replace(/\r\n/g, "\n");
    text = text.replace(/\r/g, "\n");

    // Remove excessive whitespace but preserve paragraph breaks
    text = text.replace(/[ \t]+/g, " ");
    text = text.replace(/\n{3,}/g, "\n\n");

    // Remove email signatures (common patterns)
    text = this.removeEmailSignature(text);

    // Remove quoted replies (lines starting with >)
    text = text
      .split("\n")
      .filter((line) => !line.trim().startsWith(">"))
      .join("\n");

    return text.trim();
  }

  /**
   * Remove common email signature patterns
   */
  private static removeEmailSignature(text: string): string {
    // Common signature delimiters
    const signaturePatterns = [
      /\n--\s*\n[\s\S]*$/m, // Standard -- delimiter
      /\n_{3,}\n[\s\S]*$/m, // Underscores
      /\nBest regards?,[\s\S]*$/im,
      /\nSincerely,[\s\S]*$/im,
      /\nThanks?,[\s\S]*$/im,
      /\nRegards?,[\s\S]*$/im,
    ];

    for (const pattern of signaturePatterns) {
      text = text.replace(pattern, "");
    }

    return text;
  }

  /**
   * Decode common HTML entities
   */
  private static decodeHtmlEntities(text: string): string {
    const entities: Record<string, string> = {
      "&amp;": "&",
      "&lt;": "<",
      "&gt;": ">",
      "&quot;": '"',
      "&#39;": "'",
      "&nbsp;": " ",
      "&copy;": "©",
      "&reg;": "®",
      "&mdash;": "—",
      "&ndash;": "–",
    };

    let decoded = text;
    for (const [entity, char] of Object.entries(entities)) {
      decoded = decoded.replace(new RegExp(entity, "g"), char);
    }

    // Decode numeric entities
    decoded = decoded.replace(/&#(\d+);/g, (_match, dec) => {
      return String.fromCharCode(parseInt(dec, 10));
    });

    // Decode hex entities
    decoded = decoded.replace(/&#x([0-9a-f]+);/gi, (_match, hex) => {
      return String.fromCharCode(parseInt(hex, 16));
    });

    return decoded;
  }

  /**
   * Extract all unique participants from email thread
   */
  private static extractThreadParticipants(email: EmailData): string[] {
    const participants = new Set<string>();

    participants.add(email.from);
    email.to.forEach((addr) => participants.add(addr));
    email.cc?.forEach((addr) => participants.add(addr));
    email.bcc?.forEach((addr) => participants.add(addr));

    return Array.from(participants);
  }

  /**
   * Normalize date to ISO string
   */
  private static normalizeDate(date: Date | string): string {
    if (date instanceof Date) {
      return date.toISOString();
    }
    try {
      return new Date(date).toISOString();
    } catch {
      return new Date().toISOString();
    }
  }

  /**
   * Batch parse multiple emails
   */
  static parseEmails(emails: EmailData[]): ParsedEmailContext[] {
    return emails.map((email) => this.parseEmail(email));
  }

  /**
   * Validate email data before parsing
   */
  static validateEmailData(email: any): email is EmailData {
    return (
      typeof email === "object" &&
      typeof email.messageId === "string" &&
      typeof email.from === "string" &&
      Array.isArray(email.to) &&
      typeof email.subject === "string" &&
      (typeof email.body === "string" || typeof email.htmlBody === "string") &&
      (email.date instanceof Date || typeof email.date === "string")
    );
  }
}
