/**
 * Email Context API Integration Tests
 * Tests the API endpoints for email ingestion and search
 *
 * NOTE: These tests require a running dev server on localhost:3000.
 * Run with: npm run test:integration:with-server
 * Or manually: npm run dev (terminal 1), then INTEGRATION_TESTS=1 npm run test:integration (terminal 2)
 */

import { describe, test, expect, beforeAll, afterAll } from "vitest";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
const testMessageIds: string[] = [];
const isIntegrationTest = !!process.env.INTEGRATION_TESTS;

describe.skipIf(!isIntegrationTest)("Email Context API Integration", () => {
  const sampleEmail = {
    messageId: "api-test-email-1",
    from: "api-test@example.com",
    to: ["recipient@example.com"],
    subject: "API Test Email",
    body: "This is a test email sent via the API",
    date: new Date().toISOString(),
  };

  afterAll(async () => {
    // Cleanup test emails
    for (const messageId of testMessageIds) {
      try {
        await fetch(`${API_BASE_URL}/api/email-context?messageId=${messageId}`, {
          method: "DELETE",
        });
      } catch (error) {
        console.warn(`Failed to cleanup test email ${messageId}`);
      }
    }
  });

  describe("POST /api/email-context", () => {
    test("should ingest a single email", async () => {
      const response = await fetch(`${API_BASE_URL}/api/email-context`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(sampleEmail),
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.messageId).toBe("api-test-email-1");
      expect(data.vectorId).toBeDefined();

      testMessageIds.push(sampleEmail.messageId);
    }, 30000);

    test("should reject email without required fields", async () => {
      const invalidEmail = {
        messageId: "invalid",
        // Missing required fields
      };

      const response = await fetch(`${API_BASE_URL}/api/email-context`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(invalidEmail),
      });

      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBeDefined();
    });

    test("should reject email without body or htmlBody", async () => {
      const invalidEmail = {
        messageId: "no-body",
        from: "test@example.com",
        to: ["recipient@example.com"],
        subject: "No body",
        // Missing body and htmlBody
      };

      const response = await fetch(`${API_BASE_URL}/api/email-context`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(invalidEmail),
      });

      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain("body or htmlBody");
    });
  });

  describe("POST /api/email-context/batch", () => {
    test("should ingest multiple emails", async () => {
      const batchEmails = {
        emails: [
          {
            messageId: "api-batch-email-1",
            from: "batch1@example.com",
            to: ["recipient@example.com"],
            subject: "Batch Email 1",
            body: "First batch email",
            date: new Date().toISOString(),
          },
          {
            messageId: "api-batch-email-2",
            from: "batch2@example.com",
            to: ["recipient@example.com"],
            subject: "Batch Email 2",
            body: "Second batch email",
            date: new Date().toISOString(),
          },
        ],
      };

      const response = await fetch(`${API_BASE_URL}/api/email-context/batch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(batchEmails),
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.total).toBe(2);
      expect(data.successful).toBe(2);
      expect(data.failed).toBe(0);

      testMessageIds.push("api-batch-email-1", "api-batch-email-2");
    }, 60000);

    test("should reject non-array input", async () => {
      const response = await fetch(`${API_BASE_URL}/api/email-context/batch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ emails: "not-an-array" }),
      });

      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain("array");
    });

    test("should handle validation errors in batch", async () => {
      const batchWithErrors = {
        emails: [
          {
            messageId: "valid-email",
            from: "valid@example.com",
            to: ["recipient@example.com"],
            subject: "Valid",
            body: "Valid email",
          },
          {
            messageId: "invalid-email",
            // Missing required fields
          },
        ],
      };

      const response = await fetch(`${API_BASE_URL}/api/email-context/batch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(batchWithErrors),
      });

      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.validationErrors).toBeDefined();
      expect(Array.isArray(data.validationErrors)).toBe(true);
    });
  });

  describe("POST /api/email-context/search", () => {
    beforeAll(async () => {
      // Ingest a test email for searching
      const searchTestEmail = {
        messageId: "api-search-test-email",
        from: "search@example.com",
        to: ["recipient@example.com"],
        subject: "Machine Learning Discussion",
        body: "Let's discuss the latest advancements in neural networks and deep learning.",
        date: new Date().toISOString(),
      };

      await fetch(`${API_BASE_URL}/api/email-context`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(searchTestEmail),
      });

      testMessageIds.push(searchTestEmail.messageId);

      // Wait for indexing
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }, 35000);

    test("should search emails by content", async () => {
      const response = await fetch(`${API_BASE_URL}/api/email-context/search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: "machine learning neural networks",
        }),
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(Array.isArray(data.results)).toBe(true);

      // Should find our test email
      const found = data.results.find((r: any) => r.messageId === "api-search-test-email");
      expect(found).toBeDefined();
    }, 30000);

    test("should reject search without query", async () => {
      const response = await fetch(`${API_BASE_URL}/api/email-context/search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });

      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain("Query");
    });

    test("should support search filters", async () => {
      const response = await fetch(`${API_BASE_URL}/api/email-context/search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: "machine learning",
          matchThreshold: 0.7,
          matchCount: 5,
        }),
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.results.length).toBeLessThanOrEqual(5);
    }, 30000);
  });

  describe("GET /api/email-context", () => {
    test("should get email statistics", async () => {
      const response = await fetch(`${API_BASE_URL}/api/email-context`, {
        method: "GET",
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.stats).toBeDefined();
      expect(typeof data.stats.totalEmails).toBe("number");
    }, 30000);
  });

  describe("DELETE /api/email-context", () => {
    test("should delete email by messageId", async () => {
      // First, create an email to delete
      const deleteTestEmail = {
        messageId: "api-delete-test-email",
        from: "delete@example.com",
        to: ["recipient@example.com"],
        subject: "Delete Test",
        body: "This will be deleted",
        date: new Date().toISOString(),
      };

      const createResponse = await fetch(`${API_BASE_URL}/api/email-context`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(deleteTestEmail),
      });

      expect(createResponse.status).toBe(200);

      // Now delete it
      const deleteResponse = await fetch(
        `${API_BASE_URL}/api/email-context?messageId=api-delete-test-email`,
        {
          method: "DELETE",
        }
      );

      expect(deleteResponse.status).toBe(200);

      const data = await deleteResponse.json();
      expect(data.success).toBe(true);
      expect(data.messageId).toBe("api-delete-test-email");
    }, 40000);

    test("should return 404 for non-existent email", async () => {
      const response = await fetch(
        `${API_BASE_URL}/api/email-context?messageId=non-existent-email`,
        {
          method: "DELETE",
        }
      );

      expect(response.status).toBe(404);

      const data = await response.json();
      expect(data.success).toBe(false);
    });

    test("should require messageId parameter", async () => {
      const response = await fetch(`${API_BASE_URL}/api/email-context`, {
        method: "DELETE",
      });

      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain("messageId");
    });
  });
});
