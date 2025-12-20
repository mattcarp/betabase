/**
 * Unit tests for LatencyWaterfall component
 */

import { describe, it, expect } from "vitest";
import { extractLatencySegments, type LatencySegment } from "@/components/ui/LatencyWaterfall";

describe("LatencyWaterfall", () => {
  describe("extractLatencySegments", () => {
    it("should extract segments from valid observations", () => {
      const observations = [
        {
          id: "obs1",
          type: "GENERATION",
          name: "LLM Call",
          startTime: "2025-01-20T10:00:00.000Z",
          endTime: "2025-01-20T10:00:02.500Z",
        },
        {
          id: "obs2",
          type: "SPAN",
          name: "Vector Search",
          startTime: "2025-01-20T10:00:00.000Z",
          endTime: "2025-01-20T10:00:00.300Z",
        },
        {
          id: "obs3",
          type: "SPAN",
          name: "Embedding Generation",
          startTime: "2025-01-20T10:00:00.000Z",
          endTime: "2025-01-20T10:00:00.150Z",
        },
      ];

      const segments = extractLatencySegments(observations);

      expect(segments).toHaveLength(3);

      // LLM segment
      expect(segments[0].type).toBe("llm");
      expect(segments[0].name).toBe("LLM Call");
      expect(segments[0].duration).toBe(2500);

      // Vector search segment
      expect(segments[1].type).toBe("vector");
      expect(segments[1].name).toBe("Vector Search");
      expect(segments[1].duration).toBe(300);

      // Embedding segment
      expect(segments[2].type).toBe("embedding");
      expect(segments[2].name).toBe("Embedding Generation");
      expect(segments[2].duration).toBe(150);
    });

    it("should classify GENERATION as llm type", () => {
      const observations = [
        {
          id: "obs1",
          type: "GENERATION",
          name: "Claude 3.5 Sonnet",
          startTime: "2025-01-20T10:00:00.000Z",
          endTime: "2025-01-20T10:00:01.000Z",
        },
      ];

      const segments = extractLatencySegments(observations);
      expect(segments[0].type).toBe("llm");
    });

    it("should classify embedding spans correctly", () => {
      const observations = [
        {
          id: "obs1",
          type: "SPAN",
          name: "Generate Embeddings",
          startTime: "2025-01-20T10:00:00.000Z",
          endTime: "2025-01-20T10:00:00.100Z",
        },
        {
          id: "obs2",
          type: "SPAN",
          name: "text-embedding-3-small",
          startTime: "2025-01-20T10:00:00.000Z",
          endTime: "2025-01-20T10:00:00.100Z",
        },
      ];

      const segments = extractLatencySegments(observations);
      expect(segments[0].type).toBe("embedding");
      expect(segments[1].type).toBe("embedding");
    });

    it("should classify vector search spans correctly", () => {
      const observations = [
        {
          id: "obs1",
          type: "SPAN",
          name: "Vector Search",
          startTime: "2025-01-20T10:00:00.000Z",
          endTime: "2025-01-20T10:00:00.200Z",
        },
        {
          id: "obs2",
          type: "SPAN",
          name: "Retrieval Query",
          startTime: "2025-01-20T10:00:00.000Z",
          endTime: "2025-01-20T10:00:00.150Z",
        },
      ];

      const segments = extractLatencySegments(observations);
      expect(segments[0].type).toBe("vector");
      expect(segments[1].type).toBe("vector");
    });

    it("should classify unknown spans as other type", () => {
      const observations = [
        {
          id: "obs1",
          type: "SPAN",
          name: "Custom Operation",
          startTime: "2025-01-20T10:00:00.000Z",
          endTime: "2025-01-20T10:00:00.100Z",
        },
        {
          id: "obs2",
          type: "EVENT",
          name: "Some Event",
          startTime: "2025-01-20T10:00:00.000Z",
          endTime: "2025-01-20T10:00:00.050Z",
        },
      ];

      const segments = extractLatencySegments(observations);
      expect(segments[0].type).toBe("other");
      expect(segments[1].type).toBe("other");
    });

    it("should skip observations without timestamps", () => {
      const observations = [
        {
          id: "obs1",
          type: "GENERATION",
          name: "Missing timestamps",
        },
        {
          id: "obs2",
          type: "SPAN",
          name: "Valid",
          startTime: "2025-01-20T10:00:00.000Z",
          endTime: "2025-01-20T10:00:00.100Z",
        },
      ];

      const segments = extractLatencySegments(observations);
      expect(segments).toHaveLength(1);
      expect(segments[0].name).toBe("Valid");
    });

    it("should skip observations with negative or zero duration", () => {
      const observations = [
        {
          id: "obs1",
          type: "SPAN",
          name: "Same time",
          startTime: "2025-01-20T10:00:00.000Z",
          endTime: "2025-01-20T10:00:00.000Z",
        },
        {
          id: "obs2",
          type: "SPAN",
          name: "End before start",
          startTime: "2025-01-20T10:00:01.000Z",
          endTime: "2025-01-20T10:00:00.000Z",
        },
        {
          id: "obs3",
          type: "SPAN",
          name: "Valid",
          startTime: "2025-01-20T10:00:00.000Z",
          endTime: "2025-01-20T10:00:00.100Z",
        },
      ];

      const segments = extractLatencySegments(observations);
      expect(segments).toHaveLength(1);
      expect(segments[0].name).toBe("Valid");
    });

    it("should handle empty observations array", () => {
      const segments = extractLatencySegments([]);
      expect(segments).toEqual([]);
    });

    it("should include metadata in segments", () => {
      const observations = [
        {
          id: "obs1",
          type: "GENERATION",
          name: "LLM",
          level: "DEFAULT",
          startTime: "2025-01-20T10:00:00.000Z",
          endTime: "2025-01-20T10:00:01.000Z",
        },
      ];

      const segments = extractLatencySegments(observations);
      expect(segments[0].metadata).toEqual({
        id: "obs1",
        type: "GENERATION",
        level: "DEFAULT",
      });
    });

    it("should calculate correct durations in milliseconds", () => {
      const observations = [
        {
          id: "obs1",
          type: "SPAN",
          name: "100ms",
          startTime: "2025-01-20T10:00:00.000Z",
          endTime: "2025-01-20T10:00:00.100Z",
        },
        {
          id: "obs2",
          type: "SPAN",
          name: "1 second",
          startTime: "2025-01-20T10:00:00.000Z",
          endTime: "2025-01-20T10:00:01.000Z",
        },
        {
          id: "obs3",
          type: "SPAN",
          name: "1.5 seconds",
          startTime: "2025-01-20T10:00:00.000Z",
          endTime: "2025-01-20T10:00:01.500Z",
        },
      ];

      const segments = extractLatencySegments(observations);
      expect(segments[0].duration).toBe(100);
      expect(segments[1].duration).toBe(1000);
      expect(segments[2].duration).toBe(1500);
    });

    it("should handle realistic RAG pipeline", () => {
      const observations = [
        {
          id: "emb1",
          type: "SPAN",
          name: "text-embedding-3-small",
          startTime: "2025-01-20T10:00:00.000Z",
          endTime: "2025-01-20T10:00:00.120Z",
        },
        {
          id: "vec1",
          type: "SPAN",
          name: "Vector Search - pgvector",
          startTime: "2025-01-20T10:00:00.120Z",
          endTime: "2025-01-20T10:00:00.280Z",
        },
        {
          id: "llm1",
          type: "GENERATION",
          name: "Claude 3.5 Sonnet",
          startTime: "2025-01-20T10:00:00.280Z",
          endTime: "2025-01-20T10:00:02.100Z",
        },
      ];

      const segments = extractLatencySegments(observations);

      expect(segments).toHaveLength(3);
      expect(segments[0].type).toBe("embedding");
      expect(segments[0].duration).toBe(120);
      expect(segments[1].type).toBe("vector");
      expect(segments[1].duration).toBe(160);
      expect(segments[2].type).toBe("llm");
      expect(segments[2].duration).toBe(1820);

      // Total should be ~2.1 seconds
      const total = segments.reduce((sum, seg) => sum + seg.duration, 0);
      expect(total).toBe(2100);
    });
  });
});
