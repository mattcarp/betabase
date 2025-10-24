import { NextRequest } from "next/server";
import { spawn } from "child_process";

/**
 * WebSocket API for Real-time Playwright Test Updates
 * Streams live test execution events to the Test Dashboard
 */

// In-memory store for WebSocket connections (in production, use Redis pub/sub)
// const connections = new Set<WebSocket>();
// const executionSubscriptions = new Map<string, Set<WebSocket>>();

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const executionId = searchParams.get("executionId");

  if (!executionId) {
    return new Response("Execution ID is required", { status: 400 });
  }

  // Check if the request is for WebSocket upgrade
  const upgradeHeader = request.headers.get("upgrade");
  if (upgradeHeader !== "websocket") {
    return new Response("Expected WebSocket upgrade", { status: 400 });
  }

  try {
    // Create WebSocket connection (Next.js 13+ approach)
    // const _webSocketResponse = new Response(null, {
    //   status: 101,
    //   headers: {
    //     Upgrade: "websocket",
    //     Connection: "Upgrade",
    //   },
    // });

    // In a real implementation, you'd handle WebSocket protocol here
    // For now, we'll simulate the WebSocket functionality with Server-Sent Events

    return new Response(
      new ReadableStream({
        start(controller) {
          console.log(`🔌 WebSocket connection established for execution: ${executionId}`);

          // Send initial connection message
          const initialMessage = JSON.stringify({
            type: "connection",
            executionId,
            timestamp: new Date().toISOString(),
            message: "Connected to test execution stream",
          });

          controller.enqueue(`data: ${initialMessage}\n\n`);

          // Set up cleanup
          const cleanup = () => {
            controller.close();
          };

          // Clean up after 5 minutes of inactivity
          setTimeout(cleanup, 5 * 60 * 1000);
        },
      }),
      {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      }
    );
  } catch (error) {
    console.error("WebSocket connection error:", error);
    return new Response("WebSocket connection failed", { status: 500 });
  }
}

/**
 * Server-Sent Events endpoint for real-time test updates
 * Alternative to WebSocket for broader browser compatibility
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, executionId, testFiles } = body;

    if (action === "stream") {
      return new Response(
        new ReadableStream({
          start(controller) {
            console.log(`📡 Starting test stream for execution: ${executionId}`);

            // Start Playwright with streaming output
            const playwrightArgs = [
              "playwright",
              "test",
              "--config=playwright.config.dashboard.ts",
              "--reporter=./playwright-dashboard-reporter.js",
            ];

            if (testFiles && testFiles.length > 0) {
              playwrightArgs.push(...testFiles);
            }

            const testProcess = spawn("npx", playwrightArgs, {
              cwd: process.cwd(),
              env: { ...process.env, EXECUTION_ID: executionId },
              stdio: ["ignore", "pipe", "pipe"],
            });

            // Stream stdout events
            testProcess.stdout?.on("data", (data) => {
              const lines = data
                .toString()
                .split("\n")
                .filter((line: any) => line.trim());

              lines.forEach((line: any) => {
                try {
                  // Parse JSON events from our custom reporter
                  const event = JSON.parse(line);
                  const message = `data: ${JSON.stringify({
                    ...event,
                    timestamp: new Date().toISOString(),
                  })}\n\n`;

                  controller.enqueue(message);
                } catch (error) {
                  // Not JSON, send as raw log
                  const logMessage = `data: ${JSON.stringify({
                    type: "log",
                    executionId,
                    message: line,
                    timestamp: new Date().toISOString(),
                  })}\n\n`;

                  controller.enqueue(logMessage);
                }
              });
            });

            // Stream stderr events
            testProcess.stderr?.on("data", (data) => {
              const errorMessage = `data: ${JSON.stringify({
                type: "error",
                executionId,
                message: data.toString(),
                timestamp: new Date().toISOString(),
              })}\n\n`;

              controller.enqueue(errorMessage);
            });

            // Handle completion
            testProcess.on("close", (code) => {
              const completionMessage = `data: ${JSON.stringify({
                type: "complete",
                executionId,
                exitCode: code,
                status: code === 0 ? "success" : "failed",
                timestamp: new Date().toISOString(),
              })}\n\n`;

              controller.enqueue(completionMessage);
              controller.close();
            });

            // Handle errors
            testProcess.on("error", (error) => {
              const errorMessage = `data: ${JSON.stringify({
                type: "process_error",
                executionId,
                error: error.message,
                timestamp: new Date().toISOString(),
              })}\n\n`;

              controller.enqueue(errorMessage);
              controller.close();
            });
          },
        }),
        {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Cache-Control",
          },
        }
      );
    }

    return new Response("Invalid action", { status: 400 });
  } catch (error) {
    console.error("Stream error:", error);
    return new Response("Stream failed", { status: 500 });
  }
}
