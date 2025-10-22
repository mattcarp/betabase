/**
 * Microsoft Graph API Integration Service
 * Fetches and processes emails from Outlook and Teams
 */

import { getEmailContextService } from "./emailContextService";
import { MicrosoftEmailData, MicrosoftEmailParser } from "@/utils/microsoftEmailParser";

export interface GraphAPIConfig {
  accessToken: string;
  baseUrl?: string;
}

export interface FetchEmailsOptions {
  folder?: string; // "inbox", "sent", "drafts", etc.
  top?: number; // Number of emails to fetch
  skip?: number; // Pagination offset
  filter?: string; // OData filter query
  select?: string[]; // Fields to select
  orderBy?: string; // Sort order
}

export interface SyncResult {
  total: number;
  successful: number;
  failed: number;
  errors: Array<{ messageId: string; error: string }>;
}

export class MicrosoftGraphService {
  private accessToken: string;
  private baseUrl: string;
  private emailService = getEmailContextService();

  constructor(config: GraphAPIConfig) {
    this.accessToken = config.accessToken;
    this.baseUrl = config.baseUrl || "https://graph.microsoft.com/v1.0";
  }

  /**
   * Fetch and ingest emails from Outlook
   */
  async syncOutlookEmails(options: FetchEmailsOptions = {}): Promise<SyncResult> {
    try {
      const emails = await this.fetchOutlookEmails(options);
      const microsoftEmails = this.convertToMicrosoftEmailData(emails);

      console.log(`Fetched ${microsoftEmails.length} Outlook emails`);

      // Parse with Microsoft-specific parser
      const parsed = microsoftEmails.map((email) =>
        MicrosoftEmailParser.parseMicrosoftEmail(email)
      );

      // Ingest into vector store
      const results = await Promise.all(
        parsed.map((p) =>
          this.emailService.ingestEmail({
            messageId: p.messageId,
            from: p.metadata.from,
            to: p.metadata.to,
            cc: p.metadata.cc,
            subject: p.metadata.subject,
            body: p.content,
            date: p.metadata.date,
            threadId: p.threadId,
          })
        )
      );

      const successful = results.filter((r) => r.success).length;
      const failed = results.filter((r) => !r.success).length;
      const errors = results
        .filter((r) => !r.success)
        .map((r) => ({ messageId: r.messageId, error: r.error || "Unknown error" }));

      return {
        total: results.length,
        successful,
        failed,
        errors,
      };
    } catch (error) {
      console.error("Failed to sync Outlook emails:", error);
      throw error;
    }
  }

  /**
   * Fetch raw emails from Microsoft Graph API
   */
  private async fetchOutlookEmails(options: FetchEmailsOptions = {}): Promise<any[]> {
    const {
      folder = "inbox",
      top = 50,
      skip = 0,
      filter,
      select = [
        "id",
        "subject",
        "from",
        "toRecipients",
        "ccRecipients",
        "bccRecipients",
        "body",
        "receivedDateTime",
        "hasAttachments",
        "attachments",
        "importance",
        "categories",
        "conversationId",
        "internetMessageId",
        "isRead",
        "isDraft",
      ],
      orderBy = "receivedDateTime desc",
    } = options;

    // Build query parameters
    const params = new URLSearchParams();
    params.append("$top", top.toString());
    params.append("$skip", skip.toString());
    params.append("$select", select.join(","));
    params.append("$orderby", orderBy);
    if (filter) {
      params.append("$filter", filter);
    }

    const url = `${this.baseUrl}/me/mailFolders/${folder}/messages?${params.toString()}`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Microsoft Graph API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.value || [];
  }

  /**
   * Fetch Teams channel messages
   */
  async syncTeamsMessages(
    teamId: string,
    channelId: string,
    options: { top?: number; since?: string } = {}
  ): Promise<SyncResult> {
    try {
      const messages = await this.fetchTeamsMessages(teamId, channelId, options);
      const microsoftEmails = this.convertTeamsMessagesToEmailData(messages, teamId, channelId);

      console.log(`Fetched ${microsoftEmails.length} Teams messages`);

      // Parse with Microsoft-specific parser
      const parsed = microsoftEmails.map((email) =>
        MicrosoftEmailParser.parseMicrosoftEmail(email)
      );

      // Ingest into vector store
      const results = await Promise.all(
        parsed.map((p) =>
          this.emailService.ingestEmail({
            messageId: p.messageId,
            from: p.metadata.from,
            to: p.metadata.to,
            subject: p.metadata.subject,
            body: p.content,
            date: p.metadata.date,
            threadId: p.threadId,
          })
        )
      );

      const successful = results.filter((r) => r.success).length;
      const failed = results.filter((r) => !r.success).length;
      const errors = results
        .filter((r) => !r.success)
        .map((r) => ({ messageId: r.messageId, error: r.error || "Unknown error" }));

      return {
        total: results.length,
        successful,
        failed,
        errors,
      };
    } catch (error) {
      console.error("Failed to sync Teams messages:", error);
      throw error;
    }
  }

  /**
   * Fetch raw Teams messages from Microsoft Graph API
   */
  private async fetchTeamsMessages(
    teamId: string,
    channelId: string,
    options: { top?: number; since?: string } = {}
  ): Promise<any[]> {
    const { top = 50, since } = options;

    const params = new URLSearchParams();
    params.append("$top", top.toString());
    if (since) {
      params.append("$filter", `lastModifiedDateTime gt ${since}`);
    }

    const url = `${this.baseUrl}/teams/${teamId}/channels/${channelId}/messages?${params.toString()}`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Microsoft Graph API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.value || [];
  }

  /**
   * Convert Microsoft Graph email response to MicrosoftEmailData
   */
  private convertToMicrosoftEmailData(graphEmails: any[]): MicrosoftEmailData[] {
    return graphEmails.map((email) => ({
      messageId: email.id,
      from: email.from?.emailAddress?.address || "",
      to: (email.toRecipients || []).map((r: any) => r.emailAddress.address),
      cc: (email.ccRecipients || []).map((r: any) => r.emailAddress.address),
      bcc: (email.bccRecipients || []).map((r: any) => r.emailAddress.address),
      subject: email.subject || "(No Subject)",
      body: email.body?.contentType === "text" ? email.body.content : "",
      htmlBody: email.body?.contentType === "html" ? email.body.content : undefined,
      date: new Date(email.receivedDateTime),
      threadId: email.conversationId,
      inReplyTo: undefined, // Not directly available
      references: undefined,
      attachments: (email.attachments || []).map((a: any) => ({
        filename: a.name,
        contentType: a.contentType,
        size: a.size,
      })),

      // Microsoft-specific
      conversationId: email.conversationId,
      importance: email.importance as "low" | "normal" | "high",
      categories: email.categories,
      internetMessageId: email.internetMessageId,
      isTeamsMessage: false,
    }));
  }

  /**
   * Convert Teams messages to MicrosoftEmailData format
   */
  private convertTeamsMessagesToEmailData(
    messages: any[],
    teamId: string,
    channelId: string
  ): MicrosoftEmailData[] {
    return messages.map((msg) => ({
      messageId: msg.id,
      from: msg.from?.user?.displayName || msg.from?.user?.id || "Unknown",
      to: [], // Teams messages don't have explicit recipients
      subject: msg.subject || "(Teams Message)",
      body: msg.body?.contentType === "text" ? msg.body.content : "",
      htmlBody: msg.body?.contentType === "html" ? msg.body.content : undefined,
      date: new Date(msg.createdDateTime),

      // Teams-specific
      isTeamsMessage: true,
      teamId,
      teamsChannelId: channelId,
      conversationId: msg.id,
      mentions: (msg.mentions || []).map((m: any) => ({
        id: m.id,
        displayName: m.mentioned?.user?.displayName || "",
        userPrincipalName: m.mentioned?.user?.userPrincipalName,
      })),
      importance: msg.importance as "low" | "normal" | "high",
    }));
  }

  /**
   * Fetch meeting invites from Outlook calendar
   */
  async syncMeetings(
    options: { startDateTime?: string; endDateTime?: string; top?: number } = {}
  ): Promise<SyncResult> {
    try {
      const meetings = await this.fetchMeetings(options);
      const microsoftEmails = this.convertMeetingsToEmailData(meetings);

      console.log(`Fetched ${microsoftEmails.length} meeting invites`);

      // Parse with Microsoft-specific parser
      const parsed = microsoftEmails.map((email) =>
        MicrosoftEmailParser.parseMicrosoftEmail(email)
      );

      // Ingest into vector store
      const results = await Promise.all(
        parsed.map((p) =>
          this.emailService.ingestEmail({
            messageId: p.messageId,
            from: p.metadata.from,
            to: p.metadata.to,
            subject: p.metadata.subject,
            body: p.content,
            date: p.metadata.date,
          })
        )
      );

      const successful = results.filter((r) => r.success).length;
      const failed = results.filter((r) => !r.success).length;
      const errors = results
        .filter((r) => !r.success)
        .map((r) => ({ messageId: r.messageId, error: r.error || "Unknown error" }));

      return {
        total: results.length,
        successful,
        failed,
        errors,
      };
    } catch (error) {
      console.error("Failed to sync meetings:", error);
      throw error;
    }
  }

  /**
   * Fetch calendar events from Microsoft Graph API
   */
  private async fetchMeetings(
    options: { startDateTime?: string; endDateTime?: string; top?: number } = {}
  ): Promise<any[]> {
    const { top = 50, startDateTime, endDateTime } = options;

    const params = new URLSearchParams();
    params.append("$top", top.toString());

    if (startDateTime && endDateTime) {
      params.append(
        "$filter",
        `start/dateTime ge '${startDateTime}' and end/dateTime le '${endDateTime}'`
      );
    }

    const url = `${this.baseUrl}/me/calendar/events?${params.toString()}`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Microsoft Graph API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.value || [];
  }

  /**
   * Convert calendar events to MicrosoftEmailData format
   */
  private convertMeetingsToEmailData(meetings: any[]): MicrosoftEmailData[] {
    return meetings.map((meeting) => ({
      messageId: meeting.id,
      from: meeting.organizer?.emailAddress?.address || "",
      to: (meeting.attendees || []).map((a: any) => a.emailAddress.address),
      subject: `Meeting: ${meeting.subject}`,
      body: meeting.bodyPreview || meeting.body?.content || "",
      htmlBody: meeting.body?.contentType === "html" ? meeting.body.content : undefined,
      date: new Date(meeting.createdDateTime),

      // Meeting-specific
      isMeetingRequest: true,
      meetingDetails: {
        subject: meeting.subject,
        startTime: meeting.start.dateTime,
        endTime: meeting.end.dateTime,
        location: meeting.location?.displayName,
        isOnlineMeeting: meeting.isOnlineMeeting,
        joinUrl: meeting.onlineMeeting?.joinUrl,
        organizer: meeting.organizer?.emailAddress?.address,
        attendees: (meeting.attendees || []).map((a: any) => a.emailAddress.address),
      },
      importance: meeting.importance as "low" | "normal" | "high",
    }));
  }

  /**
   * Get all teams the user is a member of
   */
  async getUserTeams(): Promise<Array<{ id: string; displayName: string }>> {
    const url = `${this.baseUrl}/me/joinedTeams`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Microsoft Graph API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return (data.value || []).map((team: any) => ({
      id: team.id,
      displayName: team.displayName,
    }));
  }

  /**
   * Get all channels in a team
   */
  async getTeamChannels(teamId: string): Promise<Array<{ id: string; displayName: string }>> {
    const url = `${this.baseUrl}/teams/${teamId}/channels`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Microsoft Graph API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return (data.value || []).map((channel: any) => ({
      id: channel.id,
      displayName: channel.displayName,
    }));
  }
}

// Singleton factory
let instance: MicrosoftGraphService | null = null;

export function getMicrosoftGraphService(config: GraphAPIConfig): MicrosoftGraphService {
  if (!instance || instance["accessToken"] !== config.accessToken) {
    instance = new MicrosoftGraphService(config);
  }
  return instance;
}

export default MicrosoftGraphService;
