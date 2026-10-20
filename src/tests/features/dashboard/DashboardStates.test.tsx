import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { OpsEmptyState, OpsErrorState, OpsUnavailableState } from "@/features/dashboard/components/primitives/DashboardStates";
import { setTestLocale } from "@/tests/testLocale";

describe("Operations panel state copy", () => {
  it.each([
    { locale: "vi" as const, empty: "Không có dữ liệu", error: "Dữ liệu tạm thời không khả dụng", retry: "Thử lại", unavailable: "Chưa có dữ liệu nguồn" },
    { locale: "en" as const, empty: "No data available", error: "Data is temporarily unavailable", retry: "Retry", unavailable: "Source data is unavailable" },
    { locale: "ja" as const, empty: "データがありません", error: "データを一時的に利用できません", retry: "再試行", unavailable: "ソースデータを利用できません" },
  ])("renders default states in $locale", async ({ locale, empty, error, retry, unavailable }) => {
    await setTestLocale(locale);
    const retryHandler = vi.fn();
    render(<><OpsEmptyState /><OpsErrorState onRetry={retryHandler} /><OpsUnavailableState /></>);

    expect(screen.getByText(empty)).toBeInTheDocument();
    expect(screen.getByText(error)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: retry })).toBeInTheDocument();
    expect(screen.getByText(unavailable)).toBeInTheDocument();
  });
});
