import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, testName } = body;

    if (!code) {
      return NextResponse.json({ error: "Test code is required" }, { status: 400 });
    }

    // Create a temporary test file
    const tempDir = os.tmpdir();
    const tempFileName = `preview-test-${Date.now()}.spec.ts`;
    const tempFilePath = path.join(tempDir, tempFileName);

    // Write test code to temporary file
    fs.writeFileSync(tempFilePath, code, "utf-8");

    // Run Playwright test on the temporary file
    const startTime = Date.now();
    const testProcess = spawn("npx", ["playwright", "test", tempFilePath, "--reporter=line"], {
      cwd: process.cwd(),
      env: process.env,
    });

    let output = "";
    let errorOutput = "";

    testProcess.stdout.on("data", (data) => {
      output += data.toString();
    });

    testProcess.stderr.on("data", (data) => {
      errorOutput += data.toString();
    });

    // Wait for test to complete with timeout
    const result = await new Promise<any>((resolve) => {
      const timeout = setTimeout(() => {
        testProcess.kill();
        resolve({
          status: "timeout",
          duration: Date.now() - startTime,
          output: "Test execution timed out after 30 seconds",
        });
      }, 30000);

      testProcess.on("close", (code) => {
        clearTimeout(timeout);

        const duration = Date.now() - startTime;
        const status = code === 0 ? "passed" : "failed";

        resolve({
          status,
          duration,
          output: output || errorOutput,
          exitCode: code,
        });
      });

      testProcess.on("error", (error) => {
        clearTimeout(timeout);
        resolve({
          status: "error",
          duration: Date.now() - startTime,
          output: `Error executing test: ${error.message}`,
        });
      });
    });

    // Clean up temporary file
    try {
      fs.unlinkSync(tempFilePath);
    } catch (error) {
      console.error("Error cleaning up temp file:", error);
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Test preview error:", error);
    return NextResponse.json(
      {
        error: "Failed to preview test",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
