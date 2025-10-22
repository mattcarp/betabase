import { NextRequest, NextResponse } from "next/server";
import sonyMusicJiraCrawler from "@/src/services/sonyMusicJiraCrawler";

export const dynamic = "force-dynamic";

type Payload = {
  projects?: string[];
  sinceDays?: number;
};

let lastSummary: { issuesCrawled: number; vectorsUpserted: number; at: string } | null = null;

// POST /api/sony-music-jira-crawl
// Uses Playwright to login to Jira UI, execute JQL queries, and scrape ticket data
// Note: Requires HITL (Human-in-the-Loop) for 2FA/MFA if enabled
export async function POST(req: NextRequest) {
  let payload: Payload = {};
  try {
    payload = await req.json();
  } catch (e) {
    // Ignore body parse errors; treat as empty body
  }

  try {
    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        (async () => {
          try {
            controller.enqueue(
              encoder.encode(
                JSON.stringify({
                  event: "start",
                  at: new Date().toISOString(),
                  projects: payload.projects,
                  sinceDays: payload.sinceDays,
                  method: "Playwright (UI login + JQL search)",
                }) + "\n"
              )
            );

            const result = await sonyMusicJiraCrawler.crawlProjects({
              projects: payload.projects,
              sinceDays: payload.sinceDays,
              onProgress: (evt: any) => {
                try {
                  controller.enqueue(
                    encoder.encode(JSON.stringify({ event: "progress", ...evt }) + "\n")
                  );
                } catch {}
              },
            });

            controller.enqueue(
              encoder.encode(JSON.stringify({ event: "complete", result }) + "\n")
            );
            lastSummary = {
              issuesCrawled: result.issuesCrawled,
              vectorsUpserted: result.vectorsUpserted,
              at: new Date().toISOString(),
            };
          } catch (error: any) {
            controller.enqueue(
              encoder.encode(
                JSON.stringify({
                  event: "error",
                  message: error?.message || "JIRA crawl failed",
                }) + "\n"
              )
            );
          } finally {
            controller.close();
          }
        })();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "application/x-ndjson; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch (error: any) {
    console.error("Sony Music JIRA crawl error:", error);
    return NextResponse.json(
      { error: "Failed to crawl Sony Music JIRA", details: error?.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  if (!lastSummary) return NextResponse.json({ issuesCrawled: 0, vectorsUpserted: 0, at: null });
  return NextResponse.json(lastSummary);
}
