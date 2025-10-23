/**
 * Microsoft Email Parser Unit Tests
 * Tests for Teams and Outlook specific parsing
 */

import { describe, test, expect } from "@jest/globals";
import { MicrosoftEmailParser, MicrosoftEmailData } from "@/utils/microsoftEmailParser";

describe("MicrosoftEmailParser", () => {
  describe("Outlook email parsing", () => {
    test("should parse high importance Outlook email", () => {
      const email: MicrosoftEmailData = {
        messageId: "outlook-001",
        from: "manager@company.com",
        to: ["employee@company.com"],
        subject: "Urgent: Q1 Budget Approval Needed",
        htmlBody: `<html><body>
          <p>Hi Team,</p>
          <p>We need immediate approval for the <strong>Q1 budget</strong>.</p>
          <p>Please review by EOD.</p>
        </body></html>`,
        date: new Date("2024-01-15T10:00:00Z"),
        importance: "high",
        categories: ["Budget", "Urgent"],
      };

      const result = MicrosoftEmailParser.parseMicrosoftEmail(email);

      expect(result.messageId).toBe("outlook-001");
      expect(result.metadata.isMicrosoft).toBe(true);
      expect(result.metadata.importance).toBe("high");
      expect(result.metadata.categories).toContain("Budget");
      expect(result.metadata.urgencyScore).toBeGreaterThan(7);
      expect(result.metadata.hasActionableContent).toBe(true);
      expect(result.content).toContain("[IMPORTANT]");
      expect(result.content).toContain("Q1 budget");
    });

    test("should handle Outlook Safe Links", () => {
      const email: MicrosoftEmailData = {
        messageId: "outlook-002",
        from: "sender@company.com",
        to: ["recipient@company.com"],
        subject: "Link Test",
        htmlBody: `<p>Check this link: <a href="https://nam12.safelinks.protection.outlook.com/?url=https%3A%2F%2Fexample.com">Click here</a></p>`,
        date: new Date(),
      };

      const result = MicrosoftEmailParser.parseMicrosoftEmail(email);

      expect(result.content).toContain("example.com");
      expect(result.content).not.toContain("safelinks.protection");
    });

    test("should parse Outlook meeting request", () => {
      const email: MicrosoftEmailData = {
        messageId: "outlook-meeting-001",
        from: "organizer@company.com",
        to: ["attendee@company.com"],
        subject: "Team Sync Meeting",
        body: "Let's discuss the project status",
        date: new Date(),
        isMeetingRequest: true,
        meetingDetails: {
          subject: "Team Sync Meeting",
          startTime: "2024-01-20T14:00:00Z",
          endTime: "2024-01-20T15:00:00Z",
          location: "Conference Room A",
          isOnlineMeeting: true,
          joinUrl: "https://teams.microsoft.com/l/meetup-join/...",
          organizer: "organizer@company.com",
          attendees: ["attendee@company.com"],
        },
      };

      const result = MicrosoftEmailParser.parseMicrosoftEmail(email);

      expect(result.metadata.isMeeting).toBe(true);
      expect(result.metadata.meetingJoinUrl).toContain("teams.microsoft.com");
      expect(result.metadata.meetingTime?.start).toBe("2024-01-20T14:00:00Z");
      expect(result.metadata.hasActionableContent).toBe(true);
      expect(result.content).toContain("Meeting Request");
      expect(result.content).toContain("Online Meeting");
    });

    test("should handle flagged emails", () => {
      const email: MicrosoftEmailData = {
        messageId: "outlook-flagged-001",
        from: "sender@company.com",
        to: ["recipient@company.com"],
        subject: "Follow up required",
        body: "Please follow up on this",
        date: new Date(),
        flag: {
          flagStatus: "flagged",
          dueDateTime: "2024-01-18T17:00:00Z",
        },
      };

      const result = MicrosoftEmailParser.parseMicrosoftEmail(email);

      expect(result.metadata.hasActionableContent).toBe(true);
      expect(result.metadata.urgencyScore).toBeGreaterThan(5);
    });
  });

  describe("Teams message parsing", () => {
    test("should parse Teams channel message", () => {
      const email: MicrosoftEmailData = {
        messageId: "teams-msg-001",
        from: "john.doe@company.com",
        to: [],
        subject: "Teams message in Engineering channel",
        htmlBody: `<div>
          <p>Hey team, the new feature is ready for testing!</p>
          <p><at id="0">@Sarah Johnson</at> can you review?</p>
        </div>`,
        date: new Date("2024-01-15T16:30:00Z"),
        isTeamsMessage: true,
        teamId: "team-123",
        teamName: "Engineering Team",
        teamsChannelId: "channel-456",
        teamsChannelName: "General",
        mentions: [
          {
            id: "mention-1",
            displayName: "Sarah Johnson",
            userPrincipalName: "sarah.johnson@company.com",
          },
        ],
      };

      const result = MicrosoftEmailParser.parseMicrosoftEmail(email);

      expect(result.metadata.isTeamsMessage).toBe(true);
      expect(result.metadata.teamName).toBe("Engineering Team");
      expect(result.metadata.teamsChannel).toBe("General");
      expect(result.metadata.mentionedUsers).toContain("Sarah Johnson");
      expect(result.metadata.hasActionableContent).toBe(true);
      expect(result.content).toContain("Teams: Engineering Team > General");
      expect(result.content).toContain("Mentioned: Sarah Johnson");
    });

    test("should parse Teams message with multiple mentions", () => {
      const email: MicrosoftEmailData = {
        messageId: "teams-msg-002",
        from: "alice@company.com",
        to: [],
        subject: "Important update",
        body: "Team update @[Bob Smith] and @[Charlie Davis] - please review the document",
        date: new Date(),
        isTeamsMessage: true,
        teamName: "Product Team",
        teamsChannelName: "Announcements",
      };

      const result = MicrosoftEmailParser.parseMicrosoftEmail(email);

      expect(result.metadata.isTeamsMessage).toBe(true);
      expect(result.metadata.mentionedUsers).toContain("Bob Smith");
      expect(result.metadata.mentionedUsers).toContain("Charlie Davis");
      expect(result.metadata.mentionedUsers?.length).toBe(2);
    });

    test("should calculate urgency for Teams message with high importance", () => {
      const email: MicrosoftEmailData = {
        messageId: "teams-urgent-001",
        from: "manager@company.com",
        to: [],
        subject: "URGENT: Production Issue",
        body: "Critical bug in production, all hands on deck!",
        date: new Date(),
        isTeamsMessage: true,
        importance: "high",
        mentions: [
          {
            id: "1",
            displayName: "DevOps Team",
          },
        ],
      };

      const result = MicrosoftEmailParser.parseMicrosoftEmail(email);

      expect(result.metadata.urgencyScore).toBeGreaterThanOrEqual(8);
      expect(result.metadata.hasActionableContent).toBe(true);
    });
  });

  describe("Urgency scoring", () => {
    test("should give high urgency to imminent meeting", () => {
      const soon = new Date();
      soon.setHours(soon.getHours() + 1); // Meeting in 1 hour

      const email: MicrosoftEmailData = {
        messageId: "urgent-meeting",
        from: "organizer@company.com",
        to: ["attendee@company.com"],
        subject: "Quick sync",
        body: "Meeting soon",
        date: new Date(),
        isMeetingRequest: true,
        meetingDetails: {
          subject: "Quick sync",
          startTime: soon.toISOString(),
          endTime: new Date(soon.getTime() + 30 * 60000).toISOString(),
        },
        importance: "high",
      };

      const result = MicrosoftEmailParser.parseMicrosoftEmail(email);

      expect(result.metadata.urgencyScore).toBeGreaterThanOrEqual(9);
    });

    test("should give low urgency to normal email", () => {
      const email: MicrosoftEmailData = {
        messageId: "normal-email",
        from: "sender@company.com",
        to: ["recipient@company.com"],
        subject: "Regular update",
        body: "Just a regular status update",
        date: new Date(),
        importance: "normal",
      };

      const result = MicrosoftEmailParser.parseMicrosoftEmail(email);

      expect(result.metadata.urgencyScore).toBeLessThanOrEqual(6);
    });

    test("should increase urgency for confidential emails", () => {
      const email: MicrosoftEmailData = {
        messageId: "confidential-email",
        from: "hr@company.com",
        to: ["employee@company.com"],
        subject: "Confidential: Performance Review",
        body: "Your annual review is scheduled",
        date: new Date(),
        sensitivity: "confidential",
        importance: "high",
      };

      const result = MicrosoftEmailParser.parseMicrosoftEmail(email);

      expect(result.metadata.urgencyScore).toBeGreaterThan(7);
    });
  });

  describe("Outlook HTML cleaning", () => {
    test("should remove Outlook-specific XML elements", () => {
      const email: MicrosoftEmailData = {
        messageId: "outlook-xml",
        from: "sender@company.com",
        to: ["recipient@company.com"],
        subject: "Test",
        htmlBody: `
          <html xmlns:o="urn:schemas-microsoft-com:office:office">
          <body>
            <p>Regular content</p>
            <o:p>This should be removed</o:p>
            <p>More content</p>
          </body>
          </html>
        `,
        date: new Date(),
      };

      const result = MicrosoftEmailParser.parseMicrosoftEmail(email);

      expect(result.content).toContain("Regular content");
      expect(result.content).toContain("More content");
      expect(result.content).not.toContain("should be removed");
    });

    test("should remove Microsoft tracking pixels", () => {
      const email: MicrosoftEmailData = {
        messageId: "tracking-pixel",
        from: "sender@company.com",
        to: ["recipient@company.com"],
        subject: "Test",
        htmlBody: `
          <p>Content here</p>
          <img src="https://example.safelink.protection.com/track.gif" />
          <p>More content</p>
        `,
        date: new Date(),
      };

      const result = MicrosoftEmailParser.parseMicrosoftEmail(email);

      expect(result.content).not.toContain("safelink");
      expect(result.content).not.toContain("track.gif");
    });
  });

  describe("Actionable content detection", () => {
    test("should detect action keywords in subject", () => {
      const keywords = [
        "urgent",
        "action required",
        "please review",
        "approval needed",
        "deadline",
        "asap",
      ];

      keywords.forEach((keyword) => {
        const email: MicrosoftEmailData = {
          messageId: `action-${keyword}`,
          from: "sender@company.com",
          to: ["recipient@company.com"],
          subject: `Important: ${keyword} for project`,
          body: "Details here",
          date: new Date(),
        };

        const result = MicrosoftEmailParser.parseMicrosoftEmail(email);
        expect(result.metadata.hasActionableContent).toBe(true);
      });
    });

    test("should not flag non-actionable emails", () => {
      const email: MicrosoftEmailData = {
        messageId: "non-actionable",
        from: "newsletter@company.com",
        to: ["employee@company.com"],
        subject: "Weekly Newsletter",
        body: "Here's what happened this week...",
        date: new Date(),
        importance: "low",
      };

      const result = MicrosoftEmailParser.parseMicrosoftEmail(email);

      expect(result.metadata.hasActionableContent).toBe(false);
      expect(result.metadata.urgencyScore).toBeLessThan(5);
    });
  });

  describe("Email address formatting", () => {
    test("should format display names correctly", () => {
      const email: MicrosoftEmailData = {
        messageId: "format-test",
        from: "John Doe <john.doe@company.com>",
        to: ["Jane Smith <jane.smith@company.com>"],
        cc: ["Bob Johnson <bob.johnson@company.com>"],
        subject: "Test formatting",
        body: "Test",
        date: new Date(),
      };

      const result = MicrosoftEmailParser.parseMicrosoftEmail(email);

      expect(result.content).toContain("From: John Doe");
      expect(result.content).toContain("To: Jane Smith");
      expect(result.content).toContain("CC: Bob Johnson");
    });
  });

  describe("Categories and organization", () => {
    test("should include Outlook categories in content", () => {
      const email: MicrosoftEmailData = {
        messageId: "categories-test",
        from: "sender@company.com",
        to: ["recipient@company.com"],
        subject: "Project update",
        body: "Update on the project",
        date: new Date(),
        categories: ["Project X", "Important", "Q1"],
      };

      const result = MicrosoftEmailParser.parseMicrosoftEmail(email);

      expect(result.content).toContain("Categories: Project X, Important, Q1");
      expect(result.metadata.categories).toEqual(["Project X", "Important", "Q1"]);
    });
  });
});
