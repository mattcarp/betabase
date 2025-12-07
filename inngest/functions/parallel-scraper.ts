/**
 * Parallel Page Scraper - Worker Function
 *
 * This function handles individual page scraping as a worker.
 * The orchestrator can fan-out to multiple instances of this worker
 * for true parallel processing.
 *
 * Each worker:
 * - Processes a single page
 * - Extracts content and links
 * - Handles its own retries independently
 * - Reports back via events
 */
import { inngest } from "../client";

// Simulated scraping with realistic delays and occasional failures
const simulateScrape = async (
  url: string
): Promise<{
  success: boolean;
  content?: string;
  links?: string[];
  error?: string;
}> => {
  // Simulate network latency
  await new Promise((resolve) => setTimeout(resolve, 800 + Math.random() * 1200));

  // Simulate occasional failures (10% chance) for testing retry logic
  if (Math.random() < 0.1) {
    throw new Error(`Simulated network timeout for ${url}`);
  }

  // Generate mock content
  const mockContent = `
# Page Content for ${url}

This is simulated markdown content extracted from the page.

## Section 1
Lorem ipsum dolor sit amet, consectetur adipiscing elit.

## Section 2  
Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.

## Related Links
- [Link 1](/related/page-1)
- [Link 2](/related/page-2)
- [Document](/docs/spec.pdf)
  `.trim();

  return {
    success: true,
    content: mockContent,
    links: ["/related/page-1", "/related/page-2", "/docs/spec.pdf"],
  };
};

export const pageScraperWorker = inngest.createFunction(
  {
    id: "page-scraper-worker",
    name: "Page Scraper Worker",
    retries: 3,
    // Rate limiting to be respectful to target servers
    rateLimit: {
      limit: 10,
      period: "10s",
    },
  },
  { event: "aoma/page.discovered" },
  async ({ event, step }) => {
    const { url, depth, parentUrl, crawlId } = event.data;

    // Step 1: Validate and prepare
    const prepared = await step.run("prepare-scrape", async () => {
      // Could check robots.txt, rate limits, etc.
      return {
        url,
        depth,
        crawlId,
        preparedAt: new Date().toISOString(),
      };
    });

    // Step 2: Fetch and parse the page
    const scraped = await step.run("scrape-page", async () => {
      const result = await simulateScrape(url);

      if (!result.success) {
        throw new Error(result.error || "Unknown scrape error");
      }

      return {
        url,
        contentLength: result.content?.length || 0,
        linkCount: result.links?.length || 0,
        links: result.links || [],
        scrapedAt: new Date().toISOString(),
      };
    });

    // Step 3: Extract document links and emit events for each
    const documentLinks = scraped.links.filter((link) =>
      /\.(pdf|docx?|xlsx?|pptx?)(\?|$)/i.test(link)
    );

    if (documentLinks.length > 0) {
      await step.run("emit-document-events", async () => {
        // In a real implementation, you'd emit events for each document
        console.log(`[Worker] Found ${documentLinks.length} documents on ${url}`);
        return { documentsFound: documentLinks };
      });
    }

    // Step 4: Save results (mock - would write to filesystem or DB)
    const saved = await step.run("save-results", async () => {
      // Simulate saving to output directory
      await new Promise((resolve) => setTimeout(resolve, 100));

      return {
        savedTo: `tmp/crawl/${crawlId}/${url.replace(/[^a-z0-9]/gi, "_")}.json`,
        savedAt: new Date().toISOString(),
      };
    });

    return {
      success: true,
      url,
      crawlId,
      depth,
      parentUrl,
      contentLength: scraped.contentLength,
      linksFound: scraped.linkCount,
      documentsFound: documentLinks.length,
      savedTo: saved.savedTo,
      timing: {
        prepared: prepared.preparedAt,
        scraped: scraped.scrapedAt,
        saved: saved.savedAt,
      },
    };
  }
);

/**
 * Document Processor Worker
 *
 * Handles extraction of content from documents (PDF, DOCX, etc.)
 */
export const documentProcessorWorker = inngest.createFunction(
  {
    id: "document-processor-worker",
    name: "Document Processor Worker",
    retries: 2,
  },
  { event: "aoma/document.found" },
  async ({ event, step }) => {
    const { url, type, sourcePageUrl, crawlId } = event.data;

    // Step 1: Download document
    const downloaded = await step.run("download-document", async () => {
      // Simulate download
      await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 2000));

      return {
        url,
        type,
        sizeBytes: Math.floor(Math.random() * 500000) + 10000,
        downloadedAt: new Date().toISOString(),
      };
    });

    // Step 2: Extract content based on type
    const extracted = await step.run("extract-content", async () => {
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Simulate different extraction methods
      const extractionMethod =
        {
          pdf: "pdf-parse",
          docx: "mammoth",
          xlsx: "xlsx",
          pptx: "pptx-parser",
          doc: "mammoth-legacy",
          xls: "xlsx-legacy",
        }[type] || "unknown";

      return {
        method: extractionMethod,
        wordCount: Math.floor(Math.random() * 5000) + 100,
        pageCount: type === "pdf" ? Math.floor(Math.random() * 20) + 1 : null,
        hasImages: Math.random() > 0.5,
        extractedAt: new Date().toISOString(),
      };
    });

    // Step 3: Convert to markdown
    const markdown = await step.run("convert-to-markdown", async () => {
      return {
        markdownLength: extracted.wordCount * 6, // Rough estimate
        savedTo: `tmp/crawl/${crawlId}/docs/${url.split("/").pop()}.md`,
        convertedAt: new Date().toISOString(),
      };
    });

    return {
      success: true,
      document: {
        url,
        type,
        sourcePageUrl,
      },
      extraction: extracted,
      output: markdown,
      crawlId,
    };
  }
);
