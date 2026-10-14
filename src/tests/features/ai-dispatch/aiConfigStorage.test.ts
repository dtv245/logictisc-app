import { beforeEach, describe, expect, it } from "vitest";
import {
  getStoredAiSettings,
  resetAiSettings,
  saveAiSettings,
  testAiConnection,
} from "@/features/ai-dispatch/hooks/aiConfigStorage";
import { DEFAULT_AI_SETTINGS, type AiSettings } from "@/features/ai-dispatch/types/aiConfig.types";

describe("aiConfigStorage — Quản lý lưu trữ cấu hình AI", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("trả về cấu hình mặc định khi localStorage rỗng", () => {
    const settings = getStoredAiSettings();
    expect(settings.activeProvider).toBe("openai");
    expect(settings.providers.openai.model).toBe("gpt-4o");
    expect(settings.providers.gemini.model).toBe("gemini-2.0-flash");
    expect(settings.providers.claude.model).toBe("claude-3-5-sonnet-latest");
    expect(settings.providers.deepseek.model).toBe("deepseek-chat");
  });

  it("lưu và đọc cấu hình thành công từ localStorage", () => {
    const modified: AiSettings = {
      ...DEFAULT_AI_SETTINGS,
      activeProvider: "gemini",
      providers: {
        ...DEFAULT_AI_SETTINGS.providers,
        gemini: {
          ...DEFAULT_AI_SETTINGS.providers.gemini,
          apiKey: "AIzaTestGeminiKey123",
          model: "gemini-2.5-pro",
        },
      },
    };

    saveAiSettings(modified);
    const loaded = getStoredAiSettings();

    expect(loaded.activeProvider).toBe("gemini");
    expect(loaded.providers.gemini.apiKey).toBe("AIzaTestGeminiKey123");
    expect(loaded.providers.gemini.model).toBe("gemini-2.5-pro");
  });

  it("cho phép khôi phục cấu hình về mặc định", () => {
    const customSettings: AiSettings = {
      ...DEFAULT_AI_SETTINGS,
      activeProvider: "deepseek",
      temperature: 0.8,
    };
    saveAiSettings(customSettings);
    expect(getStoredAiSettings().activeProvider).toBe("deepseek");

    resetAiSettings();
    const restored = getStoredAiSettings();
    expect(restored.activeProvider).toBe("openai");
    expect(restored.temperature).toBe(0.2);
  });

  it("kiểm tra kết nối thất bại khi thiếu API Key cho nhà cung cấp đám mây", async () => {
    const res = await testAiConnection("openai", {
      ...DEFAULT_AI_SETTINGS.providers.openai,
      apiKey: "",
    });
    expect(res.success).toBe(false);
    expect(res.message).toMatch(/API Key không được để trống/i);
  });

  it("kiểm tra kết nối thành công khi có API Key hợp lệ", async () => {
    const res = await testAiConnection("gemini", {
      ...DEFAULT_AI_SETTINGS.providers.gemini,
      apiKey: "AIzaValidTestKey123",
    });
    expect(res.success).toBe(true);
    expect(res.message).toMatch(/Kết nối thành công tới Google Gemini/i);
    expect(res.latencyMs).toBeGreaterThanOrEqual(0);
  });

  it("cho phép kết nối Custom/Local LLM mà không bắt buộc API Key", async () => {
    const res = await testAiConnection("custom", {
      ...DEFAULT_AI_SETTINGS.providers.custom,
      apiKey: "",
      baseUrl: "http://localhost:11434/v1",
    });
    expect(res.success).toBe(true);
    expect(res.message).toMatch(/Kết nối thành công tới Custom \/ Local LLM/i);
  });
});
