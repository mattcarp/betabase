export type ModelUseCase =
  | "chat"
  | "premium-chat"
  | "reasoning"
  | "code-generation"
  | "test-generation"
  | "quick-response"
  | "vision"
  | "aoma-query";

export type OpenAIModel =
  | "gpt-5"
  | "gpt-5-pro"
  | "o3"
  | "o3-pro"
  | "o4-mini"
  | "gpt-4o"
  | "gpt-4o-mini";

interface ModelConfig {
  model: OpenAIModel;
  temperature: number;
  maxTokens: number;
  description: string;
  costTier: "economy" | "standard" | "premium" | "ultra";
}

class ModelConfigService {
  private static instance: ModelConfigService;

  private modelConfigs: Record<ModelUseCase, ModelConfig> = {
    chat: {
      model: (process.env.NEXT_PUBLIC_DEFAULT_CHAT_MODEL as OpenAIModel) || "gpt-5",
      temperature: 1, // GPT-5 only supports default temperature (1)
      maxTokens: 8000,
      description: "Standard chat conversations with GPT-5",
      costTier: "standard",
    },
    "premium-chat": {
      model: "gpt-5",
      temperature: 1, // GPT-5 only supports default temperature (1)
      maxTokens: 12000,
      description: "Premium chat with GPT-5 for complex tasks",
      costTier: "standard",
    },
    reasoning: {
      model: "gpt-5",
      temperature: 1, // GPT-5 only supports default temperature (1)
      maxTokens: 10000,
      description: "Deep reasoning with GPT-5",
      costTier: "standard",
    },
    "code-generation": {
      model: "gpt-5",
      temperature: 1, // GPT-5 only supports default temperature (1)
      maxTokens: 8000,
      description: "GPT-5 optimized for coding tasks",
      costTier: "standard",
    },
    "test-generation": {
      model: "o4-mini",
      temperature: 0.3,
      maxTokens: 4000,
      description: "Cost-efficient test generation with o4-mini",
      costTier: "economy",
    },
    "quick-response": {
      model: "o4-mini",
      temperature: 0.5,
      maxTokens: 2000,
      description: "Fast responses with o4-mini",
      costTier: "economy",
    },
    vision: {
      model: "gpt-5",
      temperature: 0.5,
      maxTokens: 4000,
      description: "Visual analysis with GPT-5",
      costTier: "standard",
    },
    "aoma-query": {
      model: "gpt-5",
      temperature: 1, // GPT-5 only supports default temperature (1)
      maxTokens: 6000,
      description: "AOMA knowledge queries with GPT-5",
      costTier: "standard",
    },
  };

  private fallbackModel: OpenAIModel = "gpt-4o-mini";

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

  getModel(useCase: ModelUseCase): OpenAIModel {
    try {
      return this.modelConfigs[useCase].model;
    } catch (error) {
      console.warn(`Failed to get model for ${useCase}, using fallback`);
      return this.fallbackModel;
    }
  }

  getModelWithConfig(useCase: ModelUseCase): {
    model: OpenAIModel;
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

  setCustomModel(useCase: ModelUseCase, model: OpenAIModel): void {
    if (this.modelConfigs[useCase]) {
      this.modelConfigs[useCase].model = model;
    }
  }

  getCostTier(useCase: ModelUseCase): string {
    return this.modelConfigs[useCase]?.costTier || "standard";
  }

  getAvailableModels(): OpenAIModel[] {
    return ["gpt-5", "gpt-5-pro", "o3", "o3-pro", "o4-mini", "gpt-4o", "gpt-4o-mini"];
  }

  getModelDescription(model: OpenAIModel): string {
    const descriptions: Record<OpenAIModel, string> = {
      "gpt-5": "Latest GPT-5 with 45% fewer errors, excellent for general tasks",
      "gpt-5-pro": "Premium GPT-5 Pro with unlimited access and priority processing",
      o3: "Advanced reasoning model with tool integration",
      "o3-pro": "Premium o3 with extended thinking for complex problems",
      "o4-mini": "Fast, cost-efficient model for simple tasks",
      "gpt-4o": "Previous generation optimized model",
      "gpt-4o-mini": "Cost-efficient previous generation model",
    };
    return descriptions[model] || "Unknown model";
  }
}

export const modelConfig = ModelConfigService.getInstance();
