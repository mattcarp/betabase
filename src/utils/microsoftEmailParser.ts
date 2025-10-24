/**
 * Microsoft Email Parser Extensions
 * Specialized parsing for Microsoft Teams and Outlook emails
 */

import { EmailData, ParsedEmailContext } from "./emailParser";

export interface MicrosoftEmailData extends EmailData {
  // Microsoft-specific fields
  conversationId?: string; // Teams conversation ID
  conversationTopic?: string; // Teams channel/topic
  importance?: "low" | "normal" | "high";
  sensitivity?: "normal" | "personal" | "private" | "confidential";
  categories?: string[]; // Outlook categories
  flag?: {
    flagStatus: "notFlagged" | "complete" | "flagged";
    dueDateTime?: string;
  };

  // Teams-specific
  isTeamsMessage?: boolean;
  teamsChannelId?: string;
  teamsChannelName?: string;
  teamId?: string;
  teamName?: string;
  mentions?: Array<{
    id: string;
    displayName: string;
    userPrincipalName?: string;
  }>;

  // Meeting-related
  isMeetingRequest?: boolean;
  meetingDetails?: {
    subject: string;
    startTime: string;
    endTime: string;
    location?: string;
    isOnlineMeeting?: boolean;
    joinUrl?: string;
    organizer?: string;
    attendees?: string[];
  };

  // Outlook-specific
  internetMessageId?: string; // X-Message-ID header
  conversationIndex?: string; // Thread ordering
  outlookCategories?: string[];
}

export interface MicrosoftEmailMetadata {
  // Standard email metadata
  from: string;
  to: string[];
  cc?: string[];
  subject: string;
  date: string;
  hasAttachments: boolean;
  attachmentCount: number;
  isReply: boolean;
  threadParticipants: string[];

  // Microsoft-specific metadata
  isMicrosoft: true;
  importance?: "low" | "normal" | "high";
  sensitivity?: string;
  categories?: string[];

  // Teams-specific
  isTeamsMessage: boolean;
  teamsChannel?: string;
  teamName?: string;
  mentionedUsers?: string[];

  // Meeting-specific
  isMeeting: boolean;
  meetingTime?: {
    start: string;
    end: string;
  };
  meetingJoinUrl?: string;

  // Enhanced context
  hasActionableContent: boolean; // Flags, meetings, mentions
  urgencyScore: number; // 0-10 based on importance, flags, keywords
  contentLength: number;
  extractedAt: string;
}

export class MicrosoftEmailParser {
  /**
   * Parse Microsoft Teams/Outlook email with enhanced metadata
   */
  static parseMicrosoftEmail(email: MicrosoftEmailData): ParsedEmailContext & {
    metadata: MicrosoftEmailMetadata;
  } {
    const content = this.buildMicrosoftSearchableContent(email);
    const threadParticipants = this.extractThreadParticipants(email);
    const mentionedUsers = this.extractMentions(email);

    return {
      messageId: email.messageId,
      threadId: email.threadId || email.conversationId,
      content,
      metadata: {
        // Standard metadata
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

        // Microsoft-specific
        isMicrosoft: true,
        importance: email.importance,
        sensitivity: email.sensitivity,
        categories: email.categories || email.outlookCategories,

        // Teams-specific
        isTeamsMessage: email.isTeamsMessage || false,
        teamsChannel: email.teamsChannelName,
        teamName: email.teamName,
        mentionedUsers,

        // Meeting-specific
        isMeeting: email.isMeetingRequest || false,
        meetingTime: email.meetingDetails
          ? {
              start: email.meetingDetails.startTime,
              end: email.meetingDetails.endTime,
            }
          : undefined,
        meetingJoinUrl: email.meetingDetails?.joinUrl,

        // Enhanced context
        hasActionableContent: this.detectActionableContent(email),
        urgencyScore: this.calculateUrgencyScore(email),
      } as MicrosoftEmailMetadata,
    };
  }

  /**
   * Build searchable content optimized for Teams/Outlook emails
   */
  private static buildMicrosoftSearchableContent(email: MicrosoftEmailData): string {
    const parts: string[] = [];

    // Subject with importance indicator
    if (email.subject) {
      const importancePrefix = email.importance === "high" ? "[IMPORTANT] " : "";
      parts.push(`Subject: ${importancePrefix}${email.subject}`);
    }

    // Teams context
    if (email.isTeamsMessage) {
      if (email.teamName && email.teamsChannelName) {
        parts.push(`Teams: ${email.teamName} > ${email.teamsChannelName}`);
      }
    }

    // Meeting context
    if (email.isMeetingRequest && email.meetingDetails) {
      parts.push(`Meeting Request`);
      parts.push(`Time: ${email.meetingDetails.startTime}`);
      if (email.meetingDetails.location) {
        parts.push(`Location: ${email.meetingDetails.location}`);
      }
      if (email.meetingDetails.isOnlineMeeting) {
        parts.push(`Online Meeting: ${email.meetingDetails.joinUrl}`);
      }
    }

    // From/To with better Teams formatting
    parts.push(`From: ${this.formatEmailAddress(email.from)}`);
    parts.push(`To: ${email.to.map(this.formatEmailAddress).join(", ")}`);

    if (email.cc && email.cc.length > 0) {
      parts.push(`CC: ${email.cc.map(this.formatEmailAddress).join(", ")}`);
    }

    // Categories/tags
    if (email.categories && email.categories.length > 0) {
      parts.push(`Categories: ${email.categories.join(", ")}`);
    }

    // Mentions
    if (email.mentions && email.mentions.length > 0) {
      const mentionNames = email.mentions.map((m) => m.displayName).join(", ");
      parts.push(`Mentioned: ${mentionNames}`);
    }

    // Body content (cleaned)
    const bodyText = this.extractMicrosoftBodyText(email);
    if (bodyText) {
      parts.push(`\nContent:\n${bodyText}`);
    }

    // Attachments
    if (email.attachments && email.attachments.length > 0) {
      const attachmentNames = email.attachments.map((a) => a.filename).join(", ");
      parts.push(`\nAttachments: ${attachmentNames}`);
    }

    return parts.join("\n");
  }

  /**
   * Extract clean text from Microsoft email body
   * Handles Outlook's specific HTML patterns
   */
  private static extractMicrosoftBodyText(email: MicrosoftEmailData): string {
    if (email.htmlBody) {
      return this.cleanMicrosoftHtml(email.htmlBody);
    }

    if (email.body) {
      return this.cleanText(email.body);
    }

    return "";
  }

  /**
   * Clean Microsoft-specific HTML patterns
   */
  private static cleanMicrosoftHtml(html: string): string {
    let text = html;

    // Remove Outlook-specific markup
    text = text.replace(/<o:p>.*?<\/o:p>/gi, "");
    text = text.replace(/<v:.*?>.*?<\/v:.*?>/gi, "");
    text = text.replace(/<!--\[if.*?\]>.*?<!\[endif\]-->/gi, "");

    // Remove Teams-specific elements
    text = text.replace(/<div[^>]*class="[^"]*teams-message-wrapper[^"]*"[^>]*>.*?<\/div>/gi, "");

    // Remove Microsoft tracking pixels
    text = text.replace(/<img[^>]*src="[^"]*safelink[^"]*"[^>]*>/gi, "");

    // Remove Microsoft Safe Links wrapping
    text = text.replace(
      /https:\/\/[\w-]+\.safelinks\.protection\.outlook\.com\/[^"'\s]+/g,
      (match) => {
        // Try to extract original URL from Safe Link
        const urlMatch = match.match(/url=([^&"'\s]+)/);
        if (urlMatch) {
          try {
            return decodeURIComponent(urlMatch[1]);
          } catch {
            return match;
          }
        }
        return match;
      }
    );

    // Standard HTML cleaning
    text = this.stripHtml(text);

    // Remove Outlook signature separators
    text = text.replace(/_{10,}/g, ""); // Long underscores

    return this.cleanText(text);
  }

  /**
   * Extract @mentions from Teams messages
   */
  private static extractMentions(email: MicrosoftEmailData): string[] {
    if (email.mentions && email.mentions.length > 0) {
      return email.mentions.map((m) => m.displayName);
    }

    // Try to extract from body if not provided
    if (email.body || email.htmlBody) {
      const content = email.body || email.htmlBody || "";
      const mentionPattern = /@\[([^\]]+)\]/g;
      const mentions: string[] = [];
      let match;

      while ((match = mentionPattern.exec(content)) !== null) {
        mentions.push(match[1]);
      }

      return mentions;
    }

    return [];
  }

  /**
   * Detect if email has actionable content
   */
  private static detectActionableContent(email: MicrosoftEmailData): boolean {
    // High importance
    if (email.importance === "high") return true;

    // Flagged
    if (email.flag?.flagStatus === "flagged") return true;

    // Meeting request
    if (email.isMeetingRequest) return true;

    // Has mentions (someone needs your attention)
    if (email.mentions && email.mentions.length > 0) return true;

    // Contains action keywords in subject
    const actionKeywords = [
      "urgent",
      "action required",
      "please review",
      "approval needed",
      "deadline",
      "asap",
      "important",
      "critical",
    ];

    const subject = email.subject.toLowerCase();
    return actionKeywords.some((keyword) => subject.includes(keyword));
  }

  /**
   * Calculate urgency score (0-10)
   */
  private static calculateUrgencyScore(email: MicrosoftEmailData): number {
    let score = 5; // Base score

    // Importance
    if (email.importance === "high") score += 2;
    if (email.importance === "low") score -= 1;

    // Flagged
    if (email.flag?.flagStatus === "flagged") score += 2;

    // Meeting request (especially urgent if soon)
    if (email.isMeetingRequest) {
      score += 1;
      if (email.meetingDetails) {
        const meetingTime = new Date(email.meetingDetails.startTime);
        const now = new Date();
        const hoursUntil = (meetingTime.getTime() - now.getTime()) / (1000 * 60 * 60);
        if (hoursUntil < 24) score += 2;
        if (hoursUntil < 2) score += 2;
      }
    }

    // Mentioned
    if (email.mentions && email.mentions.length > 0) score += 1;

    // Keywords in subject
    const urgentKeywords = ["urgent", "asap", "critical", "emergency"];
    const subject = email.subject.toLowerCase();
    if (urgentKeywords.some((kw) => subject.includes(kw))) score += 2;

    // Sensitivity
    if (email.sensitivity === "confidential") score += 1;

    return Math.min(10, Math.max(0, score));
  }

  /**
   * Format email address for display
   */
  private static formatEmailAddress(email: string): string {
    // Extract name from "Name <email@domain.com>" format
    const match = email.match(/^(.+?)\s*<(.+?)>$/);
    if (match) {
      return match[1].trim();
    }
    return email;
  }

  /**
   * Standard helper methods
   */
  private static stripHtml(html: string): string {
    let text = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
    text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "");
    text = text.replace(/<br\s*\/?>/gi, "\n");
    text = text.replace(/<\/p>/gi, "\n\n");
    text = text.replace(/<\/div>/gi, "\n");
    text = text.replace(/<\/li>/gi, "\n");
    text = text.replace(/<\/tr>/gi, "\n");
    text = text.replace(/<[^>]+>/g, "");
    return text;
  }

  private static cleanText(text: string): string {
    text = text.replace(/\r\n/g, "\n");
    text = text.replace(/\r/g, "\n");
    text = text.replace(/[ \t]+/g, " ");
    text = text.replace(/\n{3,}/g, "\n\n");
    return text.trim();
  }

  private static extractThreadParticipants(email: MicrosoftEmailData): string[] {
    const participants = new Set<string>();
    participants.add(email.from);
    email.to.forEach((addr) => participants.add(addr));
    email.cc?.forEach((addr) => participants.add(addr));
    email.bcc?.forEach((addr) => participants.add(addr));
    return Array.from(participants);
  }

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
}
