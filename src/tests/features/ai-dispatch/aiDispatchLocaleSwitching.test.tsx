import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AiDispatchRunForm } from "@/features/ai-dispatch/components/AiDispatchRunForm";
import type { AiDispatchActionsResult } from "@/features/ai-dispatch/hooks/useAiDispatchActions";
import { setTestLocale } from "@/tests/testLocale";

describe("AI Dispatch locale switching", () => {
  it.each([
    { locale: "vi" as const, section: "1. Yêu cầu điều phối", placeholder: "Ví dụ: Ưu tiên xe thùng kín cho hàng giá trị cao, tránh tuyến đường cấm giờ cao điểm...", submit: "Yêu cầu AI Lập kế hoạch", foreign: ["1. Dispatch request", "Request AI Dispatch Plan", "1. 配車リクエスト", "AI配車プランをリクエスト"] },
    { locale: "en" as const, section: "1. Dispatch request", placeholder: "e.g., Prioritize refrigerated trucks for high-value cargo, avoid peak hours...", submit: "Request AI Dispatch Plan", foreign: ["1. Yêu cầu điều phối", "Yêu cầu AI Lập kế hoạch", "1. 配車リクエスト", "AI配車プランをリクエスト"] },
    { locale: "ja" as const, section: "1. 配車リクエスト", placeholder: "配車の参考にする追加指示を入力してください", submit: "AI配車プランをリクエスト", foreign: ["1. Yêu cầu điều phối", "Yêu cầu AI Lập kế hoạch", "1. Dispatch request", "Request AI Dispatch Plan"] },
  ])("renders AI Dispatch run form copy in $locale without mixed locale labels", async ({ locale, section, placeholder, submit, foreign }) => {
    await setTestLocale(locale);
    const actions = { pending: false, canRun: true, runAiDispatch: vi.fn() } as unknown as AiDispatchActionsResult;
    render(<AiDispatchRunForm actions={actions} />);

    expect(screen.getByText(section)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(placeholder)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: submit })).toBeEnabled();
    for (const copy of foreign) {
      expect(screen.queryByText(copy)).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: copy })).not.toBeInTheDocument();
    }
  });
});
