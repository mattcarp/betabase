import { aomaStageAuthenticator } from "./aomaStageAuthenticator";

export interface CrawlRequest {
  url: string;
  options?: {
    formats?: ("markdown" | "html" | "summary")[];
    [key: string]: unknown;
  };
}

export interface CrawlResult {
  url: string;
  status: number;
  content?: unknown;
  metadata?: Record<string, unknown>;
}

export interface BatchCrawlSummary {
  total: number;
  succeeded: number;
  failed: number;
  results: CrawlResult[];
}

async function callFirecrawlApi(
  url: string,
  cookieHeader: string,
  baseUrl: string
): Promise<CrawlResult> {
  const res = await fetch(`${baseUrl}/api/firecrawl-crawl`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // The server route will forward these cookies to Firecrawl v2
      "x-forward-cookie": cookieHeader,
    },
    body: JSON.stringify({ url, options: { formats: ["markdown", "html", "summary"] } }),
  });

  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    // noop
  }

  return {
    url,
    status: res.status,
    content: data,
  };
}

export class AomaStagePageCrawler {
  private rateLimitMs: number;
  private baseUrl: string;

  constructor(rateLimitMs = 1500, baseUrl = "http://localhost:3000") {
    this.rateLimitMs = rateLimitMs;
    this.baseUrl = baseUrl;
  }

  async crawlPages(pages: string[]): Promise<BatchCrawlSummary> {
    const cookie = await aomaStageAuthenticator.getCookieHeader();
    const results: CrawlResult[] = [];

    for (const url of pages) {
      try {
        const result = await callFirecrawlApi(url, cookie, this.baseUrl);
        // If unauthorized, try to refresh auth once
        if (result.status === 401 || result.status === 403) {
          const refreshed = await aomaStageAuthenticator.ensureAuthenticated();
          const retry = await callFirecrawlApi(url, refreshed, this.baseUrl);
          results.push(retry);
        } else {
          results.push(result);
        }
      } catch (err) {
        results.push({ url, status: 0, metadata: { error: (err as Error).message } });
      }
      await this.delay(this.rateLimitMs);
    }

    const succeeded = results.filter((r) => r.status >= 200 && r.status < 400).length;
    const failed = results.length - succeeded;

    return {
      total: results.length,
      succeeded,
      failed,
      results,
    };
  }

  private async delay(ms: number): Promise<void> {
    await new Promise((r) => setTimeout(r, ms));
  }
}

export const aomaStagePageCrawler = new AomaStagePageCrawler();
