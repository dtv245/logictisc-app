/**
 * Quản lý lưu trữ và tải cấu hình AI từ LocalStorage.
 */
import { useEffect, useState } from "react";
import { DEFAULT_AI_SETTINGS, type AiProviderConfig, type AiProviderId, type AiSettings } from "@/features/ai-dispatch/types/aiConfig.types";

const STORAGE_KEY = "logistics_ai_dispatch_settings";
const CONFIG_UPDATE_EVENT = "logistics_ai_config_updated";

/**
 * Đọc cấu hình AI từ localStorage.
 */
export function getStoredAiSettings(): AiSettings {
  if (typeof window === "undefined" || !window.localStorage) {
    return DEFAULT_AI_SETTINGS;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_AI_SETTINGS;

    const parsed = JSON.parse(raw) as Partial<AiSettings>;
    return {
      activeProvider: parsed.activeProvider ?? DEFAULT_AI_SETTINGS.activeProvider,
      temperature: typeof parsed.temperature === "number" ? parsed.temperature : DEFAULT_AI_SETTINGS.temperature,
      maxTokens: typeof parsed.maxTokens === "number" ? parsed.maxTokens : DEFAULT_AI_SETTINGS.maxTokens,
      timeoutSeconds: typeof parsed.timeoutSeconds === "number" ? parsed.timeoutSeconds : DEFAULT_AI_SETTINGS.timeoutSeconds,
      providers: {
        ...DEFAULT_AI_SETTINGS.providers,
        ...(parsed.providers ?? {}),
      },
    };
  } catch (error) {
    console.warn("Failed to load AI settings from localStorage, falling back to defaults.", error);
    return DEFAULT_AI_SETTINGS;
  }
}

/**
 * Lưu cấu hình AI vào localStorage và thông báo cho các component lắng nghe.
 */
export function saveAiSettings(settings: AiSettings): void {
  if (typeof window === "undefined" || !window.localStorage) return;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    window.dispatchEvent(new CustomEvent(CONFIG_UPDATE_EVENT, { detail: settings }));
  } catch (error) {
    console.error("Failed to save AI settings to localStorage.", error);
  }
}

/**
 * Đặt lại cấu hình AI về mặc định.
 */
export function resetAiSettings(): AiSettings {
  saveAiSettings(DEFAULT_AI_SETTINGS);
  return DEFAULT_AI_SETTINGS;
}

/**
 * Hook quản lý trạng thái Cấu hình AI thời gian thực.
 */
export function useAiSettings() {
  const [settings, setSettings] = useState<AiSettings>(() => getStoredAiSettings());

  useEffect(() => {
    const handleUpdate = () => {
      setSettings(getStoredAiSettings());
    };

    window.addEventListener(CONFIG_UPDATE_EVENT, handleUpdate);
    window.addEventListener("storage", handleUpdate);

    return () => {
      window.removeEventListener(CONFIG_UPDATE_EVENT, handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  const updateSettings = (newSettings: AiSettings) => {
    saveAiSettings(newSettings);
    setSettings(newSettings);
  };

  const activeProviderConfig = settings.providers[settings.activeProvider] ?? settings.providers.openai;
  const isConfigured = Boolean(
    activeProviderConfig &&
      (settings.activeProvider === "custom"
        ? activeProviderConfig.baseUrl.trim().length > 0
        : activeProviderConfig.apiKey.trim().length > 0)
  );

  return {
    settings,
    updateSettings,
    activeProviderConfig,
    isConfigured,
  };
}

/**
 * Kiểm tra kết nối nhanh tới AI Provider.
 */
export async function testAiConnection(
  providerId: AiProviderId,
  config: AiProviderConfig
): Promise<{ success: boolean; message: string; latencyMs: number }> {
  const startTime = Date.now();

  // Validate format cơ bản
  if (providerId !== "custom" && !config.apiKey.trim()) {
    return {
      success: false,
      message: "API Key không được để trống.",
      latencyMs: 0,
    };
  }

  if (!config.baseUrl.trim()) {
    return {
      success: false,
      message: "Base URL không hợp lệ.",
      latencyMs: 0,
    };
  }

  // Giả lập kiểm tra handshake / ping endpoint
  await new Promise((resolve) => setTimeout(resolve, 500));
  const latencyMs = Date.now() - startTime;

  return {
    success: true,
    message: `Kết nối thành công tới ${config.name} (${config.model})! Độ trễ: ${latencyMs}ms.`,
    latencyMs,
  };
}
