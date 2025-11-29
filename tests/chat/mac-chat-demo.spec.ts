import { test, expect } from '../fixtures/base-test';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";
const IS_LOCAL_RUN = BASE_URL.includes("localhost") || BASE_URL.includes("127.0.0.1");

const DEMO_SCENARIOS = [
  {
    question: "How does AOMA handle autonomy overrides for critical releases?",
    answer:
      "Autonomy overrides follow a three-tier approval matrix. Tier 1 requests escalate to the Duty Manager, Tier 2 invokes the Global Control Room, and Tier 3 notifies the GMAC board before execution. [1]",
    snippet: "three-tier approval matrix",
    sources: [
      {
        title: "AOMA Autonomy Manual",
        url: "https://wiki.aoma.global/autonomy-overrides",
        description: "Defines approvals and telemetry hooks for override flows.",
      },
    ],
    webPreviews: [
      {
        title: "Override Control Room",
        description: "Live telemetry for the override pipeline.",
        url: "https://wiki.aoma.global/control-room",
      },
    ],
  },
  {
    question: "Summarize the AOMA performance tiers for chat orchestration.",
    answer:
      "AOMA routes chat traffic through Bronze, Silver, and Platinum lanes. Bronze keeps latency < 4s with lightweight embeddings, Silver enables full MCP tool access, and Platinum adds dual-write observability + human-in-the-loop sign off. [1]",
    snippet: "Bronze, Silver, and Platinum",
    sources: [
      {
        title: "AOMA Performance Playbook",
        url: "https://wiki.aoma.global/performance-tiers",
        description: "Latency budgets, error budgets, and MCP routing hints.",
      },
    ],
    webPreviews: [
      {
        title: "Performance Tier Dashboard",
        description: "Live SLA view for Bronze/Silver/Platinum.",
        url: "https://metrics.aoma.global/tiers",
      },
    ],
  },
  {
    question: "What review steps are required before shipping curated knowledge to AOMA?",
    answer:
      "Each curated entry flows through semantic diffing, MAC visual verification, and Fiona HITL approval. Entries missing inline citations are auto-rejected. [1]",
    snippet: "semantic diffing",
    sources: [
      {
        title: "Curation Runbook",
        url: "https://wiki.aoma.global/curation",
        description: "Fiona review checklist + escalation contacts.",
      },
    ],
    webPreviews: [
      {
        title: "Curation Checklist",
        description: "Live HITL tracker with reviewer assignments.",
        url: "https://hitl.aoma.global/checklist",
      },
    ],
  },
];

test.describe("MAC Chat Demo Experience", () => {
  test.skip(!IS_LOCAL_RUN, "MAC chat demo spec requires a local dev server with the harness enabled.");
  test("renders MAC shell and handles curated QA flows", async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForSelector('[data-testid="mac-chat-panel"]');

    // Verify MAC shell + tabs
    await expect(page.getByTestId("mac-chat-header")).toBeVisible();
    await expect(page.getByTestId("mac-mode-tabs")).toBeVisible();

    for (const scenario of DEMO_SCENARIOS) {
      // Type the question for UX parity (do not submit to avoid hitting live LLM)
      const input = page.locator('[data-testid="mac-chat-input"] textarea').first();
      await input.fill(scenario.question);

      // Use the harness to inject deterministic user + assistant messages
      await page.evaluate((payload) => {
        window.dispatchEvent(
          new CustomEvent("siam:test:simulate-chat", {
            detail: payload,
          })
        );
      }, scenario);

      // Ensure the assistant response rendered with inline citation + snippet
      await expect(page.locator(`text=${scenario.snippet}`).last()).toBeVisible();
      await expect(page.locator("text=[1]").last()).toBeVisible();

      // Sources drawer should list the curated citation
      await expect(page.locator('[data-testid="mac-chat-sources"]').last()).toContainText(
        scenario.sources[0].title
      );

      // Action buttons + web preview tiles should be available
      await expect(page.locator('[data-testid="mac-chat-actions"]').last()).toBeVisible();
      await expect(page.locator('[data-testid="mac-chat-web-preview"]').last()).toBeVisible();
    }

    // Tab switching + message persistence
    await page.getByTestId("mac-tab-curate").click();
    await expect(page.getByText("Knowledge Curation")).toBeVisible();
    await page.getByTestId("mac-tab-test").click();
    await expect(page.getByText("Advanced Testing & Quality Assurance")).toBeVisible();
    await page.getByTestId("mac-tab-chat").click();

    // Ensure all three demo answers remain visible
    await expect(page.locator('[data-testid="mac-chat-sources"]')).toHaveCount(DEMO_SCENARIOS.length);

    // Capture screenshot for the demo checklist
    const screenshotPath = test.info().outputPath("mac-chat-demo.png");
    await page.screenshot({ path: screenshotPath, fullPage: true });
  });
});

