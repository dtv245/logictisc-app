import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AiConfigModal } from "@/features/ai-dispatch/components/AiConfigModal";
import { getStoredAiSettings } from "@/features/ai-dispatch/hooks/aiConfigStorage";
import { renderFinance } from "@/tests/fixtures/FinanceTestHarness";
import { useState } from "react";

function ReopenableConfigModal() {
  const [open, setOpen] = useState(true);
  return (
    <>
      <button onClick={() => setOpen(true)}>Reopen configuration</button>
      <AiConfigModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}

describe("AiConfigModal — Popup cấu hình mô hình AI & API Key", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("discards unsaved draft and tab selection when reopened", async () => {
    await renderFinance(<ReopenableConfigModal />, vi.fn());
    const originalKey = getStoredAiSettings().providers.openai.apiKey;
    fireEvent.change(await screen.findByTestId("input-api-key-openai"), {
      target: { value: "unsaved-key" },
    });
    fireEvent.click(screen.getByRole("tab", { name: /Google/i }));
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    fireEvent.click(screen.getByRole("button", { name: "Reopen configuration" }));

    expect(await screen.findByTestId("input-api-key-openai")).toHaveValue(originalKey);
    expect(screen.getByRole("tab", { name: /OpenAI/i })).toHaveAttribute("aria-selected", "true");
  });

  it("hiển thị modal với các tab nhà cung cấp và ô nhập API Key", async () => {
    const onClose = vi.fn();
    await renderFinance(<AiConfigModal open={true} onClose={onClose} />, vi.fn(async () => undefined));

    // Kiểm tra tiêu đề modal
    expect(await screen.findByText(/AI Model & API Key Configuration/i)).toBeInTheDocument();

    // Các provider tabs
    expect(screen.getByRole("tab", { name: /OpenAI/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Google/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Anthropic/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /DeepSeek/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Custom/i })).toBeInTheDocument();

    // Ô nhập API Key cho OpenAI (tab mặc định)
    const apiKeyInput = screen.getByTestId("input-api-key-openai");
    expect(apiKeyInput).toBeInTheDocument();
  });

  it("cho phép người dùng nhập API key cho OpenAI và lưu cấu hình", async () => {
    const onClose = vi.fn();
    await renderFinance(<AiConfigModal open={true} onClose={onClose} />, vi.fn(async () => undefined));

    // Nhập API Key
    const apiKeyInput = await screen.findByTestId("input-api-key-openai");
    fireEvent.change(apiKeyInput, { target: { value: "sk-test-openai-secret-key-12345" } });

    // Bấm lưu cấu hình
    const saveBtn = screen.getByTestId("btn-save-ai-config");
    fireEvent.click(saveBtn);

    expect(onClose).toHaveBeenCalled();

    // Kiểm tra localStorage đã lưu key
    const saved = getStoredAiSettings();
    expect(saved.providers.openai.apiKey).toBe("sk-test-openai-secret-key-12345");
  });

  it("cho phép chuyển đổi giữa các tab nhà cung cấp để cấu hình Gemini", async () => {
    const onClose = vi.fn();
    await renderFinance(<AiConfigModal open={true} onClose={onClose} />, vi.fn(async () => undefined));

    // Chuyển sang tab Google Gemini
    const geminiTab = await screen.findByRole("tab", { name: /Google/i });
    fireEvent.click(geminiTab);

    // Nhập API Key cho Gemini
    const geminiKeyInput = await screen.findByTestId("input-api-key-gemini");
    fireEvent.change(geminiKeyInput, { target: { value: "AIzaSyTestGeminiKey987" } });

    // Đặt Gemini làm nhà cung cấp chính
    const setAsDefaultBtn = screen.getByRole("button", { name: /Set as active provider/i });
    fireEvent.click(setAsDefaultBtn);

    // Lưu cấu hình
    const saveBtn = screen.getByTestId("btn-save-ai-config");
    fireEvent.click(saveBtn);

    const saved = getStoredAiSettings();
    expect(saved.activeProvider).toBe("gemini");
    expect(saved.providers.gemini.apiKey).toBe("AIzaSyTestGeminiKey987");
  });

  it("thực hiện kiểm tra kết nối (Test Connection) khi người dùng yêu cầu", async () => {
    const onClose = vi.fn();
    await renderFinance(<AiConfigModal open={true} onClose={onClose} />, vi.fn(async () => undefined));

    // Nhập API Key hợp lệ
    const apiKeyInput = await screen.findByTestId("input-api-key-openai");
    fireEvent.change(apiKeyInput, { target: { value: "sk-proj-valid-test-key" } });

    // Bấm Test Connection
    const testBtn = screen.getByTestId("btn-test-connection-openai");
    fireEvent.click(testBtn);

    // Chờ kết quả thông báo
    await waitFor(() => {
      expect(screen.getByText(/Kết nối thành công tới OpenAI/i)).toBeInTheDocument();
    });
  });
});
