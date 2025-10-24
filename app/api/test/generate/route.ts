import { NextRequest, NextResponse } from "next/server";
import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
// import { modelConfig } from "../../../../src/services/modelConfig";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, testType, targetFile, context } = body;

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    // Build the system prompt based on test type
    let systemPrompt = `You are an expert test engineer. Generate high-quality, comprehensive tests.`;

    switch (testType) {
      case "unit":
        systemPrompt += ` Generate unit tests that test individual functions and components in isolation.`;
        break;
      case "integration":
        systemPrompt += ` Generate integration tests that test how different components work together.`;
        break;
      case "e2e":
        systemPrompt += ` Generate end-to-end tests using Playwright that test complete user workflows.`;
        break;
      case "performance":
        systemPrompt += ` Generate performance tests that measure and validate application performance metrics.`;
        break;
      default:
        systemPrompt += ` Generate appropriate tests based on the context provided.`;
    }

    systemPrompt += ` Return only the test code without any explanations. Use TypeScript and modern testing best practices.`;

    // Generate test code using AI
    const result = await generateText({
      model: openai("gpt-4o-mini"),
      system: systemPrompt,
      prompt: `Generate tests for: ${prompt}${targetFile ? `\nTarget file: ${targetFile}` : ""}${context ? `\nContext: ${context}` : ""}`,
      temperature: 0.7,
      // maxTokens: 2000,
    });

    // Mock additional test metadata
    const generatedTest = {
      id: `test_${Date.now()}`,
      name: `Generated ${testType} test`,
      code: result.text,
      type: testType,
      targetFile,
      coverage: {
        lines: Math.floor(Math.random() * 30) + 70,
        branches: Math.floor(Math.random() * 30) + 60,
        functions: Math.floor(Math.random() * 30) + 70,
        statements: Math.floor(Math.random() * 30) + 75,
      },
      suggestions: [
        "Consider adding edge case tests for null inputs",
        "Add tests for error handling scenarios",
        "Include performance benchmarks",
      ],
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(generatedTest, { status: 200 });
  } catch (error) {
    console.error("Test generation error:", error);
    return NextResponse.json({ error: "Failed to generate test" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const testId = searchParams.get("id");

    // Mock fetching previously generated tests
    const mockTests = [
      {
        id: "test_1",
        name: "Authentication Flow Test",
        type: "e2e",
        code: `import { test, expect } from '@playwright/test';

test('user can login with magic link', async ({ page }) => {
  await page.goto('/login');
  await page.fill('[data-testid="email"]', 'user@example.com');
  await page.click('[data-testid="send-magic-link"]');
  
  // Wait for magic link to be sent
  await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
  
  // Simulate clicking magic link (in real test, would check email)
  await page.goto('/auth/verify?token=test-token');
  
  // Verify user is logged in
  await expect(page).toHaveURL('/dashboard');
  await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
});`,
        targetFile: "src/auth/login.tsx",
        timestamp: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: "test_2",
        name: "File Upload Unit Test",
        type: "unit",
        code: `import { uploadFile, validateFileType } from './fileUpload';

describe('File Upload', () => {
  it('should accept valid file types', () => {
    const validFile = new File(['content'], 'test.pdf', { type: 'application/pdf' });
    expect(validateFileType(validFile)).toBe(true);
  });
  
  it('should reject invalid file types', () => {
    const invalidFile = new File(['content'], 'test.exe', { type: 'application/x-msdownload' });
    expect(validateFileType(invalidFile)).toBe(false);
  });
  
  it('should handle large files correctly', async () => {
    const largeFile = new File(['x'.repeat(10 * 1024 * 1024)], 'large.pdf');
    await expect(uploadFile(largeFile)).rejects.toThrow('File too large');
  });
});`,
        targetFile: "src/utils/fileUpload.ts",
        timestamp: new Date(Date.now() - 7200000).toISOString(),
      },
    ];

    if (testId) {
      const test = mockTests.find((t) => t.id === testId);
      if (test) {
        return NextResponse.json(test, { status: 200 });
      }
      return NextResponse.json({ error: "Test not found" }, { status: 404 });
    }

    return NextResponse.json(
      {
        tests: mockTests,
        total: mockTests.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching generated tests:", error);
    return NextResponse.json({ error: "Failed to fetch generated tests" }, { status: 500 });
  }
}
