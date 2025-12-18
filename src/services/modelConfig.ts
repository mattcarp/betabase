export type ModelUseCase =
  | "chat"
  | "premium-chat"
  | "reasoning"
  | "code-generation"
  | "test-generation"
  | "quick-response"
  | "vision"
  | "aoma-query";

export type AIModel =
  // Gemini 3.x models (primary for RAG) - Released December 2025
  | "gemini-3-flash-preview"    // Fast frontier model (Released Dec 17, 2025)
  // Gemini 2.x models (legacy)
  | "gemini-2.5-pro"
  | "gemini-2.5-flash"
  // OpenAI models (fallback)
  | "gpt-5"
  | "gpt-5-pro"
  | "o3"
  | "o3-pro"
  | "o4-mini"
  | "gpt-4o"
  | "gpt-4o-mini";

interface ModelConfig {
  model: AIModel;
  temperature: number;
  maxOutputTokens: number;
  description: string;
  costTier: "economy" | "standard" | "premium" | "ultra";
}

class ModelConfigService {
  private static instance: ModelConfigService;

  private modelConfigs: Record<ModelUseCase, ModelConfig> = {
    chat: {
      model: (process.env.NEXT_PUBLIC_DEFAULT_CHAT_MODEL as AIModel) || "gemini-3-flash-preview",
      temperature: 0.9,
      maxOutputTokens: 8000,
      description: "Fast conversational RAG with Gemini 3 Flash",
      costTier: "economy",
    },
    "premium-chat": {
      model: "gemini-3-flash-preview",
      temperature: 0.8,
      maxOutputTokens: 12000,
      description: "Premium RAG synthesis with Gemini 3 Flash",
      costTier: "economy",
    },
    reasoningText: {
      model: "gemini-3-flash-preview",
      temperature: 0.7,
      maxOutputTokens: 10000,
      description: "Deep reasoning and analysis with Gemini 3 Flash",
      costTier: "economy",
    },
    "code-generation": {
      model: "gemini-3-flash-preview",
      temperature: 0.8,
      maxOutputTokens: 8000,
      description: "Code generation optimized with Gemini 3 Flash",
      costTier: "economy",
    },
    "test-generation": {
      model: "gemini-3-flash-preview",
      temperature: 0.5,
      maxOutputTokens: 4000,
      description: "Test generation with Gemini 3 Flash",
      costTier: "economy",
    },
    "quick-response": {
      model: "gemini-3-flash-preview",
      temperature: 0.7,
      maxOutputTokens: 2000,
      description: "Fast RAG responses with Gemini 3 Flash",
      costTier: "economy",
    },
    vision: {
      model: "gemini-3-flash-preview",
      temperature: 0.7,
      maxOutputTokens: 4000,
      description: "Multimodal visual analysis with Gemini 3 Flash",
      costTier: "economy",
    },
    "aoma-query": {
      model: "gemini-3-flash-preview",
      temperature: 0.7,
      maxOutputTokens: 8000,
      description: "AOMA RAG with Gemini 3 Flash (frontier speed)",
      costTier: "economy",
    },
  };

  private fallbackModel: AIModel = "gemini-3-flash-preview";

  private constructor() {}

  static getInstance(): ModelConfigService {
    if (!ModelConfigService.instance) {
      ModelConfigService.instance = new ModelConfigService();
    }
    return ModelConfigService.instance;
  }

  getModelConfig(useCase: ModelUseCase): ModelConfig {
    return this.modelConfigs[useCase];
  }

  getModel(useCase: ModelUseCase): AIModel {
    try {
      return this.modelConfigs[useCase].model;
    } catch (error) {
      console.warn(`Failed to get model for ${useCase}, using fallback`);
      return this.fallbackModel;
    }
  }

  getModelWithConfig(useCase: ModelUseCase): {
    model: AIModel;
    temperature: number;
    maxOutputTokens: number;
  } {
    const config = this.modelConfigs[useCase];
    if (!config) {
      return {
        model: this.fallbackModel,
        temperature: 0.7,
        maxOutputTokens: 4000,
      };
    }
    return {
      model: config.model,
      temperature: config.temperature,
      maxOutputTokens: config.maxOutputTokens,
    };
  }

  setCustomModel(useCase: ModelUseCase, model: AIModel): void {
    if (this.modelConfigs[useCase]) {
      this.modelConfigs[useCase].model = model;
    }
  }

  getCostTier(useCase: ModelUseCase): string {
    return this.modelConfigs[useCase]?.costTier || "standard";
  }

  getAvailableModels(): AIModel[] {
    return [
      // Gemini 3.x - Current frontier
      "gemini-3-flash-preview",  // Released Dec 17, 2025
      // Gemini 2.x - Legacy
      "gemini-2.5-pro",
      "gemini-2.5-flash",
      // OpenAI fallbacks
      "gpt-5",
      "gpt-5-pro",
      "o3",
      "o3-pro",
      "o4-mini",
      "gpt-4o",
      "gpt-4o-mini"
    ];
  }

  getModelDescription(model: AIModel): string {
    const descriptions: Record<AIModel, string> = {
      // Gemini 3.x models (primary)
      "gemini-3-flash-preview": "Gemini 3 Flash: 3x faster, frontier intelligence, Dec 2025",
      // Gemini 2.x models (legacy)
      "gemini-2.5-pro": "Gemini 2.5 Pro: Advanced thinking, 2M context",
      "gemini-2.5-flash": "Gemini 2.5 Flash: Price-performance balance",
      // OpenAI models (fallback)
      "gpt-5": "OpenAI GPT-5 (fallback)",
      "gpt-5-pro": "Premium GPT-5 Pro (fallback)",
      o3: "Advanced reasoning model with tool integration",
      "o3-pro": "Premium o3 with extended thinking",
      "o4-mini": "Fast, cost-efficient model",
      "gpt-4o": "Previous generation optimized model",
      "gpt-4o-mini": "Cost-efficient previous generation model",
    };
    return descriptions[model] || "Unknown model";
  }
}

export const modelConfig = ModelConfigService.getInstance();
