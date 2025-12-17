import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const geminiApiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;

interface PlaywrightGenerationRequest {
  testId?: number;
  testName: string;
  description: string;
  preconditions?: string;
  expectedResult?: string;
  app_under_test?: string;
  baseUrl?: string;
}

interface PlaywrightGenerationResult {
  success: boolean;
  testCode: string;
  testFileName: string;
  language: "typescript";
  framework: "playwright";
  selectors: string[];
  notes: string[];
  generationModel: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: PlaywrightGenerationRequest = await request.json();
    const { 
      testId, 
      testName, 
      description, 
      preconditions, 
      expectedResult,
      app_under_test = "AOMA",
      baseUrl = "https://aoma-stage.smcdp-de.net"
    } = body;

    if (!testName || !description) {
      return NextResponse.json(
        { error: "testName and description are required" },
        { status: 400 }
      );
    }

    if (!geminiApiKey) {
      return NextResponse.json(
        { error: "Gemini API key not configured" },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `You are an expert QA automation engineer. Generate a Playwright test in TypeScript for the following test case.

## Test Details
- **Test Name**: ${testName}
- **Description**: ${description}
${preconditions ? `- **Preconditions**: ${preconditions}` : ""}
${expectedResult ? `- **Expected Result**: ${expectedResult}` : ""}
- **Application**: ${app_under_test}
- **Base URL**: ${baseUrl}

## Requirements
1. Use TypeScript with Playwright Test (@playwright/test)
2. Use data-testid attributes where possible (e.g., [data-testid="login-button"])
3. Include proper waits and assertions
4. Add JSDoc comments explaining each step
5. Use Page Object Model structure with inline page object
6. Include error handling for common failures
7. Use descriptive test names with test.describe and test()

## Output Format
Return ONLY valid TypeScript code, no markdown code blocks. The code should be ready to copy into a .spec.ts file.

Generate the test:`;

    const result = await model.generateContent(prompt);
    let testCode = result.response.text();

    // Clean up the response - remove markdown if present
    testCode = testCode
      .replace(/^```typescript\n?/gm, "")
      .replace(/^```ts\n?/gm, "")
      .replace(/```$/gm, "")
      .trim();

    // Extract selectors mentioned in the code
    const selectorMatches = testCode.match(/\[data-testid="[^"]+"\]|getByRole\([^)]+\)|getByText\([^)]+\)|getByLabel\([^)]+\)/g) || [];
    const selectors = [...new Set(selectorMatches)];

    // Generate filename
    const sanitizedName = testName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .substring(0, 50);
    const testFileName = `${sanitizedName}.spec.ts`;

    // Generate notes
    const notes: string[] = [];
    if (!preconditions) {
      notes.push("⚠️ No preconditions specified - you may need to add setup steps");
    }
    if (testCode.includes("TODO")) {
      notes.push("📝 Contains TODO items that need manual review");
    }
    if (selectors.length === 0) {
      notes.push("⚠️ No specific selectors detected - review and add data-testid attributes to the app");
    }
    notes.push(`✅ Generated for ${app_under_test} at ${baseUrl}`);

    const response: PlaywrightGenerationResult = {
      success: true,
      testCode,
      testFileName,
      language: "typescript",
      framework: "playwright",
      selectors,
      notes,
      generationModel: "gemini-2.0-flash",
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error generating Playwright test:", error);
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to generate Playwright test", 
        details: String(error) 
      },
      { status: 500 }
    );
  }
}

