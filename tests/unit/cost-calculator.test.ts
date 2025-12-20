/**
 * Unit tests for cost calculator
 */

import { describe, it, expect } from "vitest";
import {
  calculateCost,
  formatCost,
  calculateCostBreakdown,
  hasModelPricing,
  getSupportedModels,
} from "@/lib/introspection/cost-calculator";

describe("Cost Calculator", () => {
  describe("calculateCost", () => {
    it("should calculate GPT-4o cost correctly", () => {
      // GPT-4o: $2.50/1M input, $10.00/1M output
      const cost = calculateCost("gpt-4o", 1000, 500);
      // (1000/1M * 2.5) + (500/1M * 10) = 0.0025 + 0.005 = 0.0075
      expect(cost).toBeCloseTo(0.0075, 6);
    });

    it("should calculate Claude 3.5 Sonnet cost correctly", () => {
      // Claude 3.5 Sonnet: $3.00/1M input, $15.00/1M output
      const cost = calculateCost("claude-3-5-sonnet", 2000, 1000);
      // (2000/1M * 3) + (1000/1M * 15) = 0.006 + 0.015 = 0.021
      expect(cost).toBeCloseTo(0.021, 6);
    });

    it("should calculate Gemini 1.5 Flash cost correctly", () => {
      // Gemini 1.5 Flash: $0.075/1M input, $0.30/1M output
      const cost = calculateCost("gemini-1.5-flash", 10000, 5000);
      // (10000/1M * 0.075) + (5000/1M * 0.3) = 0.00075 + 0.0015 = 0.00225
      expect(cost).toBeCloseTo(0.00225, 6);
    });

    it("should handle case-insensitive model names", () => {
      const cost1 = calculateCost("GPT-4O", 1000, 500);
      const cost2 = calculateCost("gpt-4o", 1000, 500);
      expect(cost1).toBe(cost2);
    });

    it("should return null for unknown models", () => {
      const cost = calculateCost("unknown-model", 1000, 500);
      expect(cost).toBeNull();
    });

    it("should return null for invalid inputs", () => {
      expect(calculateCost("", 1000, 500)).toBeNull();
      expect(calculateCost("gpt-4o", undefined as any, 500)).toBeNull();
      expect(calculateCost("gpt-4o", 1000, undefined as any)).toBeNull();
    });

    it("should handle zero tokens", () => {
      const cost = calculateCost("gpt-4o", 0, 0);
      expect(cost).toBe(0);
    });

    it("should calculate realistic conversation cost", () => {
      // Typical conversation: 5000 prompt tokens, 1500 completion tokens
      const cost = calculateCost("gpt-4o", 5000, 1500);
      // (5000/1M * 2.5) + (1500/1M * 10) = 0.0125 + 0.015 = 0.0275
      expect(cost).toBeCloseTo(0.0275, 6);
    });
  });

  describe("formatCost", () => {
    it("should format small costs with 4 decimals", () => {
      expect(formatCost(0.0023)).toBe("$0.0023");
      expect(formatCost(0.00001)).toBe("$0.0000");
    });

    it("should format normal costs with 2 decimals", () => {
      expect(formatCost(0.05)).toBe("$0.05");
      expect(formatCost(1.234)).toBe("$1.23");
      expect(formatCost(10.5)).toBe("$10.50");
    });

    it("should handle zero cost", () => {
      expect(formatCost(0)).toBe("$0.00");
    });

    it("should handle null cost", () => {
      expect(formatCost(null)).toBe("-");
    });

    it("should round to nearest cent for normal costs", () => {
      expect(formatCost(1.235)).toBe("$1.24");
      expect(formatCost(1.234)).toBe("$1.23");
    });
  });

  describe("calculateCostBreakdown", () => {
    it("should provide detailed breakdown", () => {
      const breakdown = calculateCostBreakdown("gpt-4o", 1000, 500);

      expect(breakdown.model).toBe("gpt-4o");
      expect(breakdown.total).toBeCloseTo(0.0075, 6);
      expect(breakdown.input).toBeCloseTo(0.0025, 6);
      expect(breakdown.output).toBeCloseTo(0.005, 6);
      expect(breakdown.pricing?.input).toBe(2.5);
      expect(breakdown.pricing?.output).toBe(10.0);
    });

    it("should handle unknown models", () => {
      const breakdown = calculateCostBreakdown("unknown-model", 1000, 500);

      expect(breakdown.model).toBe("unknown-model");
      expect(breakdown.total).toBeNull();
      expect(breakdown.input).toBeNull();
      expect(breakdown.output).toBeNull();
      expect(breakdown.pricing).toBeNull();
    });

    it("should show cost distribution", () => {
      const breakdown = calculateCostBreakdown("claude-3-5-sonnet", 1000, 1000);

      // Input: 1000/1M * 3 = 0.003
      // Output: 1000/1M * 15 = 0.015
      expect(breakdown.input).toBeCloseTo(0.003, 6);
      expect(breakdown.output).toBeCloseTo(0.015, 6);

      // Output should be 5x input cost (15/3 = 5)
      expect(breakdown.output! / breakdown.input!).toBeCloseTo(5, 1);
    });
  });

  describe("hasModelPricing", () => {
    it("should return true for supported models", () => {
      expect(hasModelPricing("gpt-4o")).toBe(true);
      expect(hasModelPricing("claude-3-5-sonnet")).toBe(true);
      expect(hasModelPricing("gemini-1.5-flash")).toBe(true);
    });

    it("should return false for unsupported models", () => {
      expect(hasModelPricing("unknown-model")).toBe(false);
      expect(hasModelPricing("")).toBe(false);
    });

    it("should be case-insensitive", () => {
      expect(hasModelPricing("GPT-4O")).toBe(true);
      expect(hasModelPricing("Claude-3-5-Sonnet")).toBe(true);
    });
  });

  describe("getSupportedModels", () => {
    it("should return array of model names", () => {
      const models = getSupportedModels();

      expect(Array.isArray(models)).toBe(true);
      expect(models.length).toBeGreaterThan(0);
      expect(models).toContain("gpt-4o");
      expect(models).toContain("claude-3-5-sonnet");
      expect(models).toContain("gemini-1.5-flash");
    });

    it("should include all major model families", () => {
      const models = getSupportedModels();

      // Check for GPT models
      expect(models.some((m) => m.startsWith("gpt-4"))).toBe(true);
      expect(models.some((m) => m.startsWith("gpt-3.5"))).toBe(true);

      // Check for Claude models
      expect(models.some((m) => m.startsWith("claude-3"))).toBe(true);

      // Check for Gemini models
      expect(models.some((m) => m.startsWith("gemini"))).toBe(true);
    });
  });

  describe("Real-world scenarios", () => {
    it("should calculate cost for typical RAG query", () => {
      // Typical RAG: system prompt + context + user query = 3000 tokens
      // Response: 800 tokens
      const cost = calculateCost("gpt-4o", 3000, 800);

      // (3000/1M * 2.5) + (800/1M * 10) = 0.0075 + 0.008 = 0.0155
      expect(cost).toBeCloseTo(0.0155, 6);
      expect(formatCost(cost!)).toBe("$0.02");
    });

    it("should calculate cost for long document analysis", () => {
      // Large context: 50k tokens, short response: 2k tokens
      const cost = calculateCost("claude-3-5-sonnet", 50000, 2000);

      // (50000/1M * 3) + (2000/1M * 15) = 0.15 + 0.03 = 0.18
      expect(cost).toBeCloseTo(0.18, 6);
      expect(formatCost(cost!)).toBe("$0.18");
    });

    it("should calculate cost for high-volume cheap model", () => {
      // Many small queries with Gemini Flash
      const singleQueryCost = calculateCost("gemini-1.5-flash", 500, 200);
      const hundredQueries = singleQueryCost! * 100;

      // (500/1M * 0.075) + (200/1M * 0.3) = 0.0000375 + 0.00006 = 0.0000975
      expect(singleQueryCost).toBeCloseTo(0.0000975, 7);

      // 100 queries should still be under $0.01
      expect(hundredQueries).toBeLessThan(0.01);
    });
  });
});
