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
  // Gemini models (primary for RAG)
  | "gemini-2.5-pro"
  | "gemini-2.5-flash"
  | "gemini-2.5-ultra"
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
  maxTokens: number;
  description: string;
  costTier: "economy" | "standard" | "premium" | "ultra";
}

class ModelConfigService {
  private static instance: ModelConfigService;

  private modelConfigs: Record<ModelUseCase, ModelConfig> = {
    chat: {
      model: (process.env.NEXT_PUBLIC_DEFAULT_CHAT_MODEL as AIModel) || "gemini-2.5-pro",
      temperature: 0.9,
      maxTokens: 8000,
      description: "Conversational RAG with Gemini 2.5 Pro (2M context)",
      costTier: "standard",
    },
    "premium-chat": {
      model: "gemini-2.5-pro",
      temperature: 0.8,
      maxTokens: 12000,
      description: "Premium RAG synthesis with massive 2M context window",
      costTier: "standard",
    },
    reasoning: {
      model: "gemini-2.5-pro",
      temperature: 0.7,
      maxTokens: 10000,
      description: "Deep reasoning and analysis with Gemini 2.5 Pro",
      costTier: "standard",
    },
    "code-generation": {
      model: "gemini-2.5-pro",
      temperature: 0.8,
      maxTokens: 8000,
      description: "Code generation optimized with Gemini 2.5 Pro",
      costTier: "standard",
    },
    "test-generation": {
      model: "gemini-2.5-flash",
      temperature: 0.5,
      maxTokens: 4000,
      description: "Cost-efficient test generation with Gemini 2.5 Flash",
      costTier: "economy",
    },
    "quick-response": {
      model: "gemini-2.5-flash",
      temperature: 0.7,
      maxTokens: 2000,
      description: "Fast RAG responses with Gemini 2.5 Flash",
      costTier: "economy",
    },
    vision: {
      model: "gemini-2.5-pro",
      temperature: 0.7,
      maxTokens: 4000,
      description: "Multimodal visual analysis with Gemini 2.5 Pro",
      costTier: "standard",
    },
    "aoma-query": {
      model: "gemini-2.5-pro",
      temperature: 0.7, // Lower temp for factual accuracy in RAG
      maxTokens: 8000,
      description: "AOMA knowledge synthesis with Gemini 2.5 Pro (2M context)",
      costTier: "standard",
    },
  };

  private fallbackModel: AIModel = "gemini-2.5-flash";

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
    maxTokens: number;
  } {
    const config = this.modelConfigs[useCase];
    if (!config) {
      return {
        model: this.fallbackModel,
        temperature: 0.7,
        maxTokens: 4000,
      };
    }
    return {
      model: config.model,
      temperature: config.temperature,
      maxTokens: config.maxTokens,
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
      "gemini-2.5-pro",
      "gemini-2.5-flash",
      "gemini-2.5-ultra",
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
      // Gemini models
      "gemini-2.5-pro": "Optimal for RAG: 2M context, excellent synthesis (recommended)",
      "gemini-2.5-flash": "Fast & cost-efficient RAG with 1M context",
      "gemini-2.5-ultra": "Maximum capability (usually unnecessary for RAG)",
      // OpenAI models
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
