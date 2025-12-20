/**
 * Token Budget Tracking
 *
 * Aggregates token usage over time from trace data.
 * Provides daily and weekly totals with cost calculations.
 */

import { calculateCost } from "./cost-calculator";

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  model?: string;
  cost?: number;
}

export interface TokenBudget {
  period: "daily" | "weekly" | "all-time";
  startDate: Date;
  endDate: Date;
  totalPromptTokens: number;
  totalCompletionTokens: number;
  totalTokens: number;
  totalCost: number;
  traceCount: number;
  modelBreakdown: Record<string, TokenUsage>;
}

/**
 * Extract token usage from a trace
 */
function extractTokenUsage(trace: any): TokenUsage | null {
  const metadata = trace.metadata || {};

  // Only process LLM traces with token data
  if (
    trace.runType !== "llm" ||
    !metadata.model ||
    !metadata.promptTokens ||
    !metadata.completionTokens
  ) {
    return null;
  }

  const promptTokens = metadata.promptTokens;
  const completionTokens = metadata.completionTokens;
  const totalTokens = metadata.totalTokens || promptTokens + completionTokens;
  const cost = calculateCost(metadata.model, promptTokens, completionTokens);

  return {
    promptTokens,
    completionTokens,
    totalTokens,
    model: metadata.model,
    cost: cost || undefined,
  };
}

/**
 * Aggregate token usage from traces for a specific time period
 */
export function aggregateTokenUsage(traces: any[], period: "daily" | "weekly" | "all-time"): TokenBudget {
  const now = new Date();
  let startDate: Date;
  let endDate: Date = now;

  // Calculate start date based on period
  switch (period) {
    case "daily":
      startDate = new Date(now);
      startDate.setHours(0, 0, 0, 0); // Start of today
      break;
    case "weekly":
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 7); // 7 days ago
      break;
    case "all-time":
    default:
      startDate = new Date(0); // Unix epoch
      break;
  }

  let totalPromptTokens = 0;
  let totalCompletionTokens = 0;
  let totalTokens = 0;
  let totalCost = 0;
  let traceCount = 0;
  const modelBreakdown: Record<string, TokenUsage> = {};

  for (const trace of traces) {
    // Filter by date
    const traceDate = new Date(trace.startTime);
    if (traceDate < startDate || traceDate > endDate) {
      continue;
    }

    const usage = extractTokenUsage(trace);
    if (!usage) continue;

    // Aggregate totals
    totalPromptTokens += usage.promptTokens;
    totalCompletionTokens += usage.completionTokens;
    totalTokens += usage.totalTokens;
    if (usage.cost) totalCost += usage.cost;
    traceCount++;

    // Aggregate by model
    const model = usage.model || "unknown";
    if (!modelBreakdown[model]) {
      modelBreakdown[model] = {
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        model,
        cost: 0,
      };
    }

    modelBreakdown[model].promptTokens += usage.promptTokens;
    modelBreakdown[model].completionTokens += usage.completionTokens;
    modelBreakdown[model].totalTokens += usage.totalTokens;
    if (usage.cost) {
      modelBreakdown[model].cost = (modelBreakdown[model].cost || 0) + usage.cost;
    }
  }

  return {
    period,
    startDate,
    endDate,
    totalPromptTokens,
    totalCompletionTokens,
    totalTokens,
    totalCost,
    traceCount,
    modelBreakdown,
  };
}

/**
 * Get token budgets for multiple periods
 */
export function getTokenBudgets(traces: any[]): {
  daily: TokenBudget;
  weekly: TokenBudget;
  allTime: TokenBudget;
} {
  return {
    daily: aggregateTokenUsage(traces, "daily"),
    weekly: aggregateTokenUsage(traces, "weekly"),
    allTime: aggregateTokenUsage(traces, "all-time"),
  };
}

/**
 * Format token count with appropriate suffix
 */
export function formatTokenCount(tokens: number): string {
  if (tokens === 0) return "0";
  if (tokens < 1000) return tokens.toString();
  if (tokens < 1_000_000) return `${(tokens / 1000).toFixed(1)}K`;
  return `${(tokens / 1_000_000).toFixed(2)}M`;
}

/**
 * Calculate average tokens per trace
 */
export function getAverageTokensPerTrace(budget: TokenBudget): number {
  if (budget.traceCount === 0) return 0;
  return Math.round(budget.totalTokens / budget.traceCount);
}

/**
 * Get the most used model from budget
 */
export function getMostUsedModel(budget: TokenBudget): { model: string; tokens: number } | null {
  const models = Object.entries(budget.modelBreakdown);
  if (models.length === 0) return null;

  const sorted = models.sort((a, b) => b[1].totalTokens - a[1].totalTokens);
  return {
    model: sorted[0][0],
    tokens: sorted[0][1].totalTokens,
  };
}
