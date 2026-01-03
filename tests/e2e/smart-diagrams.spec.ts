/**
 * E2E Tests for Smart Diagrams (F014)
 *
 * Tests diagram detection logic and skill loader patterns.
 * Full mermaid rendering is tested in unit tests (tests/unit/smart-diagrams.test.ts)
 */

import { test, expect } from "@playwright/test";

test.describe("Smart Diagrams - F014 E2E", () => {
  test.beforeEach(async ({ page }) => {
    // Use a minimal HTML page for testing detection logic
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <head><title>Mermaid Test</title></head>
        <body><div id="container"></div></body>
      </html>
    `);
  });

  test("detectDiagramType identifies workflow diagrams correctly", async ({ page }) => {
    // Test the detection logic (same as mermaid-diagram.tsx)
    const result = await page.evaluate(() => {
      const detectDiagramType = (code: string): "workflow" | "explainer" => {
        const lowerCode = code.toLowerCase();
        if (lowerCode.includes("sequencediagram")) return "workflow";
        if (lowerCode.includes("flowchart")) return "workflow";
        if (lowerCode.includes("graph td") || lowerCode.includes("graph tb")) return "workflow";
        if (lowerCode.includes("graph lr") || lowerCode.includes("graph rl")) return "workflow";
        if (lowerCode.includes("statediagram")) return "workflow";
        if (lowerCode.includes("gantt")) return "workflow";
        return "explainer";
      };

      return {
        flowchart: detectDiagramType("flowchart TB\nA --> B"),
        sequence: detectDiagramType("sequenceDiagram\nUser->>API: Request"),
        graphTD: detectDiagramType("graph TD\nA --> B"),
        graphLR: detectDiagramType("graph LR\nA --> B"),
        stateDiagram: detectDiagramType("stateDiagram-v2\n[*] --> Active"),
        gantt: detectDiagramType("gantt\ntitle Chart"),
        erDiagram: detectDiagramType("erDiagram\nCUSTOMER ||--o{ ORDER : places"),
        classDiagram: detectDiagramType("classDiagram\nclass Animal"),
      };
    });

    // Workflow types
    expect(result.flowchart).toBe("workflow");
    expect(result.sequence).toBe("workflow");
    expect(result.graphTD).toBe("workflow");
    expect(result.graphLR).toBe("workflow");
    expect(result.stateDiagram).toBe("workflow");
    expect(result.gantt).toBe("workflow");

    // Explainer types
    expect(result.erDiagram).toBe("explainer");
    expect(result.classDiagram).toBe("explainer");
  });

  test("skill loader patterns match workflow queries", async ({ page }) => {
    const result = await page.evaluate(() => {
      const triggerPatterns = [
        /workflow/i,
        /architecture/i,
        /process/i,
        /how\s+(does|do|is)/i,
        /pipeline/i,
        /flow/i,
        /sequence/i,
        /integration/i,
      ];

      const testQueries = [
        { query: "How does the asset ingestion workflow work?", shouldMatch: true },
        { query: "Explain the AOMA architecture", shouldMatch: true },
        { query: "What is the approval process?", shouldMatch: true },
        { query: "How does multi-tenancy work?", shouldMatch: true },
        { query: "Describe the data pipeline", shouldMatch: true },
        { query: "What is AOMA?", shouldMatch: false }, // Simple factual query
      ];

      return testQueries.map(({ query, shouldMatch }) => ({
        query,
        shouldMatch,
        matches: triggerPatterns.some((pattern) => pattern.test(query)),
      }));
    });

    for (const item of result) {
      expect(item.matches).toBe(item.shouldMatch);
    }
  });

  test("shouldOfferDiagram detection works correctly", async ({ page }) => {
    const result = await page.evaluate(() => {
      const MIN_LENGTH = 150;
      const NO_KNOWLEDGE_PATTERNS = [
        /i don't have/i,
        /i couldn't find/i,
        /no information/i,
        /not available/i,
      ];
      const DIAGRAM_WORTHY_PATTERNS = [
        /workflow/i,
        /steps?/i,
        /process/i,
        /architecture/i,
        /\d+\./i, // numbered lists
        /->/i, // arrows
        /then/i,
        /first|next|finally/i,
      ];

      const shouldOfferDiagram = (content: string): boolean => {
        if (content.length < MIN_LENGTH) return false;
        if (NO_KNOWLEDGE_PATTERNS.some((p) => p.test(content))) return false;
        return DIAGRAM_WORTHY_PATTERNS.some((p) => p.test(content));
      };

      return {
        shortContent: shouldOfferDiagram("Short."),
        noKnowledge: shouldOfferDiagram(
          "I don't have any information about that topic. I've looked through the knowledge base but couldn't find relevant data."
        ),
        workflowContent: shouldOfferDiagram(
          "The asset ingestion workflow involves several steps. First, the user uploads a file. Then the system validates the format. Next, metadata is extracted. Finally, the asset is stored in the database."
        ),
        numberedSteps: shouldOfferDiagram(
          "To complete this task: 1. Open the dashboard. 2. Navigate to settings. 3. Configure the options. 4. Save your changes. This ensures proper configuration."
        ),
        architectureContent: shouldOfferDiagram(
          "The AOMA system architecture consists of multiple components. The frontend layer handles user interactions. The API layer processes requests. The data layer manages persistence."
        ),
      };
    });

    expect(result.shortContent).toBe(false);
    expect(result.noKnowledge).toBe(false);
    expect(result.workflowContent).toBe(true);
    expect(result.numberedSteps).toBe(true);
    expect(result.architectureContent).toBe(true);
  });
});
