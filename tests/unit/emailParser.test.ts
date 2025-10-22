/**
 * Email Parser Unit Tests
 * Tests for email context extraction and parsing
 */

import { describe, test, expect } from "@jest/globals";
import { EmailParser, EmailData } from "@/utils/emailParser";

describe("EmailParser", () => {
  const sampleEmail: EmailData = {
    messageId: "test-message-123",
    from: "sender@example.com",
    to: ["recipient@example.com"],
    subject: "Test Email Subject",
    body: "This is a test email body with some content.",
    date: new Date("2024-01-15T10:00:00Z"),
  };

  describe("parseEmail", () => {
    test("should parse basic email successfully", () => {
      const result = EmailParser.parseEmail(sampleEmail);

      expect(result.messageId).toBe("test-message-123");
      expect(result.content).toContain("Test Email Subject");
      expect(result.content).toContain("sender@example.com");
      expect(result.content).toContain("recipient@example.com");
      expect(result.content).toContain("This is a test email body");
      expect(result.metadata.from).toBe("sender@example.com");
      expect(result.metadata.subject).toBe("Test Email Subject");
    });

    test("should handle emails with CC and BCC", () => {
      const emailWithCc: EmailData = {
        ...sampleEmail,
        cc: ["cc1@example.com", "cc2@example.com"],
        bcc: ["bcc@example.com"],
      };

      const result = EmailParser.parseEmail(emailWithCc);

      expect(result.content).toContain("cc1@example.com");
      expect(result.content).toContain("cc2@example.com");
      expect(result.metadata.cc).toEqual(["cc1@example.com", "cc2@example.com"]);
    });

    test("should extract thread participants correctly", () => {
      const emailWithMultipleParticipants: EmailData = {
        ...sampleEmail,
        to: ["recipient1@example.com", "recipient2@example.com"],
        cc: ["cc@example.com"],
      };

      const result = EmailParser.parseEmail(emailWithMultipleParticipants);

      expect(result.metadata.threadParticipants).toContain("sender@example.com");
      expect(result.metadata.threadParticipants).toContain("recipient1@example.com");
      expect(result.metadata.threadParticipants).toContain("recipient2@example.com");
      expect(result.metadata.threadParticipants).toContain("cc@example.com");
      expect(result.metadata.threadParticipants.length).toBe(4);
    });

    test("should handle attachments metadata", () => {
      const emailWithAttachments: EmailData = {
        ...sampleEmail,
        attachments: [
          { filename: "document.pdf", contentType: "application/pdf", size: 1024 },
          { filename: "image.png", contentType: "image/png", size: 2048 },
        ],
      };

      const result = EmailParser.parseEmail(emailWithAttachments);

      expect(result.metadata.hasAttachments).toBe(true);
      expect(result.metadata.attachmentCount).toBe(2);
      expect(result.content).toContain("document.pdf");
      expect(result.content).toContain("image.png");
    });

    test("should detect reply emails", () => {
      const replyEmail: EmailData = {
        ...sampleEmail,
        inReplyTo: "original-message-id",
        references: ["ref-1", "ref-2"],
      };

      const result = EmailParser.parseEmail(replyEmail);

      expect(result.metadata.isReply).toBe(true);
    });

    test("should handle thread IDs", () => {
      const threadEmail: EmailData = {
        ...sampleEmail,
        threadId: "thread-abc-123",
      };

      const result = EmailParser.parseEmail(threadEmail);

      expect(result.threadId).toBe("thread-abc-123");
    });
  });

  describe("HTML parsing", () => {
    test("should strip HTML tags from htmlBody", () => {
      const htmlEmail: EmailData = {
        ...sampleEmail,
        body: "",
        htmlBody: "<html><body><p>This is <strong>HTML</strong> content.</p></body></html>",
      };

      const result = EmailParser.parseEmail(htmlEmail);

      expect(result.content).toContain("This is HTML content");
      expect(result.content).not.toContain("<html>");
      expect(result.content).not.toContain("<strong>");
    });

    test("should handle HTML entities", () => {
      const htmlEmail: EmailData = {
        ...sampleEmail,
        body: "",
        htmlBody: "<p>Price: $100 &amp; up. It&rsquo;s &quot;great&quot;!</p>",
      };

      const result = EmailParser.parseEmail(htmlEmail);

      expect(result.content).toContain("$100 & up");
      expect(result.content).toContain('"great"');
    });

    test("should remove script and style tags", () => {
      const htmlEmail: EmailData = {
        ...sampleEmail,
        body: "",
        htmlBody:
          "<html><head><style>body { color: red; }</style></head><body><script>alert('test');</script><p>Content</p></body></html>",
      };

      const result = EmailParser.parseEmail(htmlEmail);

      expect(result.content).toContain("Content");
      expect(result.content).not.toContain("alert");
      expect(result.content).not.toContain("color: red");
    });

    test("should convert line breaks appropriately", () => {
      const htmlEmail: EmailData = {
        ...sampleEmail,
        body: "",
        htmlBody:
          "<p>First paragraph.</p><p>Second paragraph.</p><ul><li>Item 1</li><li>Item 2</li></ul>",
      };

      const result = EmailParser.parseEmail(htmlEmail);

      expect(result.content).toContain("First paragraph");
      expect(result.content).toContain("Second paragraph");
      expect(result.content).toContain("Item 1");
      expect(result.content).toContain("Item 2");
    });
  });

  describe("Text cleaning", () => {
    test("should remove email signatures", () => {
      const emailWithSignature: EmailData = {
        ...sampleEmail,
        body: "Main content here.\n\n--\nJohn Doe\nSoftware Engineer\njohn@example.com",
      };

      const result = EmailParser.parseEmail(emailWithSignature);

      expect(result.content).toContain("Main content here");
      expect(result.content).not.toContain("Software Engineer");
    });

    test("should remove quoted replies", () => {
      const emailWithQuotes: EmailData = {
        ...sampleEmail,
        body: "My response here.\n\n> Original message\n> More original content\n> End of quote",
      };

      const result = EmailParser.parseEmail(emailWithQuotes);

      expect(result.content).toContain("My response here");
      expect(result.content).not.toContain("> Original message");
    });

    test("should normalize whitespace", () => {
      const emailWithExtraSpaces: EmailData = {
        ...sampleEmail,
        body: "Content   with    extra     spaces\n\n\n\nand   many   newlines.",
      };

      const result = EmailParser.parseEmail(emailWithExtraSpaces);

      // Should have normalized spaces (single space instead of multiple)
      expect(result.content).toContain("Content with extra spaces");
      // Should have normalized newlines (double newline max for paragraphs)
      expect(result.content).not.toContain("\n\n\n");
    });

    test("should handle different line ending formats", () => {
      const emailWithMixedLineEndings: EmailData = {
        ...sampleEmail,
        body: "Line 1\r\nLine 2\rLine 3\nLine 4",
      };

      const result = EmailParser.parseEmail(emailWithMixedLineEndings);

      expect(result.content).toContain("Line 1");
      expect(result.content).toContain("Line 2");
      expect(result.content).toContain("Line 3");
      expect(result.content).toContain("Line 4");
    });
  });

  describe("Date handling", () => {
    test("should normalize Date objects to ISO strings", () => {
      const date = new Date("2024-01-15T10:00:00Z");
      const email: EmailData = {
        ...sampleEmail,
        date,
      };

      const result = EmailParser.parseEmail(email);

      expect(result.metadata.date).toBe("2024-01-15T10:00:00.000Z");
    });

    test("should normalize date strings to ISO strings", () => {
      const email: EmailData = {
        ...sampleEmail,
        date: "2024-01-15T10:00:00Z",
      };

      const result = EmailParser.parseEmail(email);

      expect(result.metadata.date).toMatch(/2024-01-15/);
    });
  });

  describe("Batch operations", () => {
    test("should parse multiple emails", () => {
      const emails: EmailData[] = [
        { ...sampleEmail, messageId: "msg-1" },
        { ...sampleEmail, messageId: "msg-2" },
        { ...sampleEmail, messageId: "msg-3" },
      ];

      const results = EmailParser.parseEmails(emails);

      expect(results.length).toBe(3);
      expect(results[0].messageId).toBe("msg-1");
      expect(results[1].messageId).toBe("msg-2");
      expect(results[2].messageId).toBe("msg-3");
    });
  });

  describe("Validation", () => {
    test("should validate correct email data", () => {
      const valid = EmailParser.validateEmailData(sampleEmail);
      expect(valid).toBe(true);
    });

    test("should reject email without messageId", () => {
      const invalid = { ...sampleEmail, messageId: undefined };
      const valid = EmailParser.validateEmailData(invalid);
      expect(valid).toBe(false);
    });

    test("should reject email without from", () => {
      const invalid = { ...sampleEmail, from: undefined };
      const valid = EmailParser.validateEmailData(invalid);
      expect(valid).toBe(false);
    });

    test("should reject email without to array", () => {
      const invalid = { ...sampleEmail, to: "not-an-array" };
      const valid = EmailParser.validateEmailData(invalid);
      expect(valid).toBe(false);
    });

    test("should reject email without body or htmlBody", () => {
      const invalid = { ...sampleEmail, body: undefined, htmlBody: undefined };
      const valid = EmailParser.validateEmailData(invalid);
      expect(valid).toBe(false);
    });

    test("should accept email with htmlBody but no body", () => {
      const validEmail = { ...sampleEmail, body: undefined, htmlBody: "<p>HTML content</p>" };
      const valid = EmailParser.validateEmailData(validEmail);
      expect(valid).toBe(true);
    });
  });

  describe("Edge cases", () => {
    test("should handle empty email body", () => {
      const emptyBodyEmail: EmailData = {
        ...sampleEmail,
        body: "",
        htmlBody: "",
      };

      const result = EmailParser.parseEmail(emptyBodyEmail);

      expect(result.content).toContain("Subject:");
      expect(result.content).toContain("From:");
      expect(result.metadata.contentLength).toBeGreaterThan(0);
    });

    test("should handle very long emails", () => {
      const longContent = "A".repeat(100000);
      const longEmail: EmailData = {
        ...sampleEmail,
        body: longContent,
      };

      const result = EmailParser.parseEmail(longEmail);

      expect(result.content).toContain(longContent);
      expect(result.metadata.contentLength).toBeGreaterThan(100000);
    });

    test("should handle special characters in subject", () => {
      const specialCharsEmail: EmailData = {
        ...sampleEmail,
        subject: "Re: [URGENT] Project #123 - Status Update! 🚀",
      };

      const result = EmailParser.parseEmail(specialCharsEmail);

      expect(result.content).toContain("[URGENT]");
      expect(result.content).toContain("#123");
      expect(result.metadata.subject).toBe("Re: [URGENT] Project #123 - Status Update! 🚀");
    });

    test("should handle malformed HTML gracefully", () => {
      const malformedHtmlEmail: EmailData = {
        ...sampleEmail,
        body: "",
        htmlBody: "<html><body><p>Unclosed paragraph<div>Nested improperly</p></div>Content",
      };

      const result = EmailParser.parseEmail(malformedHtmlEmail);

      expect(result.content).toContain("Unclosed paragraph");
      expect(result.content).toContain("Nested improperly");
      expect(result.content).toContain("Content");
    });
  });
});
