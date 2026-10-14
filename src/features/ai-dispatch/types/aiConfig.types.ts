/**
 * Định nghĩa các kiểu dữ liệu cho cấu hình AI và các nhà cung cấp mô hình AI.
 */

export type AiProviderId = "openai" | "gemini" | "claude" | "deepseek" | "custom";

export interface AiProviderConfig {
  id: AiProviderId;
  name: string;
  apiKey: string;
  baseUrl: string;
  model: string;
  availableModels: string[];
  isEnabled: boolean;
}

export interface AiSettings {
  activeProvider: AiProviderId;
  temperature: number;
  maxTokens: number;
  timeoutSeconds: number;
  providers: Record<AiProviderId, AiProviderConfig>;
}

export const DEFAULT_AI_SETTINGS: AiSettings = {
  activeProvider: "openai",
  temperature: 0.2,
  maxTokens: 4096,
  timeoutSeconds: 30,
  providers: {
    openai: {
      id: "openai",
      name: "OpenAI",
      apiKey: "",
      baseUrl: "https://api.openai.com/v1",
      model: "gpt-4o",
      availableModels: ["gpt-4o", "gpt-4o-mini", "o1-mini", "gpt-4-turbo"],
      isEnabled: true,
    },
    gemini: {
      id: "gemini",
      name: "Google Gemini",
      apiKey: "",
      baseUrl: "https://generativelanguage.googleapis.com/v1beta",
      model: "gemini-2.0-flash",
      availableModels: [
        "gemini-2.0-flash",
        "gemini-1.5-pro",
        "gemini-1.5-flash",
        "gemini-2.5-pro",
      ],
      isEnabled: true,
    },
    claude: {
      id: "claude",
      name: "Anthropic Claude",
      apiKey: "",
      baseUrl: "https://api.anthropic.com/v1",
      model: "claude-3-5-sonnet-latest",
      availableModels: [
        "claude-3-5-sonnet-latest",
        "claude-3-5-haiku-latest",
        "claude-3-opus-20240229",
      ],
      isEnabled: true,
    },
    deepseek: {
      id: "deepseek",
      name: "DeepSeek",
      apiKey: "",
      baseUrl: "https://api.deepseek.com/v1",
      model: "deepseek-chat",
      availableModels: ["deepseek-chat", "deepseek-reasoner"],
      isEnabled: true,
    },
    custom: {
      id: "custom",
      name: "Custom / Local LLM (Ollama / vLLM)",
      apiKey: "",
      baseUrl: "http://localhost:11434/v1",
      model: "llama3.3:latest",
      availableModels: ["llama3.3:latest", "qwen2.5:72b", "mistral:latest", "custom"],
      isEnabled: false,
    },
  },
};
