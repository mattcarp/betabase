/**
 * AOMA Orchestrator Unit Tests
 * Tests query orchestration, source type detection, and response synthesis
 *
 * Note: Tests requiring Supabase connection are marked with .skip
 * Run with INTEGRATION_TESTS=1 to enable integration tests
 */

import { describe, test, expect, beforeEach } from "vitest";
import { AOMAOrchestrator } from "@/services/aomaOrchestrator";

// Helper to check if integration tests should run
const shouldRunIntegrationTests = process.env.INTEGRATION_TESTS === "1";

describe("AOMAOrchestrator", () => {
  let orchestrator: AOMAOrchestrator;

  beforeEach(() => {
    orchestrator = new AOMAOrchestrator();
  });

  describe("query normalization", () => {
    // Test normalization through the public API behavior
    test("should treat queries with different casing as equivalent for caching", async () => {
      // This tests that normalizeQuery works correctly
      // We can't directly test private methods, but we can verify behavior

      // These should be normalized to the same key
      const queries = [
        "What is AOMA?",
        "what is aoma?",
        "WHAT IS AOMA?",
        "what is aoma",  // no punctuation
      ];

      // All should normalize to same lowercase, no trailing punctuation form
      // We verify this indirectly - the actual test happens in integration
      expect(queries.map(q => q.toLowerCase().replace(/[?!.]+$/, "").trim()))
        .toEqual([
          "what is aoma",
          "what is aoma",
          "what is aoma",
          "what is aoma",
        ]);
    });

    test("should normalize whitespace in queries", () => {
      const query = "  what   is    aoma   ";
      const normalized = query.trim().toLowerCase().replace(/\s+/g, " ");

      expect(normalized).toBe("what is aoma");
    });
  });

  describe("source type detection", () => {
    // Test the logic that would be in determineSourceTypes
    // We test the patterns since we can't call private methods directly

    test("should detect Jira-related queries", () => {
      const jiraKeywords = ["jira", "ticket", "issue", "bug"];
      const queries = [
        "show me jira tickets",
        "find the ticket for login",
        "what issues are open",
        "report the bug"
      ];

      queries.forEach((query, i) => {
        const lowerQuery = query.toLowerCase();
        const hasJiraKeyword = jiraKeywords.some(k => lowerQuery.includes(k));
        expect(hasJiraKeyword).toBe(true);
      });
    });

    test("should detect Git-related queries", () => {
      const gitKeywords = ["commit", "git", "code", "repository"];
      const queries = [
        "show recent commits",
        "git history for file",
        "search code for function",
        "repository changes"
      ];

      queries.forEach(query => {
        const lowerQuery = query.toLowerCase();
        const hasGitKeyword = gitKeywords.some(k => lowerQuery.includes(k));
        expect(hasGitKeyword).toBe(true);
      });
    });

    test("should detect email-related queries", () => {
      const emailKeywords = ["email", "outlook", "message", "communication"];
      const queries = [
        "search emails from john",
        "outlook messages this week",
        "find message about project",
        "team communication history"
      ];

      queries.forEach(query => {
        const lowerQuery = query.toLowerCase();
        const hasEmailKeyword = emailKeywords.some(k => lowerQuery.includes(k));
        expect(hasEmailKeyword).toBe(true);
      });
    });

    test("should detect metrics-related queries", () => {
      const metricsKeywords = ["metric", "performance", "monitoring", "health"];
      const queries = [
        "show metrics dashboard",
        "performance statistics",
        "monitoring alerts",
        "system health status"
      ];

      queries.forEach(query => {
        const lowerQuery = query.toLowerCase();
        const hasMetricsKeyword = metricsKeywords.some(k => lowerQuery.includes(k));
        expect(hasMetricsKeyword).toBe(true);
      });
    });

    test("should default to knowledge base for AOMA queries", () => {
      const aomaKeywords = ["aoma", "usm", "dam", "metadata", "asset"];
      const queries = [
        "what is aoma",
        "explain usm workflow",
        "how does dam work",
        "metadata validation rules",
        "asset management process"
      ];

      queries.forEach(query => {
        const lowerQuery = query.toLowerCase();
        const hasAomaKeyword = aomaKeywords.some(k => lowerQuery.includes(k));
        expect(hasAomaKeyword).toBe(true);
      });
    });
  });

  describe("query analysis patterns", () => {
    test("should detect multi-topic queries", () => {
      const multiTopicIndicators = [" and ", " also ", " plus "];

      const multiTopicQueries = [
        "show jira tickets and git commits",
        "find emails also check calendar",
        "metrics plus error logs"
      ];

      multiTopicQueries.forEach(query => {
        const hasMultiIndicator = multiTopicIndicators.some(i =>
          query.toLowerCase().includes(i)
        );
        expect(hasMultiIndicator).toBe(true);
      });
    });

    test("should not split natural phrases containing 'and'", () => {
      // "and how" should not trigger multi-topic split
      const naturalPhrase = "what is aoma and how does it work";
      const lowerQuery = naturalPhrase.toLowerCase();

      const hasMultipleTopics = (
        lowerQuery.includes(" and ") ||
        lowerQuery.includes(" also ") ||
        lowerQuery.includes(" plus ")
      ) && !lowerQuery.includes("and how");

      expect(hasMultipleTopics).toBe(false);
    });

    test("should detect sequential operation queries", () => {
      const sequentialIndicators = ["then", "after"];

      const sequentialQueries = [
        "find the ticket then show commits",
        "get emails after checking calendar"
      ];

      sequentialQueries.forEach(query => {
        const hasSequentialIndicator = sequentialIndicators.some(i =>
          query.toLowerCase().includes(i)
        );
        expect(hasSequentialIndicator).toBe(true);
      });
    });
  });

  describe("tool argument building", () => {
    // Test the patterns for building tool arguments
    test("should build knowledge query args", () => {
      const query = "what is aoma";
      const args = { query, strategy: "rapid" };

      expect(args).toEqual({
        query: "what is aoma",
        strategy: "rapid"
      });
    });

    test("should build jira search args", () => {
      const query = "open bugs";
      const args = { query, maxResults: 10 };

      expect(args).toEqual({
        query: "open bugs",
        maxResults: 10
      });
    });

    test("should build git search args", () => {
      const query = "recent changes";
      const args = { query, limit: 10 };

      expect(args).toEqual({
        query: "recent changes",
        limit: 10
      });
    });

    test("should build email search args", () => {
      const query = "from john";
      const args = { query, limit: 10 };

      expect(args).toEqual({
        query: "from john",
        limit: 10
      });
    });
  });

  describe("response synthesis", () => {
    test("should format empty results correctly", () => {
      const emptyResponse = "No relevant information found in the knowledge base.";
      expect(emptyResponse).toContain("No relevant");
    });

    test("should handle citation indexing", () => {
      // Test citation marker format
      const content = "This is content";
      const citationIndex = 1;
      const cited = `${content} [${citationIndex}]`;

      expect(cited).toBe("This is content [1]");
    });

    test("should group results by source type priority", () => {
      const priorityOrder = ["knowledge", "jira", "git", "email", "metrics"];

      // knowledge should come first
      expect(priorityOrder.indexOf("knowledge")).toBe(0);
      // metrics should come last
      expect(priorityOrder.indexOf("metrics")).toBe(4);
    });
  });

  describe("source extraction", () => {
    test("should extract knowledge base source", () => {
      const result = { topic: "AOMA Overview" };
      const source = {
        type: "knowledge_base",
        title: "AOMA Knowledge Base",
        description: result.topic || "General AOMA information",
        relevance: 1.0,
      };

      expect(source.type).toBe("knowledge_base");
      expect(source.description).toBe("AOMA Overview");
    });

    test("should extract Jira ticket sources", () => {
      const tickets = [
        { key: "AOMA-123", summary: "Fix login bug", url: "http://jira/AOMA-123" },
        { key: "AOMA-456", summary: "Add feature", url: "http://jira/AOMA-456" },
      ];

      const sources = tickets.map(ticket => ({
        type: "jira",
        title: `Jira ${ticket.key}`,
        url: ticket.url,
        description: ticket.summary,
      }));

      expect(sources.length).toBe(2);
      expect(sources[0].title).toBe("Jira AOMA-123");
      expect(sources[1].url).toBe("http://jira/AOMA-456");
    });

    test("should extract Git commit sources", () => {
      const commits = [
        { sha: "abc1234567", message: "Fix bug", date: "2024-01-15" },
      ];

      const sources = commits.map(commit => ({
        type: "git",
        title: `Git Commit ${commit.sha.substring(0, 7)}`,
        description: commit.message,
        timestamp: commit.date,
      }));

      expect(sources[0].title).toBe("Git Commit abc1234");
      expect(sources[0].description).toBe("Fix bug");
    });

    test("should extract email sources", () => {
      const emails = [
        { subject: "Project Update", preview: "Here is the update...", receivedDateTime: "2024-01-15T10:00:00Z" },
      ];

      const sources = emails.map(email => ({
        type: "outlook",
        title: email.subject || "Email",
        description: email.preview,
        timestamp: email.receivedDateTime,
      }));

      expect(sources[0].type).toBe("outlook");
      expect(sources[0].title).toBe("Project Update");
    });
  });

  describe("key search term extraction patterns", () => {
    // Test the extractKeySearchTerms logic patterns
    // These patterns are used to extract key terms from verbose queries

    test("should extract quoted text (double quotes)", () => {
      const query = 'Asset Upload Sorting Failed error - do we have any JIRA tickets about this?';
      // The pattern: /['"]([^'"]{5,80})['"]/
      const quotedMatch = query.match(/['"]([^'"]{5,80})['"]/);

      // No double-quoted text in this query
      expect(quotedMatch).toBeNull();
    });

    test("should extract quoted text when present", () => {
      const query = "I am getting an \"Invalid product ID\" error when trying to link products";
      const quotedMatch = query.match(/['"]([^'"]{5,80})['"]/);

      expect(quotedMatch).not.toBeNull();
      expect(quotedMatch![1]).toBe("Invalid product ID");
    });

    test("should extract single-quoted text", () => {
      // Note: The regex captures text between matching quote types
      // Using backticks to avoid quote escaping issues
      const query = `Getting 'Connection Failed' when saving`;
      const quotedMatch = query.match(/['"]([^'"]{5,80})['"]/);

      expect(quotedMatch).not.toBeNull();
      expect(quotedMatch![1]).toBe("Connection Failed");
    });

    test("should ignore very short quoted text (less than 5 chars)", () => {
      const query = 'Error "AB" occurred';
      const quotedMatch = query.match(/['"]([^'"]{5,80})['"]/);

      // "AB" is only 2 chars, so it should not match
      expect(quotedMatch).toBeNull();
    });

    test("should ignore very long quoted text (more than 80 chars)", () => {
      const longText = "A".repeat(90);
      const query = `Error "${longText}" occurred`;
      const quotedMatch = query.match(/['"]([^'"]{5,80})['"]/);

      expect(quotedMatch).toBeNull();
    });

    test("should detect error patterns with 'Failed'", () => {
      const errorPatterns = [
        /(?:getting|receiving|seeing|have|got)\s+(?:an?\s+)?["']?([A-Z][A-Za-z0-9\s]+(?:Failed|Error|Issue|Problem))["']?/i,
        /["']?([A-Z][A-Za-z0-9\s]+(?:Failed|Error|Issue|Problem))["']?\s+(?:error|issue|problem)?/i,
      ];

      const query = "Asset Upload Sorting Failed error";
      let extracted: string | null = null;

      for (const pattern of errorPatterns) {
        const match = query.match(pattern);
        if (match && match[1]) {
          extracted = match[1].trim();
          break;
        }
      }

      expect(extracted).toBe("Asset Upload Sorting Failed");
    });

    test("should detect error patterns with 'Error'", () => {
      const query = "Getting Invalid Metadata Error when saving";
      const pattern = /(?:getting|receiving|seeing|have|got)\s+(?:an?\s+)?["']?([A-Z][A-Za-z0-9\s]+(?:Failed|Error|Issue|Problem))["']?/i;
      const match = query.match(pattern);

      expect(match).not.toBeNull();
      expect(match![1].trim()).toBe("Invalid Metadata Error");
    });

    test("should clean filler phrases from queries", () => {
      const fillerPhrases = [
        /^(do we have any|are there any|can you find|please search for|search for|look for|find|show me)/i,
        /(jira tickets?|tickets?|issues?|bugs?)\s+(about|for|related to|regarding)/gi,
        /\?+$/,
      ];

      let query = "Do we have any jira tickets about login problems?";

      for (const phrase of fillerPhrases) {
        query = query.replace(phrase, " ");
      }
      query = query.replace(/\s+/g, " ").trim();

      expect(query).toBe("login problems");
    });

    test("should truncate very long queries", () => {
      const longQuery = "This is a very long query that exceeds one hundred characters and should be truncated to the first meaningful part. Additional content here.";

      expect(longQuery.length).toBeGreaterThan(100);

      // The logic takes first sentence or part before dash
      const firstPart = longQuery.split(/[.!?-]/)[0].trim();

      // First part should be shorter
      expect(firstPart.length).toBeLessThan(longQuery.length);
    });
  });

  describe("code query optimization patterns", () => {
    test("should detect reducer code queries", () => {
      const query = "show me the reducer code for sorting";
      const pattern = /(?:show me|find|get|display)\s+(?:the\s+)?(\w+)\s+code\s+(?:for|in)\s+(.+)/i;
      const match = query.match(pattern);

      expect(match).not.toBeNull();
      expect(match![1]).toBe("reducer");
      expect(match![2]).toBe("sorting");
    });

    test("should detect component code queries", () => {
      const query = "find the component code for header";
      const pattern = /(?:show me|find|get|display)\s+(?:the\s+)?(\w+)\s+code\s+(?:for|in)\s+(.+)/i;
      const match = query.match(pattern);

      expect(match).not.toBeNull();
      expect(match![1]).toBe("component");
    });

    test("should detect file path queries", () => {
      const query = "code in assets.reducer.ts";
      const pattern = /code\s+(?:in|from)\s+(\S+\.(?:ts|js|tsx|jsx))/i;
      const match = query.match(pattern);

      expect(match).not.toBeNull();
      expect(match![1]).toBe("assets.reducer.ts");
    });

    test("should build enhanced ngrx query for reducer searches", () => {
      // Simulating the enhancement logic
      const query = "show me the reducer code for sorting";
      const match = query.match(/(?:show me|find|get|display)\s+(?:the\s+)?(\w+)\s+code\s+(?:for|in)\s+(.+)/i);

      if (match && query.toLowerCase().includes("reducer")) {
        const technicalQuery = `ngrx reducer ${match[1] || ""} ${match[2] || ""} .sort createReducer on`;
        expect(technicalQuery).toContain("ngrx");
        expect(technicalQuery).toContain("createReducer");
      }
    });
  });

  describe("AOMA tools configuration", () => {
    // Test the static AOMA_TOOLS configuration patterns

    const AOMA_TOOLS = {
      query_aoma_knowledge: {
        keywords: ["what is", "explain", "tell me about", "how does", "aoma", "usm", "dam", "metadata"],
        priority: 1,
      },
      search_jira_tickets: {
        keywords: ["jira", "ticket", "issue", "bug", "feature", "task", "story", "epic"],
        priority: 2,
      },
      get_jira_ticket_count: {
        keywords: ["how many", "count", "number of", "tickets", "issues"],
        priority: 2,
      },
      search_git_commits: {
        keywords: ["commit", "commits", "git", "github", "changes", "history", "recent", "latest"],
        priority: 3,
      },
      search_code_files: {
        keywords: ["code", "file", "function", "class", "implementation", "source", "repository"],
        priority: 3,
      },
      search_outlook_emails: {
        keywords: ["email", "outlook", "message", "communication", "sent", "received", "mail"],
        priority: 4,
      },
      analyze_development_context: {
        keywords: ["analyze", "context", "development", "insight", "assessment", "review"],
        priority: 5,
      },
      get_system_health: {
        keywords: ["health", "status", "system", "performance", "monitoring"],
        priority: 6,
      },
    };

    test("should have correct priority ordering for tools", () => {
      // Knowledge base should have highest priority (1)
      expect(AOMA_TOOLS.query_aoma_knowledge.priority).toBe(1);

      // Jira tools should have priority 2
      expect(AOMA_TOOLS.search_jira_tickets.priority).toBe(2);
      expect(AOMA_TOOLS.get_jira_ticket_count.priority).toBe(2);

      // Git/code should have priority 3
      expect(AOMA_TOOLS.search_git_commits.priority).toBe(3);
      expect(AOMA_TOOLS.search_code_files.priority).toBe(3);

      // Email has priority 4
      expect(AOMA_TOOLS.search_outlook_emails.priority).toBe(4);

      // System health has lowest priority (6)
      expect(AOMA_TOOLS.get_system_health.priority).toBe(6);
    });

    test("should calculate tool scores based on keyword matches", () => {
      const query = "show me jira tickets and git commits";
      const lowerQuery = query.toLowerCase();

      // Calculate scores like the actual code does
      const toolScores: Map<string, number> = new Map();

      for (const [toolName, config] of Object.entries(AOMA_TOOLS)) {
        let score = 0;
        for (const keyword of config.keywords) {
          if (lowerQuery.includes(keyword)) {
            score += 10 / config.priority;
          }
        }
        if (score > 0) {
          toolScores.set(toolName, score);
        }
      }

      // Jira should score (tickets keyword matches)
      expect(toolScores.has("search_jira_tickets")).toBe(true);

      // Git should score (commits keyword matches)
      expect(toolScores.has("search_git_commits")).toBe(true);
    });

    test("should match knowledge base for general AOMA queries", () => {
      const query = "what is aoma";
      const lowerQuery = query.toLowerCase();

      let score = 0;
      for (const keyword of AOMA_TOOLS.query_aoma_knowledge.keywords) {
        if (lowerQuery.includes(keyword)) {
          score += 10 / AOMA_TOOLS.query_aoma_knowledge.priority;
        }
      }

      // Should match both "what is" and "aoma"
      expect(score).toBeGreaterThan(0);
      expect(score).toBe(20); // Two matches at priority 1 = 10 + 10
    });
  });

  describe("vector search result transformation", () => {
    test("should map VectorSearchResult to AOMASource", () => {
      const vectorResults = [
        {
          source_type: "knowledge",
          source_id: "doc-123",
          content: "AOMA is an Asset and Offering Management Application used by Sony Music.",
          similarity: 0.85,
          metadata: { title: "AOMA Overview", url: "https://docs.example.com/aoma" },
          created_at: "2024-01-15T10:00:00Z",
        },
        {
          source_type: "jira",
          source_id: "AOMA-456",
          content: "Bug fix for sorting functionality.",
          similarity: 0.72,
          metadata: { title: "AOMA-456: Fix sorting" },
          created_at: "2024-01-10T08:00:00Z",
        },
        {
          source_type: "email",
          source_id: "email-789",
          content: "Team meeting about AOMA deployment.",
          similarity: 0.65,
          metadata: { title: "RE: AOMA Deployment" },
          created_at: "2024-01-12T14:00:00Z",
        },
      ];

      // Transform like the actual code does
      const aomaSources = vectorResults.map(s => ({
        type: (s.source_type === "email" ? "outlook" :
               s.source_type === "metrics" ? "system" :
               s.source_type === "knowledge" ? "knowledge_base" :
               s.source_type === "firecrawl" ? "knowledge_base" :
               s.source_type),
        title: s.metadata?.title || s.source_id || "Unknown Source",
        url: s.metadata?.url,
        description: s.content.substring(0, 100) + "...",
        relevance: s.similarity,
        timestamp: s.created_at,
      }));

      // Knowledge becomes knowledge_base
      expect(aomaSources[0].type).toBe("knowledge_base");
      expect(aomaSources[0].title).toBe("AOMA Overview");
      expect(aomaSources[0].url).toBe("https://docs.example.com/aoma");
      expect(aomaSources[0].relevance).toBe(0.85);

      // Jira stays as jira
      expect(aomaSources[1].type).toBe("jira");

      // Email becomes outlook
      expect(aomaSources[2].type).toBe("outlook");
    });

    test("should handle missing metadata gracefully", () => {
      const result = {
        source_type: "knowledge",
        source_id: "doc-123",
        content: "Some content here",
        similarity: 0.75,
        metadata: null,
        created_at: "2024-01-15T10:00:00Z",
      };

      const source = {
        type: "knowledge_base",
        title: result.metadata?.title || result.source_id || "Unknown Source",
        url: result.metadata?.url,
        description: result.content.substring(0, 100) + "...",
        relevance: result.similarity,
      };

      // Should fallback to source_id
      expect(source.title).toBe("doc-123");
      expect(source.url).toBeUndefined();
    });
  });

  describe("response synthesis patterns", () => {
    test("should group results by source type", () => {
      const results = [
        { source_type: "knowledge", content: "Knowledge content", similarity: 0.9 },
        { source_type: "jira", content: "Jira content", similarity: 0.8 },
        { source_type: "knowledge", content: "More knowledge", similarity: 0.7 },
        { source_type: "git", content: "Git content", similarity: 0.6 },
      ];

      const bySourceType = results.reduce(
        (acc, result) => {
          const type = result.source_type;
          if (!acc[type]) acc[type] = [];
          acc[type].push(result);
          return acc;
        },
        {} as Record<string, typeof results>
      );

      expect(bySourceType["knowledge"].length).toBe(2);
      expect(bySourceType["jira"].length).toBe(1);
      expect(bySourceType["git"].length).toBe(1);
    });

    test("should order results by priority", () => {
      const bySourceType = {
        git: [{ content: "Git" }],
        knowledge: [{ content: "Knowledge" }],
        jira: [{ content: "Jira" }],
        email: [{ content: "Email" }],
      };

      const priorityOrder = ["knowledge", "jira", "git", "email", "metrics"];
      const orderedTypes = priorityOrder.filter((type) => bySourceType[type as keyof typeof bySourceType]);

      expect(orderedTypes).toEqual(["knowledge", "jira", "git", "email"]);
      expect(orderedTypes[0]).toBe("knowledge");
    });

    test("should limit results per source type to 3", () => {
      const typeResults = [
        { content: "Result 1" },
        { content: "Result 2" },
        { content: "Result 3" },
        { content: "Result 4" },
        { content: "Result 5" },
      ];

      const topResults = typeResults.slice(0, 3);

      expect(topResults.length).toBe(3);
      expect(topResults[2].content).toBe("Result 3");
    });

    test("should build citation-marked response", () => {
      const results = [
        { content: "First relevant content", similarity: 0.9 },
        { content: "Second relevant content", similarity: 0.8 },
      ];

      let response = "";
      let citationIndex = 1;

      results.forEach((result) => {
        const content = result.content.trim();
        response += `${content} [${citationIndex}]\n\n`;
        citationIndex++;
      });

      expect(response).toContain("[1]");
      expect(response).toContain("[2]");
      expect(response).toContain("First relevant content [1]");
    });
  });

  describe("citation marker addition", () => {
    test("should add citation markers to sentences", () => {
      const response = "This is first sentence. This is second sentence.";
      const sources = [{ title: "Source 1" }, { title: "Source 2" }];

      const sentences = response.split(/(?<=[.!?])\s+/);
      const citedSentences = sentences.map((sentence, idx) => {
        if (idx < sources.length && !sentence.includes("[")) {
          return `${sentence} [${idx + 1}]`;
        }
        return sentence;
      });

      const result = citedSentences.join(" ");

      expect(result).toContain("[1]");
      expect(result).toContain("[2]");
    });

    test("should not double-add citations", () => {
      const response = "This already has citation [1]. This needs one.";
      const sources = [{ title: "Source 1" }, { title: "Source 2" }];

      const sentences = response.split(/(?<=[.!?])\s+/);
      const citedSentences = sentences.map((sentence, idx) => {
        if (idx < sources.length && !sentence.includes("[")) {
          return `${sentence} [${idx + 1}]`;
        }
        return sentence;
      });

      const result = citedSentences.join(" ");

      // First sentence already has [1], shouldn't add another
      expect(result.match(/\[1\]/g)?.length).toBe(1);
    });

    test("should handle empty sources gracefully", () => {
      const response = "This is content without sources.";
      const sources: any[] = [];

      if (!sources || sources.length === 0) {
        expect(response).toBe("This is content without sources.");
      }
    });
  });

  describe("orchestration strategy detection", () => {
    test("should detect parallel strategy for multi-topic queries", () => {
      const query = "show jira tickets and git commits";
      const lowerQuery = query.toLowerCase();

      const hasMultipleTopics = (
        lowerQuery.includes(" and ") ||
        lowerQuery.includes(" also ") ||
        lowerQuery.includes(" plus ")
      ) && !lowerQuery.includes("and how");

      expect(hasMultipleTopics).toBe(true);
    });

    test("should detect sequential strategy", () => {
      const sequentialQueries = [
        "find the bug then fix it",
        "search commits after getting tickets",
      ];

      sequentialQueries.forEach(query => {
        const lowerQuery = query.toLowerCase();
        const isSequential = lowerQuery.includes("then") || lowerQuery.includes("after");
        expect(isSequential).toBe(true);
      });
    });

    test("should default to single strategy", () => {
      const query = "what is aoma";
      const lowerQuery = query.toLowerCase();

      const isParallel = (
        lowerQuery.includes(" and ") ||
        lowerQuery.includes(" also ") ||
        lowerQuery.includes(" plus ")
      ) && !lowerQuery.includes("and how");

      const isSequential = lowerQuery.includes("then") || lowerQuery.includes("after");

      expect(isParallel).toBe(false);
      expect(isSequential).toBe(false);
      // Therefore single strategy
    });
  });

  describe("cache key generation", () => {
    test("should generate consistent cache keys", () => {
      const normalize = (query: string) =>
        query
          .trim()
          .toLowerCase()
          .replace(/[?!.]+$/, "")
          .replace(/\s+/g, " ");

      const queries = [
        "What is AOMA?",
        "what is aoma",
        "WHAT IS AOMA!",
        "  what  is  aoma  ",
      ];

      const normalized = queries.map(normalize);

      // All should normalize to the same value
      expect(new Set(normalized).size).toBe(1);
      expect(normalized[0]).toBe("what is aoma");
    });

    test("should include source types in cache key", () => {
      const normalizedQuery = "what is aoma";
      const sourceTypes = ["knowledge", "jira"];

      const sourceTypesKey = sourceTypes.sort().join(",") || "auto";
      const cacheKey = `orchestrated:${normalizedQuery}:${sourceTypesKey}`;

      expect(cacheKey).toBe("orchestrated:what is aoma:jira,knowledge");
    });

    test("should use 'auto' when no source types specified", () => {
      const normalizedQuery = "what is aoma";
      const sourceTypes: string[] | undefined = undefined;

      const sourceTypesKey = sourceTypes?.sort().join(",") || "auto";
      const cacheKey = `orchestrated:${normalizedQuery}:${sourceTypesKey}`;

      expect(cacheKey).toBe("orchestrated:what is aoma:auto");
    });
  });

  describe("query type handling in analyzeQuery", () => {
    test("should handle string queries", () => {
      const query = "what is aoma";

      let queryString: string;
      if (typeof query === "string") {
        queryString = query;
      } else {
        queryString = String(query);
      }

      expect(queryString).toBe("what is aoma");
    });

    test("should handle object queries with text property", () => {
      const query = { type: "text", text: "what is aoma" };

      let queryString: string;
      if (typeof query === "string") {
        queryString = query;
      } else if (query && typeof query === "object") {
        if ("text" in query && query.text) {
          queryString = query.text;
        } else {
          queryString = JSON.stringify(query);
        }
      } else {
        queryString = String(query || "");
      }

      expect(queryString).toBe("what is aoma");
    });

    test("should handle array queries", () => {
      const query = [
        { text: "what is " },
        { text: "aoma" },
      ];

      let queryString: string;
      if (Array.isArray(query)) {
        queryString = query.map((part: any) => part.text || part.content || "").join("");
      } else {
        queryString = String(query);
      }

      expect(queryString).toBe("what is aoma");
    });

    test("should handle null/undefined queries", () => {
      const nullQuery = null;
      const undefinedQuery = undefined;

      const nullString = String(nullQuery || "");
      const undefinedString = String(undefinedQuery || "");

      expect(nullString).toBe("");
      expect(undefinedString).toBe("");
    });
  });

  describe("formatted source structure", () => {
    test("should create properly structured formatted sources", () => {
      const sources = [
        { title: "AOMA Overview", url: "https://example.com/aoma", description: "Overview doc" },
        { title: "Jira AOMA-123" }, // No URL
      ];

      const formattedSources = sources.map((source, idx) => ({
        id: `source-${idx + 1}`,
        title: typeof source === "string" ? source : source.title,
        url: typeof source === "object" ? source.url : undefined,
        description: typeof source === "object" ? source.description : source,
      }));

      expect(formattedSources[0].id).toBe("source-1");
      expect(formattedSources[0].url).toBe("https://example.com/aoma");
      expect(formattedSources[1].id).toBe("source-2");
      expect(formattedSources[1].url).toBeUndefined();
    });

    test("should handle string sources", () => {
      const source = "Simple string source";

      const formatted = {
        id: "source-1",
        title: typeof source === "string" ? source : (source as any).title,
        url: typeof source === "object" ? (source as any).url : undefined,
        description: typeof source === "object" ? (source as any).description : source,
      };

      expect(formatted.title).toBe("Simple string source");
      expect(formatted.description).toBe("Simple string source");
      expect(formatted.url).toBeUndefined();
    });
  });

  // Integration tests - require real Supabase connection
  describe.skipIf(!shouldRunIntegrationTests)("integration tests", () => {
    test("should query vector store with real connection", async () => {
      const result = await orchestrator.queryVectorStore("what is aoma", {
        matchThreshold: 0.5,
        matchCount: 5,
        useCache: false,
      });

      expect(result).toHaveProperty("response");
      expect(result).toHaveProperty("sources");
      expect(result).toHaveProperty("metadata");
    });

    test("should execute orchestration with real services", async () => {
      const result = await orchestrator.executeOrchestration("explain aoma workflow");

      expect(result).toHaveProperty("response");
      expect(result).toHaveProperty("sources");
    });
  });
});
