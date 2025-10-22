import { NextRequest, NextResponse } from "next/server";
import * as fs from "fs";
import * as path from "path";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, testName, suite, sourceSessionId } = body;

    if (!code || !testName) {
      return NextResponse.json({ error: "Code and test name are required" }, { status: 400 });
    }

    // Determine file path
    const testsDir = path.join(process.cwd(), "tests");
    const suiteDir = suite ? path.join(testsDir, suite.toLowerCase().replace(/\s+/g, "-")) : testsDir;
    const fileName = `${testName.toLowerCase().replace(/\s+/g, "-")}.spec.ts`;
    const filePath = path.join(suiteDir, fileName);

    // Create directory if it doesn't exist
    if (!fs.existsSync(suiteDir)) {
      fs.mkdirSync(suiteDir, { recursive: true });
    }

    // Check if file already exists
    let finalFilePath = filePath;
    if (fs.existsSync(filePath)) {
      // If file exists, create a versioned copy
      const timestamp = Date.now();
      const versionedFileName = `${testName.toLowerCase().replace(/\s+/g, "-")}-${timestamp}.spec.ts`;
      finalFilePath = path.join(suiteDir, versionedFileName);
    }

    // Add metadata header to the test file
    const metadata = `/**
 * Auto-generated test from session
 * Source Session ID: ${sourceSessionId}
 * Generated: ${new Date().toISOString()}
 * Test Name: ${testName}
 * Suite: ${suite || "Default"}
 */

`;

    const fullContent = metadata + code;

    // Write test file
    fs.writeFileSync(finalFilePath, fullContent, "utf-8");

    // Get relative path for display
    const relativePath = path.relative(process.cwd(), finalFilePath);

    return NextResponse.json(
      {
        success: true,
        filePath: relativePath,
        absolutePath: finalFilePath,
        message: `Test saved successfully to ${relativePath}`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Test save error:", error);
    return NextResponse.json(
      {
        error: "Failed to save test",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
