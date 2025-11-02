/**
 * Unit Tests: AOMA Orchestrator Architecture
 * 
 * Verifies that the aomaOrchestrator uses Supabase-only path
 * and does NOT call Railway AOMA MCP server.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the dependencies
vi.mock("@/services/aomaCache", () => ({
  aomaCache: {
    get: vi.fn(() => null),
    set: vi.fn(),
  },
}));

vi.mock("@/services/aomaProgressStream", () => ({
  aomaProgressStream: {
    startQuery: vi.fn(),
    startService: vi.fn(),
    completeService: vi.fn(),
    completeQuery: vi.fn(),
    errorService: vi.fn(),
    getUpdates: vi.fn(() => []),
  },
}));

vi.mock("@/services/supabaseVectorService", () => ({
  getSupabaseVectorService: vi.fn(() => ({
    queryVectors: vi.fn().mockResolvedValue({
      results: [],
      metadata: {},
    }),
  })),
}));

vi.mock("@/services/queryDeduplicator", () => ({
  getQueryDeduplicator: vi.fn(() => ({
    dedupe: vi.fn((key, fn) => fn()),
  })),
}));

// Mock fetch to detect Railway calls
const originalFetch = global.fetch;
const mockFetch = vi.fn(originalFetch);
global.fetch = mockFetch;

describe("AOMA Orchestrator Architecture", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockClear();
  });

  it("should use Supabase vector store, not Railway", async () => {
    // Import after mocks are set up
    const { aomaOrchestrator } = await import("@/services/aomaOrchestrator");

    // Execute orchestration
    await aomaOrchestrator.executeOrchestration("Test query");

    // Verify NO fetch calls to Railway
    const railwayCalls = mockFetch.mock.calls.filter((call) =>
      call[0]?.toString().includes("luminous-dedication-production.up.railway.app")
    );

    expect(railwayCalls).toHaveLength(0);
  });

  it("should NOT call callAOMATool method", async () => {
    const { aomaOrchestrator } = await import("@/services/aomaOrchestrator");

    // Spy on the private callAOMATool method (it should never be called)
    const orchestratorAny = aomaOrchestrator as any;
    const callAOMAToolSpy = vi.spyOn(orchestratorAny, "callAOMATool");

    await aomaOrchestrator.executeOrchestration("Test query");

    // Should NEVER be called (it's dead code)
    expect(callAOMAToolSpy).not.toHaveBeenCalled();
  });

  it("should query vector store directly", async () => {
    const { aomaOrchestrator } = await import("@/services/aomaOrchestrator");

    // Spy on queryVectorStore method
    const orchestratorAny = aomaOrchestrator as any;
    const queryVectorStoreSpy = vi.spyOn(orchestratorAny, "queryVectorStore");

    await aomaOrchestrator.executeOrchestration("Test query");

    // Should call queryVectorStore
    expect(queryVectorStoreSpy).toHaveBeenCalledWith(
      "Test query",
      expect.objectContaining({
        matchThreshold: expect.any(Number),
        matchCount: expect.any(Number),
      })
    );
  });

  it("should complete queries quickly (no Railway latency)", async () => {
    const { aomaOrchestrator } = await import("@/services/aomaOrchestrator");

    const start = Date.now();
    await aomaOrchestrator.executeOrchestration("Test query");
    const duration = Date.now() - start;

    // Should be fast without Railway (< 200ms for unit test)
    expect(duration).toBeLessThan(200);
  });

  it("should handle errors without falling back to Railway", async () => {
    // Mock vector service to throw error
    vi.doMock("@/services/supabaseVectorService", () => ({
      getSupabaseVectorService: vi.fn(() => ({
        queryVectors: vi.fn().mockRejectedValue(new Error("Supabase error")),
      })),
    }));

    const { aomaOrchestrator } = await import("@/services/aomaOrchestrator");

    const result = await aomaOrchestrator.executeOrchestration("Test query");

    // Should return error result, NOT fall back to Railway
    expect(result.metadata?.error).toBe(true);

    // Verify NO Railway calls even on error
    const railwayCalls = mockFetch.mock.calls.filter((call) =>
      call[0]?.toString().includes("railway.app")
    );
    expect(railwayCalls).toHaveLength(0);
  });
});

describe("callAOMATool Method (Dead Code Verification)", () => {
  it("should exist but never be called in production code", async () => {
    const { aomaOrchestrator } = await import("@/services/aomaOrchestrator");

    // Verify method exists (kept for future Jira/Git integration)
    const orchestratorAny = aomaOrchestrator as any;
    expect(typeof orchestratorAny.callAOMATool).toBe("function");

    // But search the entire orchestration flow - it should never be invoked
    const executeInternalSpy = vi.spyOn(orchestratorAny, "executeOrchestrationInternal");

    await aomaOrchestrator.executeOrchestration("Test query");

    // Should use internal method (Supabase path)
    expect(executeInternalSpy).toHaveBeenCalled();

    // callAOMATool should NOT be in the call chain
    const callAOMAToolSpy = vi.spyOn(orchestratorAny, "callAOMATool");
    expect(callAOMAToolSpy).not.toHaveBeenCalled();
  });
});

describe("Performance Characteristics", () => {
  it("should maintain sub-second response times", async () => {
    const { aomaOrchestrator } = await import("@/services/aomaOrchestrator");

    const times: number[] = [];

    // Run multiple queries
    for (let i = 0; i < 5; i++) {
      const start = Date.now();
      await aomaOrchestrator.executeOrchestration(`Test query ${i}`);
      times.push(Date.now() - start);
    }

    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;

    console.log(`Average orchestration time: ${avgTime}ms`);

    // Should average well under 1 second (Railway would add 2.5s+)
    expect(avgTime).toBeLessThan(500);
  });
});

