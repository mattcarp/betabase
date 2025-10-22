import { NextRequest, NextResponse } from "next/server";

interface TestResult {
  id: string;
  name: string;
  suite: string;
  status: "passed" | "failed" | "skipped";
  duration: number;
  timestamp: string;
  error?: {
    message: string;
    stack: string;
    expected?: string;
    actual?: string;
  };
  logs?: string[];
  screenshots?: string[];
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const executionId = searchParams.get("executionId");
    const suite = searchParams.get("suite");
    const status = searchParams.get("status");

    // Mock test results data
    let results: TestResult[] = [
      {
        id: "1",
        name: "Should authenticate with valid credentials",
        suite: "Authentication",
        status: "passed",
        duration: 1234,
        timestamp: new Date().toISOString(),
        logs: [
          "Starting authentication test...",
          "Navigating to login page",
          "Entering credentials",
          "Submitting form",
          "Authentication successful",
        ],
      },
      {
        id: "2",
        name: "Should reject invalid credentials",
        suite: "Authentication",
        status: "failed",
        duration: 892,
        timestamp: new Date().toISOString(),
        error: {
          message: "Expected authentication to fail but it succeeded",
          stack: `Error: Expected authentication to fail but it succeeded
    at Context.<anonymous> (tests/auth.spec.ts:45:15)
    at processTicksAndRejections (internal/process/task_queues.js:97:5)`,
          expected: "Authentication failed",
          actual: "Authentication successful",
        },
        logs: [
          "Starting authentication test...",
          "Navigating to login page",
          "Entering invalid credentials",
          "Submitting form",
          "ERROR: Unexpected authentication success",
        ],
        screenshots: ["screenshot-1.png", "screenshot-2.png"],
      },
      {
        id: "3",
        name: "Should handle magic link authentication",
        suite: "Authentication",
        status: "passed",
        duration: 3456,
        timestamp: new Date().toISOString(),
      },
      {
        id: "4",
        name: "Should stream chat responses",
        suite: "Chat Interface",
        status: "passed",
        duration: 2100,
        timestamp: new Date().toISOString(),
      },
      {
        id: "5",
        name: "Should handle file uploads",
        suite: "Chat Interface",
        status: "failed",
        duration: 1500,
        timestamp: new Date().toISOString(),
        error: {
          message: "File upload failed: Network timeout",
          stack: `Error: File upload failed: Network timeout
    at uploadFile (tests/chat.spec.ts:120:10)
    at Context.<anonymous> (tests/chat.spec.ts:125:5)`,
        },
      },
      {
        id: "6",
        name: "Should display error boundaries correctly",
        suite: "Error Handling",
        status: "skipped",
        duration: 0,
        timestamp: new Date().toISOString(),
      },
    ];

    // Filter by suite if provided
    if (suite) {
      results = results.filter((r) => r.suite === suite);
    }

    // Filter by status if provided
    if (status) {
      results = results.filter((r) => r.status === status);
    }

    // Group results by suite
    const groupedResults = results.reduce(
      (acc, result) => {
        if (!acc[result.suite]) {
          acc[result.suite] = {
            suite: result.suite,
            tests: [],
            stats: {
              total: 0,
              passed: 0,
              failed: 0,
              skipped: 0,
            },
          };
        }
        acc[result.suite].tests.push(result);
        acc[result.suite].stats.total++;
        acc[result.suite].stats[result.status]++;
        return acc;
      },
      {} as Record<string, any>
    );

    return NextResponse.json(
      {
        executionId,
        totalResults: results.length,
        results: groupedResults,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching test results:", error);
    return NextResponse.json({ error: "Failed to fetch test results" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { executionId, results } = body;

    // In production, this would save results to database
    // For now, just return success
    return NextResponse.json(
      {
        message: "Test results saved successfully",
        executionId,
        savedCount: results?.length || 0,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error saving test results:", error);
    return NextResponse.json({ error: "Failed to save test results" }, { status: 500 });
  }
}
