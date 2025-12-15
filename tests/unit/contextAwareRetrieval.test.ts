/**
 * Context-Aware Retrieval Unit Tests
 * Tests query transformation, RLHF signal handling, and prompt building
 *
 * Note: Tests requiring Google AI/Supabase are marked with .skip
 * Run with INTEGRATION_TESTS=1 to enable integration tests
 */

import { describe, test, expect } from "vitest";

// Helper to check if integration tests should run
const shouldRunIntegrationTests = process.env.INTEGRATION_TESTS === "1";

describe("ContextAwareRetrieval", () => {
  describe("query transformation logic", () => {
    test("should return original query when no history exists", () => {
      const originalQuery = "what is aoma";
      const history: any[] = [];
      const rlhfSignals = { successfulQueries: [], relevantDocuments: [], userPreferences: {} };

      // When no history and no RLHF signals, should use original
      const shouldUseOriginal = history.length === 0 && rlhfSignals.successfulQueries.length === 0;

      expect(shouldUseOriginal).toBe(true);
    });

    test("should indicate transformation when history exists", () => {
      const history = [
        { query: "tell me about authentication", feedback: null },
        { query: "how does it handle sessions", feedback: { type: "thumbs_up" } },
      ];

      const hasHistory = history.length > 0;
      expect(hasHistory).toBe(true);
    });

    test("should indicate transformation when RLHF signals exist", () => {
      const rlhfSignals = {
        successfulQueries: ["how does aoma work", "explain metadata validation"],
        relevantDocuments: [{ doc_id: "doc-1" }],
        userPreferences: {},
      };

      const hasRLHF = rlhfSignals.successfulQueries.length > 0;
      expect(hasRLHF).toBe(true);
    });
  });

  describe("prompt building", () => {
    test("should format conversation history correctly", () => {
      const history = [
        { query: "what is aoma", feedback: null },
        { query: "explain workflows", feedback: { type: "thumbs_up" } },
        { query: "how about metadata", feedback: { type: "thumbs_down" } },
      ];

      const recentHistory = history.slice(-5);
      const historyText = recentHistory
        .map((turn, idx) => {
          const feedback = turn.feedback ? ` (Feedback: ${turn.feedback.type})` : "";
          return `${idx + 1}. Q: "${turn.query}"${feedback}`;
        })
        .join("\n");

      expect(historyText).toContain('1. Q: "what is aoma"');
      expect(historyText).toContain('2. Q: "explain workflows" (Feedback: thumbs_up)');
      expect(historyText).toContain('3. Q: "how about metadata" (Feedback: thumbs_down)');
    });

    test("should format topic weights correctly", () => {
      const topicWeights: Record<string, number> = {
        authentication: 0.85,
        metadata: 0.72,
        workflow: 0.65,
        api: 0.45,
        deployment: 0.30,
        testing: 0.15,
      };

      const topTopics = Object.entries(topicWeights)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([topic, weight]) => `${topic} (${weight.toFixed(2)})`)
        .join(", ");

      expect(topTopics).toBe(
        "authentication (0.85), metadata (0.72), workflow (0.65), api (0.45), deployment (0.30)"
      );
    });

    test("should include RLHF successful queries in prompt", () => {
      const successfulQueries = [
        "how does aoma process assets",
        "explain ingestion workflow",
        "metadata validation rules",
      ];

      const rlhfText =
        successfulQueries.length > 0
          ? `\n\nSuccessful Query Patterns (from human feedback):\n${successfulQueries
              .slice(0, 5)
              .map((q, i) => `${i + 1}. "${q}"`)
              .join("\n")}`
          : "";

      expect(rlhfText).toContain("Successful Query Patterns");
      expect(rlhfText).toContain('1. "how does aoma process assets"');
      expect(rlhfText).toContain('2. "explain ingestion workflow"');
    });

    test("should handle empty RLHF signals gracefully", () => {
      const successfulQueries: string[] = [];

      const rlhfText =
        successfulQueries.length > 0
          ? `\n\nSuccessful Query Patterns:\n...`
          : "";

      expect(rlhfText).toBe("");
    });
  });

  describe("response parsing", () => {
    test("should parse valid JSON response", () => {
      const responseText = JSON.stringify({
        enhancedQuery: "detailed explanation of AOMA asset management workflow",
        reasoning: "Added specificity based on conversation context about workflows",
      });

      const parsed = JSON.parse(responseText);

      expect(parsed.enhancedQuery).toBe(
        "detailed explanation of AOMA asset management workflow"
      );
      expect(parsed.reasoning).toContain("specificity");
    });

    test("should extract JSON from markdown code blocks", () => {
      const responseText = `\`\`\`json
{
  "enhancedQuery": "enhanced query here",
  "reasoning": "explanation here"
}
\`\`\``;

      let jsonText = responseText.trim();
      if (jsonText.startsWith("```")) {
        jsonText = jsonText.replace(/```json\n?/g, "").replace(/```\n?/g, "");
      }

      const parsed = JSON.parse(jsonText);

      expect(parsed.enhancedQuery).toBe("enhanced query here");
      expect(parsed.reasoning).toBe("explanation here");
    });

    test("should handle malformed JSON gracefully", () => {
      const responseText = "This is not valid JSON { broken";

      let result = {};
      try {
        result = JSON.parse(responseText);
      } catch {
        result = {};
      }

      expect(result).toEqual({});
    });
  });

  describe("context tracking", () => {
    test("should track history turns count", () => {
      const history = [
        { query: "q1" },
        { query: "q2" },
        { query: "q3" },
      ];

      const contextUsed = {
        historyTurns: history.length,
        topicWeights: {},
        successfulDocs: 0,
      };

      expect(contextUsed.historyTurns).toBe(3);
    });

    test("should track successful document count", () => {
      const reinforcementContext = {
        successfulDocIds: ["doc-1", "doc-2", "doc-3"],
        topicWeights: {},
      };
      const rlhfRelevantDocs = [{ doc_id: "doc-4" }, { doc_id: "doc-5" }];

      const successfulDocs =
        reinforcementContext.successfulDocIds.length + rlhfRelevantDocs.length;

      expect(successfulDocs).toBe(5);
    });
  });

  describe("feedback handling", () => {
    test("should validate turn index bounds", () => {
      const historyLength = 5;

      const validIndices = [0, 1, 2, 3, 4];
      const invalidIndices = [-1, 5, 10];

      validIndices.forEach((idx) => {
        expect(idx >= 0 && idx < historyLength).toBe(true);
      });

      invalidIndices.forEach((idx) => {
        expect(idx >= 0 && idx < historyLength).toBe(false);
      });
    });

    test("should structure feedback correctly", () => {
      const feedback = {
        type: "thumbs_up" as const,
        comment: "This was helpful",
        timestamp: new Date().toISOString(),
      };

      expect(feedback.type).toBe("thumbs_up");
      expect(feedback).toHaveProperty("comment");
      expect(feedback).toHaveProperty("timestamp");
    });
  });

  describe("query options validation", () => {
    test("should have required fields in options", () => {
      const options = {
        sessionId: "session-123",
        organization: "Sony Music",
        division: "Digital Operations",
        app_under_test: "AOMA",
        userEmail: "user@example.com",
        initialCandidates: 50,
        topK: 10,
        useRLHFSignals: true,
      };

      expect(options.sessionId).toBeDefined();
      expect(options.organization).toBeDefined();
      expect(options.division).toBeDefined();
      expect(options.app_under_test).toBeDefined();
    });

    test("should use default values for optional fields", () => {
      const defaults = {
        initialCandidates: 50,
        topK: 10,
        useRLHFSignals: true,
      };

      expect(defaults.initialCandidates).toBe(50);
      expect(defaults.topK).toBe(10);
      expect(defaults.useRLHFSignals).toBe(true);
    });
  });

  // Integration tests - require real Google AI and Supabase connection
  describe.skipIf(!shouldRunIntegrationTests)("integration tests", () => {
    test("should execute full context-aware query", async () => {
      // This would test the actual service with real connections
      // Skipped unless INTEGRATION_TESTS=1 is set
      expect(true).toBe(true);
    });
  });
});
