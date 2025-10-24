import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";
import { promises as fs } from "fs";
import path from "path";

// Store active executions in memory (in production, use Redis or database)
const activeExecutions = new Map();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { testSuite, testFiles, options } = body;

    const executionId = `exec_${Date.now()}`;
    const startTime = new Date().toISOString();

    console.log(`🚀 Starting Playwright test execution: ${executionId}`);

    // Prepare Playwright command arguments
    const playwrightArgs = ["playwright", "test", "--config=playwright.config.dashboard.ts"];

    // Add specific test files if provided
    if (testFiles && testFiles.length > 0) {
      playwrightArgs.push(...testFiles);
    }

    // Add parallel workers option
    if (options?.parallel && options?.workers) {
      playwrightArgs.push(`--workers=${options.workers}`);
    }

    // Ensure results directory exists
    const resultsDir = path.join(process.cwd(), ".playwright-results");
    try {
      await fs.mkdir(resultsDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }

    // Start Playwright test execution
    const testProcess = spawn("npx", playwrightArgs, {
      cwd: process.cwd(),
      env: {
        ...process.env,
        EXECUTION_ID: executionId,
        PLAYWRIGHT_SKIP_WEBSERVER: options?.skipWebServer ? "1" : "0",
      },
      stdio: ["ignore", "pipe", "pipe"],
    });

    // Store execution info
    activeExecutions.set(executionId, {
      process: testProcess,
      startTime,
      status: "running",
      testSuite,
      totalTests: 0, // Will be updated from reporter
      output: [],
      error: null,
    });

    // Capture stdout (our custom reporter output)
    testProcess.stdout?.on("data", (data) => {
      const execution = activeExecutions.get(executionId);
      if (execution) {
        const lines = data
          .toString()
          .split("\n")
          .filter((line: any) => line.trim());
        execution.output.push(...lines);

        // Parse JSON output from our custom reporter
        lines.forEach((line: any) => {
          try {
            const event = JSON.parse(line);
            if (event.type === "begin" && event.totalTests) {
              execution.totalTests = event.totalTests;
            }
          } catch (error) {
            // Not JSON, ignore
          }
        });
      }
    });

    // Capture stderr
    testProcess.stderr?.on("data", (data) => {
      const execution = activeExecutions.get(executionId);
      if (execution) {
        const errorMsg = data.toString();
        console.error(`❌ Playwright error for ${executionId}:`, errorMsg);
        execution.error = errorMsg;
      }
    });

    // Handle process completion
    testProcess.on("close", (code) => {
      const execution = activeExecutions.get(executionId);
      if (execution) {
        execution.status = code === 0 ? "completed" : "failed";
        execution.endTime = new Date().toISOString();
        console.log(`✅ Playwright execution ${executionId} finished with code ${code}`);
      }
    });

    // Handle process errors
    testProcess.on("error", (error) => {
      const execution = activeExecutions.get(executionId);
      if (execution) {
        execution.status = "error";
        execution.error = error.message;
        execution.endTime = new Date().toISOString();
      }
      console.error(`❌ Playwright process error for ${executionId}:`, error);
    });

    const response = {
      executionId,
      status: "running",
      startTime,
      testSuite,
      totalTests: 0, // Will be updated as tests are discovered
      message: "Playwright test execution started successfully",
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Test execution error:", error);
    return NextResponse.json({ error: "Failed to start test execution" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const executionId = searchParams.get("executionId");

    if (!executionId) {
      return NextResponse.json({ error: "Execution ID is required" }, { status: 400 });
    }

    // Get execution from memory
    const execution = activeExecutions.get(executionId);

    if (!execution) {
      // Try to load from file system
      try {
        const resultsPath = path.join(process.cwd(), ".playwright-results", `${executionId}.json`);
        const resultData = await fs.readFile(resultsPath, "utf8");
        const result = JSON.parse(resultData);

        return NextResponse.json(
          {
            executionId,
            status: result.status === "passed" ? "completed" : "failed",
            startTime: result.startTime,
            endTime: result.endTime,
            duration: result.duration,
            results: result.stats,
            progress: 100,
            testResults: result.results || [],
          },
          { status: 200 }
        );
      } catch (error) {
        return NextResponse.json({ error: "Execution not found" }, { status: 404 });
      }
    }

    // Calculate progress
    let progress = 0;
    let currentStats = { total: 0, passed: 0, failed: 0, skipped: 0, running: 0 };

    // Parse latest stats from output
    for (const line of execution.output.slice(-10)) {
      // Check last 10 lines
      try {
        const event = JSON.parse(line);
        if (event.stats) {
          currentStats = event.stats;
          break;
        }
      } catch (error) {
        // Not JSON, continue
      }
    }

    if (currentStats.total > 0) {
      progress = Math.round(
        ((currentStats.passed + currentStats.failed + currentStats.skipped) / currentStats.total) *
          100
      );
    }

    const status = {
      executionId,
      status: execution.status,
      startTime: execution.startTime,
      endTime: execution.endTime,
      duration: execution.endTime
        ? Math.floor(
            (new Date(execution.endTime).getTime() - new Date(execution.startTime).getTime()) / 1000
          )
        : Math.floor((Date.now() - new Date(execution.startTime).getTime()) / 1000),
      results: currentStats,
      progress,
      error: execution.error,
      recentOutput: execution.output.slice(-5), // Last 5 log lines
    };

    return NextResponse.json(status, { status: 200 });
  } catch (error) {
    console.error("Error fetching execution status:", error);
    return NextResponse.json({ error: "Failed to fetch execution status" }, { status: 500 });
  }
}
