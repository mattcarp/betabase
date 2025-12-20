/**
 * Cost Calculator for LLM API Usage
 *
 * Calculates estimated costs for LLM API calls based on token usage.
 * Pricing is accurate as of January 2025.
 *
 * @see https://openai.com/api/pricing/
 * @see https://ai.google.dev/pricing
 * @see https://anthropic.com/pricing
 */

/**
 * Pricing table: cost per 1M tokens in USD
 * Format: { input: X, output: Y } where X and Y are cost per million tokens
 */
export const MODEL_PRICING: Record<
  string,
  { input: number; output: number; description?: string }
> = {
  // OpenAI GPT-4 Turbo
  "gpt-4-turbo": { input: 10.0, output: 30.0, description: "GPT-4 Turbo" },
  "gpt-4-turbo-preview": { input: 10.0, output: 30.0 },
  "gpt-4-1106-preview": { input: 10.0, output: 30.0 },
  "gpt-4-0125-preview": { input: 10.0, output: 30.0 },

  // OpenAI GPT-4
  "gpt-4": { input: 30.0, output: 60.0, description: "GPT-4" },
  "gpt-4-0613": { input: 30.0, output: 60.0 },
  "gpt-4-32k": { input: 60.0, output: 120.0, description: "GPT-4 32K" },
  "gpt-4-32k-0613": { input: 60.0, output: 120.0 },

  // OpenAI GPT-4o
  "gpt-4o": { input: 2.5, output: 10.0, description: "GPT-4o" },
  "gpt-4o-2024-11-20": { input: 2.5, output: 10.0 },
  "gpt-4o-mini": { input: 0.15, output: 0.6, description: "GPT-4o Mini" },
  "gpt-4o-mini-2024-07-18": { input: 0.15, output: 0.6 },

  // OpenAI GPT-3.5 Turbo
  "gpt-3.5-turbo": { input: 0.5, output: 1.5, description: "GPT-3.5 Turbo" },
  "gpt-3.5-turbo-0125": { input: 0.5, output: 1.5 },
  "gpt-3.5-turbo-1106": { input: 1.0, output: 2.0 },
  "gpt-3.5-turbo-16k": { input: 3.0, output: 4.0, description: "GPT-3.5 Turbo 16K" },

  // Anthropic Claude 3.5 Sonnet
  "claude-3-5-sonnet-20241022": { input: 3.0, output: 15.0, description: "Claude 3.5 Sonnet" },
  "claude-3-5-sonnet-20240620": { input: 3.0, output: 15.0 },
  "claude-3-5-sonnet": { input: 3.0, output: 15.0 },

  // Anthropic Claude 3 Opus
  "claude-3-opus-20240229": { input: 15.0, output: 75.0, description: "Claude 3 Opus" },
  "claude-3-opus": { input: 15.0, output: 75.0 },

  // Anthropic Claude 3 Sonnet
  "claude-3-sonnet-20240229": { input: 3.0, output: 15.0, description: "Claude 3 Sonnet" },
  "claude-3-sonnet": { input: 3.0, output: 15.0 },

  // Anthropic Claude 3 Haiku
  "claude-3-haiku-20240307": { input: 0.25, output: 1.25, description: "Claude 3 Haiku" },
  "claude-3-haiku": { input: 0.25, output: 1.25 },

  // Google Gemini 1.5 Pro
  "gemini-1.5-pro": { input: 1.25, output: 5.0, description: "Gemini 1.5 Pro" },
  "gemini-1.5-pro-latest": { input: 1.25, output: 5.0 },
  "gemini-1.5-pro-002": { input: 1.25, output: 5.0 },

  // Google Gemini 1.5 Flash
  "gemini-1.5-flash": { input: 0.075, output: 0.3, description: "Gemini 1.5 Flash" },
  "gemini-1.5-flash-latest": { input: 0.075, output: 0.3 },
  "gemini-1.5-flash-002": { input: 0.075, output: 0.3 },

  // Google Gemini 1.0 Pro
  "gemini-pro": { input: 0.5, output: 1.5, description: "Gemini 1.0 Pro" },
  "gemini-1.0-pro": { input: 0.5, output: 1.5 },
};

/**
 * Calculate the cost of an LLM API call in USD
 *
 * @param model - Model identifier (e.g., "gpt-4", "claude-3-sonnet")
 * @param promptTokens - Number of input/prompt tokens
 * @param completionTokens - Number of output/completion tokens
 * @returns Cost in USD, or null if model pricing not found
 */
export function calculateCost(
  model: string,
  promptTokens: number,
  completionTokens: number
): number | null {
  if (!model || promptTokens === undefined || completionTokens === undefined) {
    return null;
  }

  // Normalize model name (case-insensitive lookup)
  const normalizedModel = model.toLowerCase();
  const pricing = MODEL_PRICING[normalizedModel];

  if (!pricing) {
    console.warn(`[Cost Calculator] No pricing found for model: ${model}`);
    return null;
  }

  // Calculate cost: (tokens / 1M) * price_per_million
  const inputCost = (promptTokens / 1_000_000) * pricing.input;
  const outputCost = (completionTokens / 1_000_000) * pricing.output;
  const totalCost = inputCost + outputCost;

  return totalCost;
}

/**
 * Format cost as a USD string
 *
 * @param cost - Cost in USD
 * @returns Formatted string like "$0.0023" or "$2.45"
 */
export function formatCost(cost: number | null): string {
  if (cost === null || cost === undefined) {
    return "-";
  }

  if (cost === 0) {
    return "$0.00";
  }

  // For very small costs, show more decimal places
  if (cost < 0.01) {
    return `$${cost.toFixed(4)}`;
  }

  // For normal costs, show 2 decimal places
  return `$${cost.toFixed(2)}`;
}

/**
 * Calculate cost breakdown with detailed information
 *
 * @param model - Model identifier
 * @param promptTokens - Number of input tokens
 * @param completionTokens - Number of output tokens
 * @returns Detailed cost breakdown
 */
export function calculateCostBreakdown(
  model: string,
  promptTokens: number,
  completionTokens: number
): {
  total: number | null;
  input: number | null;
  output: number | null;
  model: string;
  pricing: { input: number; output: number } | null;
} {
  const normalizedModel = model?.toLowerCase() || "";
  const pricing = MODEL_PRICING[normalizedModel] || null;

  if (!pricing) {
    return {
      total: null,
      input: null,
      output: null,
      model,
      pricing: null,
    };
  }

  const inputCost = (promptTokens / 1_000_000) * pricing.input;
  const outputCost = (completionTokens / 1_000_000) * pricing.output;

  return {
    total: inputCost + outputCost,
    input: inputCost,
    output: outputCost,
    model,
    pricing,
  };
}

/**
 * Get all supported models
 */
export function getSupportedModels(): string[] {
  return Object.keys(MODEL_PRICING);
}

/**
 * Check if a model has pricing information
 */
export function hasModelPricing(model: string): boolean {
  return !!MODEL_PRICING[model?.toLowerCase()];
}
