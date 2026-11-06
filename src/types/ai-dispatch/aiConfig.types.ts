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
