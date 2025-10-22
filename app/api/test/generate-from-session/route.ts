import { NextRequest, NextResponse } from "next/server";
import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";

interface TestResult {
  id: string;
  name: string;
  suite: string;
  status: "passed" | "failed" | "skipped";
  duration: number;
  timestamp: Date;
  error?: {
    message: string;
    stack: string;
    expected?: string;
    actual?: string;
  };
  logs?: string[];
  screenshots?: string[];
  video?: string;
}

interface AssertionMapping {
  id: string;
  action: {
    type: "navigation" | "click" | "input" | "wait" | "screenshot" | "assertion";
    description: string;
    selector?: string;
    value?: string;
  };
  assertion: {
    type: string;
    code: string;
    description: string;
  };
  confidence: number;
  lineNumber: number;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { testResult, existingTest } = body as {
      testResult: TestResult;
      existingTest?: string;
    };

    if (!testResult) {
      return NextResponse.json({ error: "Test result data is required" }, { status: 400 });
    }

    // Build context from test result
    const context = {
      testName: testResult.name,
      suite: testResult.suite,
      status: testResult.status,
      duration: testResult.duration,
      logs: testResult.logs || [],
      error: testResult.error,
      hasScreenshots: (testResult.screenshots?.length || 0) > 0,
      hasVideo: !!testResult.video,
    };

    // System prompt for test generation from session
    const systemPrompt = `You are an expert Playwright test engineer. Your task is to generate a comprehensive Playwright test from a test execution session.

Requirements:
1. Generate complete, runnable Playwright test code in TypeScript
2. Include proper imports: import { test, expect } from '@playwright/test'
3. Use describe blocks for test suites
4. Include meaningful assertions based on the session data
5. Add comments explaining each step
6. Use best practices for selectors (prefer data-testid)
7. Include error handling where appropriate
8. Make assertions specific and verifiable

Return ONLY the test code without any markdown formatting or explanations.`;

    const userPrompt = `Generate a Playwright test from this test execution session:

Test Name: ${context.testName}
Suite: ${context.suite}
Status: ${context.status}
Duration: ${context.duration}ms

${context.logs.length > 0 ? `Execution Logs:\n${context.logs.slice(0, 10).join("\n")}\n` : ""}

${context.error ? `Error Information:\n${context.error.message}\n${context.error.expected ? `Expected: ${context.error.expected}\n` : ""}${context.error.actual ? `Actual: ${context.error.actual}\n` : ""}` : ""}

${existingTest ? `Previous Test Code (for reference):\n${existingTest}\n` : ""}

Generate a complete Playwright test that reproduces this test scenario with proper assertions.`;

    // Generate test code using AI
    const result = await generateText({
      model: openai("gpt-4o-mini"),
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.3, // Lower temperature for more deterministic code generation
    });

    // Extract and clean the generated code
    let generatedCode = result.text.trim();

    // Remove markdown code blocks if present
    generatedCode = generatedCode.replace(/^```typescript\n/, "").replace(/^```\n/, "").replace(/\n```$/, "");

    // Generate action-to-assertion mappings by analyzing the code
    const assertions = generateAssertionMappings(generatedCode, context);

    return NextResponse.json(
      {
        code: generatedCode,
        assertions: assertions,
        metadata: {
          sourceSessionId: testResult.id,
          generatedAt: new Date().toISOString(),
          model: "gpt-4o-mini",
          isRegeneration: !!existingTest,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Test generation from session error:", error);
    return NextResponse.json(
      { error: "Failed to generate test from session" },
      { status: 500 }
    );
  }
}

function generateAssertionMappings(code: string, context: any): AssertionMapping[] {
  const mappings: AssertionMapping[] = [];
  const lines = code.split("\n");

  let currentLine = 0;
  let mappingId = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    currentLine = i + 1;

    // Detect navigation
    if (line.includes("page.goto")) {
      const urlMatch = line.match(/goto\(['"`]([^'"`]+)['"`]\)/);
      const url = urlMatch ? urlMatch[1] : "unknown";

      mappings.push({
        id: String(++mappingId),
        action: {
          type: "navigation",
          description: `Navigate to ${url}`,
          value: url,
        },
        assertion: {
          type: "toHaveURL",
          code: lines[i + 1]?.trim() || "",
          description: "Verify URL loaded correctly",
        },
        confidence: 95,
        lineNumber: currentLine,
      });
    }

    // Detect click actions
    if (line.includes("page.click") || line.includes(".click()")) {
      const selectorMatch = line.match(/click\(['"`]([^'"`]+)['"`]\)/) || line.match(/locator\(['"`]([^'"`]+)['"`]\)/);
      const selector = selectorMatch ? selectorMatch[1] : "unknown";

      mappings.push({
        id: String(++mappingId),
        action: {
          type: "click",
          description: `Click element: ${selector}`,
          selector: selector,
        },
        assertion: {
          type: "toBeVisible",
          code: lines[i + 1]?.trim() || "",
          description: "Verify element is clickable",
        },
        confidence: 85,
        lineNumber: currentLine,
      });
    }

    // Detect input/fill actions
    if (line.includes("page.fill") || line.includes(".fill(")) {
      const selectorMatch = line.match(/fill\(['"`]([^'"`]+)['"`],\s*['"`]([^'"`]+)['"`]\)/);
      const selector = selectorMatch ? selectorMatch[1] : "unknown";
      const value = selectorMatch ? selectorMatch[2] : "unknown";

      mappings.push({
        id: String(++mappingId),
        action: {
          type: "input",
          description: `Enter value in ${selector}`,
          selector: selector,
          value: value,
        },
        assertion: {
          type: "toHaveValue",
          code: lines[i + 1]?.trim() || "",
          description: "Verify input value is correct",
        },
        confidence: 90,
        lineNumber: currentLine,
      });
    }

    // Detect assertions
    if (line.includes("expect(") && line.includes("toBeVisible")) {
      const selectorMatch = line.match(/locator\(['"`]([^'"`]+)['"`]\)/);
      const selector = selectorMatch ? selectorMatch[1] : "unknown";

      mappings.push({
        id: String(++mappingId),
        action: {
          type: "assertion",
          description: `Verify ${selector} is visible`,
          selector: selector,
        },
        assertion: {
          type: "toBeVisible",
          code: line,
          description: "Verify element visibility",
        },
        confidence: 88,
        lineNumber: currentLine,
      });
    }
  }

  return mappings;
}
