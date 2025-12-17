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
  // Gemini models (primary for RAG) - Gemini 3.x only
  | "gemini-3-pro-preview"
  | "gemini-3-flash" // Coming mid-December 2025
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
      model: (process.env.NEXT_PUBLIC_DEFAULT_CHAT_MODEL as AIModel) || "gemini-3-pro-preview",
      temperature: 0.9,
      maxOutputTokens: 8000,
      description: "Fast conversational RAG with Gemini 3 Pro",
      costTier: "standard",
    },
    "premium-chat": {
      model: "gemini-3-pro-preview",
      temperature: 0.8,
      maxOutputTokens: 12000,
      description: "Premium RAG synthesis with Gemini 3 Pro",
      costTier: "standard",
    },
    reasoningText: {
      model: "gemini-3-pro-preview",
      temperature: 0.7,
      maxOutputTokens: 10000,
      description: "Deep reasoning and analysis with Gemini 3 Pro",
      costTier: "standard",
    },
    "code-generation": {
      model: "gemini-3-pro-preview",
      temperature: 0.8,
      maxOutputTokens: 8000,
      description: "Code generation optimized with Gemini 3 Pro",
      costTier: "standard",
    },
    "test-generation": {
      model: "gemini-3-pro-preview",
      temperature: 0.5,
      maxOutputTokens: 4000,
      description: "Test generation with Gemini 3 Pro",
      costTier: "standard",
    },
    "quick-response": {
      model: "gemini-3-pro-preview",
      temperature: 0.7,
      maxOutputTokens: 2000,
      description: "Fast RAG responses with Gemini 3 Pro",
      costTier: "standard",
    },
    vision: {
      model: "gemini-3-pro-preview",
      temperature: 0.7,
      maxOutputTokens: 4000,
      description: "Multimodal visual analysis with Gemini 3 Pro",
      costTier: "standard",
    },
    "aoma-query": {
      model: "gemini-3-pro-preview",
      temperature: 0.7, // Lower temp for factual accuracy in RAG
      maxOutputTokens: 8000,
      description: "AOMA RAG with Gemini 3 Pro (frontier quality)",
      costTier: "standard",
    },
  };

  private fallbackModel: AIModel = "gemini-3-pro-preview";

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
      "gemini-3-pro-preview",
      "gemini-3-flash", // Coming mid-December 2025
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
      // Gemini models (primary) - 3.x only
      "gemini-3-pro-preview": "Optimal for RAG: latest Gemini 3 Pro with excellent synthesis",
      "gemini-3-flash": "Gemini 3 Flash: Fast frontier model (coming mid-December 2025)",
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
