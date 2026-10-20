import { render, screen } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import { beforeAll, describe, expect, it } from "vitest";
import { initializeAppI18n } from "@/locales";
import { KpiStrip } from "@/features/dashboard/components/KpiStrip";

let i18n: Awaited<ReturnType<typeof initializeAppI18n>>;

beforeAll(async () => {
  i18n = await initializeAppI18n({ locale: "vi", fallbackLocale: "en" });
});

describe("KpiStrip data truth", () => {
  it("labels an unavailable KPI instead of presenting a fallback value", () => {
    render(<I18nextProvider i18n={i18n}><KpiStrip items={[{ label: "Đang trên đường", value: null, state: "unavailable" }]} /></I18nextProvider>);

    expect(screen.getByText("Đang trên đường")).toBeInTheDocument();
    expect(screen.getByText("—")).toBeInTheDocument();
    expect(screen.getByText("Chưa có dữ liệu được xác nhận")).toBeInTheDocument();
  });
});
