/**
 * Tester Chat API - Test-focused Assistant
 *
 * Chat endpoint for test discovery, analysis, and code generation.
 * Focuses on betabase test data, test analytics, and Playwright generation.
 *
 * Key differences from main /api/chat:
 * - Tester-specific system prompt
 * - Test scenario search from betabase
 * - Playwright code generation
 * - Flaky test analysis
 */

import { streamText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { z } from "zod/v3";
import { createClient } from "@supabase/supabase-js";

// Allow streaming responses up to 60 seconds
export const maxDuration = 60;

// Input validation schemas
const MessageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string().min(1).max(10000).optional(),
  parts: z.array(z.any()).optional(),
});

const TesterRequestSchema = z.object({
  messages: z.array(MessageSchema).min(1).max(50),
  systemPrompt: z.string().max(10000).optional(),
});

// Tester-focused system prompt
const TESTER_SYSTEM_PROMPT = `You are a QA engineer assistant focused on helping testers find, understand, and create tests.

You have access to:
- Historical test data from betabase (8,449+ test scenarios)
- Self-healing test attempt records
- RLHF-generated test scenarios
- Test analytics and failure patterns

When answering questions:
1. Be precise about test names, files, and line numbers
2. Reference specific test scenarios with their IDs when available
3. Generate valid Playwright test code when asked
4. Highlight flaky tests and patterns that indicate instability
5. Suggest improvements based on test coverage gaps

For code responses, format them clearly with syntax highlighting.
When generating Playwright tests, follow these conventions:
- Use page object model patterns where appropriate
- Include proper waits and assertions
- Add descriptive test names
- Include comments explaining the test purpose

Example Playwright test structure:
\`\`\`typescript
import { test, expect } from "@playwright/test";

test.describe("Feature Name", () => {
  test("should do something specific", async ({ page }) => {
    // Navigate to the page
    await page.goto("/path");

    // Interact with elements
    await page.click("button:has-text('Submit')");

    // Assert expected behavior
    await expect(page.locator(".success-message")).toBeVisible();
  });
});
\`\`\`

For test search results, include:
- Test name and description
- Last run status (pass/fail) if available
- File path and category
- Relevant steps or assertions

IMPORTANT: Always be helpful and provide actionable guidance. If you don't have specific test data, provide general best practices and example code.`;

// Initialize Supabase client
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseKey);
}

// Search for relevant tests in betabase
async function searchTests(query: string): Promise<string> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return "";
  }

  try {
    // Search historical tests view
    const { data: tests, error } = await supabase
      .from("historical_tests_view")
      .select("test_name, test_category, test_steps, expected_results, status")
      .or(`test_name.ilike.%${query}%,test_category.ilike.%${query}%,test_steps.ilike.%${query}%`)
      .limit(10);

    if (error) {
      console.error("[Tester] Test search error:", error);
      return "";
    }

    if (!tests || tests.length === 0) {
      return "";
    }

    // Format test results for context
    const formattedTests = tests.map((t, i) => {
      let entry = `[TEST ${i + 1}] ${t.test_name || "Unnamed Test"}\n`;
      if (t.test_category) entry += `Category: ${t.test_category}\n`;
      if (t.status) entry += `Status: ${t.status}\n`;
      if (t.test_steps) entry += `Steps: ${t.test_steps.slice(0, 500)}${t.test_steps.length > 500 ? "..." : ""}\n`;
      if (t.expected_results) entry += `Expected: ${t.expected_results.slice(0, 300)}${t.expected_results.length > 300 ? "..." : ""}\n`;
      return entry;
    });

    return `\n\n[BETABASE TEST DATA]\nFound ${tests.length} relevant tests:\n\n${formattedTests.join("\n---\n")}\n\n[END TEST DATA]`;
  } catch (err) {
    console.error("[Tester] Test search failed:", err);
    return "";
  }
}

// Search for self-healing attempts
async function searchSelfHealingAttempts(query: string): Promise<string> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return "";
  }

  try {
    const { data: attempts, error } = await supabase
      .from("self_healing_attempts")
      .select("test_name, error_type, original_selector, healed_selector, success, created_at")
      .or(`test_name.ilike.%${query}%,error_type.ilike.%${query}%`)
      .order("created_at", { ascending: false })
      .limit(5);

    if (error || !attempts || attempts.length === 0) {
      return "";
    }

    const formattedAttempts = attempts.map((a, i) => {
      let entry = `[HEALING ${i + 1}] ${a.test_name || "Unknown Test"}\n`;
      entry += `Error: ${a.error_type || "Unknown"}\n`;
      entry += `Original: ${a.original_selector || "N/A"}\n`;
      entry += `Healed: ${a.healed_selector || "N/A"}\n`;
      entry += `Success: ${a.success ? "Yes" : "No"}\n`;
      return entry;
    });

    return `\n\n[SELF-HEALING ATTEMPTS]\n${formattedAttempts.join("\n---\n")}\n`;
  } catch (err) {
    console.error("[Tester] Self-healing search failed:", err);
    return "";
  }
}

export async function GET(_req: Request) {
  return new Response(
    JSON.stringify({
      status: "ready",
      version: "1.0.0",
      provider: "google",
      model: "gemini-3-flash-preview",
      features: ["streaming", "test-search", "playwright-generation", "flaky-analysis"],
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
}

export async function POST(req: Request) {
  try {
    console.log("[Tester] ========== POST /api/tester/chat ==========");

    // Validate API key
    if (!process.env.GOOGLE_API_KEY && !process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      console.error("[Tester] No Google API key configured");
      return new Response(
        JSON.stringify({
          error: "Service configuration error",
          code: "CONFIG_ERROR",
        }),
        { status: 503, headers: { "Content-Type": "application/json" } }
      );
    }

    // Initialize Google provider
    const google = createGoogleGenerativeAI({
      apiKey: process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || "",
    });

    // Parse and validate request
    const body = await req.json();
    const validation = TesterRequestSchema.safeParse(body);
    if (!validation.success) {
      console.warn("[Tester] Invalid request:", validation.error.errors);
      return new Response(
        JSON.stringify({
          error: "Invalid request format",
          details: process.env.NODE_ENV === "development" ? validation.error.errors : undefined,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { messages, systemPrompt } = validation.data;

    // Convert messages to proper format
    const formattedMessages = messages
      .filter((msg: any) => {
        const content = msg.parts?.find((p: any) => p.type === "text")?.text || msg.content;
        return content != null && content !== "";
      })
      .map((msg: any) => {
        const content = String(
          msg.parts?.find((p: any) => p.type === "text")?.text || msg.content || ""
        );
        return { role: msg.role as "user" | "assistant" | "system", content };
      });

    if (formattedMessages.length === 0) {
      return new Response(
        JSON.stringify({ error: "No valid messages provided" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get the latest user message for search
    const latestUserMessage = formattedMessages.filter((m) => m.role === "user").pop();
    const queryString = latestUserMessage?.content || "";

    // Search betabase for relevant test data
    let contextBlock = "";
    let searchMetadata = { testsFound: 0, healingFound: 0 };

    if (queryString) {
      console.log(`[Tester] Searching tests for: ${queryString.substring(0, 100)}...`);

      // Run searches in parallel
      const [testContext, healingContext] = await Promise.all([
        searchTests(queryString),
        searchSelfHealingAttempts(queryString),
      ]);

      contextBlock = testContext + healingContext;

      // Count results for metadata
      searchMetadata.testsFound = (testContext.match(/\[TEST \d+\]/g) || []).length;
      searchMetadata.healingFound = (healingContext.match(/\[HEALING \d+\]/g) || []).length;

      console.log(`[Tester] Found ${searchMetadata.testsFound} tests, ${searchMetadata.healingFound} healing attempts`);
    }

    // Build the enhanced system prompt
    const finalSystemPrompt = (systemPrompt || TESTER_SYSTEM_PROMPT) + contextBlock;

    console.log(`[Tester] Starting stream with ${formattedMessages.length} messages`);
    console.log(`[Tester] Context length: ${contextBlock.length} chars`);

    // Stream the response
    const result = streamText({
      model: google("gemini-3-flash-preview"),
      messages: formattedMessages,
      system: finalSystemPrompt,
      temperature: 0.7,
      onFinish: ({ text }) => {
        console.log(`[Tester] Stream finished. Response length: ${text.length} chars`);
      },
    });

    // Create a custom text stream response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.textStream) {
            // Send as data stream format: 0:"text"
            const data = `0:${JSON.stringify(chunk)}\n`;
            controller.enqueue(encoder.encode(data));
          }
          controller.close();
        } catch (error) {
          console.error("[Tester] Stream error:", error);
          controller.error(error);
        }
      },
    });

    const response = new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });

    // Attach search metadata
    response.headers.set("X-Search-Metadata", JSON.stringify(searchMetadata));
    response.headers.set("Access-Control-Expose-Headers", "X-Search-Metadata");

    return response;
  } catch (error) {
    console.error("[Tester] API error:", error);

    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    return new Response(
      JSON.stringify({
        error: "An error occurred processing your request",
        details: process.env.NODE_ENV === "development" ? errorMessage : undefined,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
