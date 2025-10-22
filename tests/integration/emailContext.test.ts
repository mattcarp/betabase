/**
 * Email Context Service Integration Tests
 * Tests the full email ingestion and vectorization pipeline
 */

import { describe, test, expect, beforeAll, afterAll } from "@jest/globals";
import { getEmailContextService } from "@/services/emailContextService";
import { EmailData } from "@/utils/emailParser";

describe("EmailContextService Integration", () => {
  const service = getEmailContextService();
  const testMessageIds: string[] = [];

  // Sample test emails
  const sampleEmails: EmailData[] = [
    {
      messageId: "test-email-1",
      from: "alice@example.com",
      to: ["bob@example.com"],
      subject: "Project Update - Q1 2024",
      body: "Hi Bob, here's the latest update on the project. We've completed 80% of the features and are on track for the March deadline.",
      date: new Date("2024-01-15T10:00:00Z"),
    },
    {
      messageId: "test-email-2",
      from: "bob@example.com",
      to: ["alice@example.com"],
      subject: "Re: Project Update - Q1 2024",
      body: "Thanks for the update Alice! Can we schedule a meeting to discuss the remaining features?",
      date: new Date("2024-01-16T14:30:00Z"),
      inReplyTo: "test-email-1",
      threadId: "thread-project-update",
    },
    {
      messageId: "test-email-3",
      from: "charlie@example.com",
      to: ["alice@example.com", "bob@example.com"],
      cc: ["dave@example.com"],
      subject: "Budget Approval Needed",
      htmlBody:
        "<html><body><p>Hi team,</p><p>We need approval for the <strong>additional $50k</strong> budget for Q2.</p><p>Please review the attached proposal.</p></body></html>",
      date: new Date("2024-01-17T09:00:00Z"),
      attachments: [
        {
          filename: "budget-proposal-q2.pdf",
          contentType: "application/pdf",
          size: 245678,
        },
      ],
    },
  ];

  beforeAll(() => {
    // Track test message IDs for cleanup
    testMessageIds.push(...sampleEmails.map((e) => e.messageId));
  });

  afterAll(async () => {
    // Clean up test emails from vector store
    for (const messageId of testMessageIds) {
      try {
        await service.deleteEmail(messageId);
      } catch (error) {
        console.warn(`Failed to cleanup test email ${messageId}:`, error);
      }
    }
  });

  describe("Single email ingestion", () => {
    test("should ingest a simple email successfully", async () => {
      const result = await service.ingestEmail(sampleEmails[0]);

      expect(result.success).toBe(true);
      expect(result.messageId).toBe("test-email-1");
      expect(result.vectorId).toBeDefined();
      expect(typeof result.vectorId).toBe("string");
    }, 30000); // 30 second timeout for API calls

    test("should ingest an email with HTML body", async () => {
      const result = await service.ingestEmail(sampleEmails[2]);

      expect(result.success).toBe(true);
      expect(result.messageId).toBe("test-email-3");
      expect(result.vectorId).toBeDefined();
    }, 30000);

    test("should handle invalid email data gracefully", async () => {
      const invalidEmail = {
        messageId: "invalid-email",
        from: "test@example.com",
        // Missing required fields
      } as any;

      const result = await service.ingestEmail(invalidEmail);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe("Batch email ingestion", () => {
    test("should ingest multiple emails in batch", async () => {
      const batchResult = await service.ingestEmailBatch(sampleEmails);

      expect(batchResult.total).toBe(3);
      expect(batchResult.successful).toBe(3);
      expect(batchResult.failed).toBe(0);
      expect(batchResult.results.length).toBe(3);

      // Verify all have vector IDs
      batchResult.results.forEach((result) => {
        expect(result.success).toBe(true);
        expect(result.vectorId).toBeDefined();
      });
    }, 60000); // 60 second timeout for batch operations

    test("should handle partial batch failures gracefully", async () => {
      const mixedBatch: EmailData[] = [
        sampleEmails[0],
        { messageId: "bad-email", from: "x", to: [] } as any, // Invalid
        sampleEmails[1],
      ];

      const batchResult = await service.ingestEmailBatch(mixedBatch);

      expect(batchResult.total).toBe(3);
      expect(batchResult.successful).toBeGreaterThan(0);
      expect(batchResult.failed).toBeGreaterThan(0);

      // Check that some succeeded and some failed
      const successCount = batchResult.results.filter((r) => r.success).length;
      const failCount = batchResult.results.filter((r) => !r.success).length;

      expect(successCount).toBeGreaterThan(0);
      expect(failCount).toBeGreaterThan(0);
    }, 60000);
  });

  describe("Email search", () => {
    beforeAll(async () => {
      // Ensure test emails are ingested for search tests
      await service.ingestEmailBatch(sampleEmails);
      // Wait a bit for vector indexing
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }, 70000);

    test("should find emails by content similarity", async () => {
      const searchResults = await service.searchEmails("project deadline March");

      expect(searchResults.length).toBeGreaterThan(0);

      // Should find the project update email
      const projectEmail = searchResults.find((r) => r.source_id === "test-email-1");
      expect(projectEmail).toBeDefined();
      expect(projectEmail?.similarity).toBeGreaterThan(0.7); // High similarity
    }, 30000);

    test("should find emails by subject", async () => {
      const searchResults = await service.searchEmails("budget approval");

      expect(searchResults.length).toBeGreaterThan(0);

      const budgetEmail = searchResults.find((r) => r.source_id === "test-email-3");
      expect(budgetEmail).toBeDefined();
    }, 30000);

    test("should filter search by date range", async () => {
      const searchResults = await service.searchEmails("project", {
        dateFrom: "2024-01-16T00:00:00Z",
        dateTo: "2024-01-17T00:00:00Z",
      });

      // Should find the reply email but not the original
      const foundIds = searchResults.map((r) => r.source_id);
      expect(foundIds).toContain("test-email-2");
    }, 30000);

    test("should filter search by participants", async () => {
      const searchResults = await service.searchEmails("budget", {
        participants: ["charlie@example.com"],
      });

      expect(searchResults.length).toBeGreaterThan(0);

      // Should find emails from Charlie
      const charlieEmail = searchResults.find((r) => r.source_id === "test-email-3");
      expect(charlieEmail).toBeDefined();
    }, 30000);

    test("should respect match threshold", async () => {
      const lowThresholdResults = await service.searchEmails("random words", {
        matchThreshold: 0.5,
      });

      const highThresholdResults = await service.searchEmails("random words", {
        matchThreshold: 0.9,
      });

      // Lower threshold should return more results
      expect(lowThresholdResults.length).toBeGreaterThanOrEqual(highThresholdResults.length);
    }, 30000);

    test("should limit search results", async () => {
      const limitedResults = await service.searchEmails("email", {
        matchCount: 2,
      });

      expect(limitedResults.length).toBeLessThanOrEqual(2);
    }, 30000);
  });

  describe("Email deletion", () => {
    test("should delete email by messageId", async () => {
      const testEmail: EmailData = {
        messageId: "test-delete-email",
        from: "delete@example.com",
        to: ["test@example.com"],
        subject: "Test Delete",
        body: "This email will be deleted",
        date: new Date(),
      };

      // Ingest the email
      const ingestResult = await service.ingestEmail(testEmail);
      expect(ingestResult.success).toBe(true);

      // Delete the email
      const deleteResult = await service.deleteEmail("test-delete-email");
      expect(deleteResult).toBe(true);

      // Verify it can't be deleted again (already gone)
      const deleteAgain = await service.deleteEmail("test-delete-email");
      expect(deleteAgain).toBe(false);
    }, 40000);
  });

  describe("Email re-indexing", () => {
    test("should re-index an existing email", async () => {
      const originalEmail: EmailData = {
        messageId: "test-reindex-email",
        from: "reindex@example.com",
        to: ["test@example.com"],
        subject: "Original Subject",
        body: "Original content",
        date: new Date(),
      };

      // Initial ingest
      const firstResult = await service.ingestEmail(originalEmail);
      expect(firstResult.success).toBe(true);

      // Re-index with updated content
      const updatedEmail: EmailData = {
        ...originalEmail,
        body: "Updated content with new information",
      };

      const reindexResult = await service.reindexEmail(updatedEmail);
      expect(reindexResult.success).toBe(true);

      // Search should find the updated content
      const searchResults = await service.searchEmails("new information");
      const found = searchResults.find((r) => r.source_id === "test-reindex-email");
      expect(found).toBeDefined();

      // Cleanup
      await service.deleteEmail("test-reindex-email");
    }, 60000);
  });

  describe("Statistics", () => {
    test("should get email statistics", async () => {
      const stats = await service.getEmailStats();

      expect(stats).toBeDefined();
      expect(typeof stats.totalEmails).toBe("number");
      expect(stats.totalEmails).toBeGreaterThanOrEqual(0);
    }, 30000);
  });

  describe("Error handling", () => {
    test("should handle network errors gracefully", async () => {
      // Test with a malformed email that might cause issues
      const problematicEmail: EmailData = {
        messageId: "problematic-email",
        from: "",
        to: [],
        subject: "",
        body: "",
        date: new Date(),
      };

      const result = await service.ingestEmail(problematicEmail);

      // Should fail gracefully without throwing
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
