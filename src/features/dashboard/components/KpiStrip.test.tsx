import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { KpiStrip } from "@/features/dashboard/components/KpiStrip";

describe("KpiStrip data truth", () => {
  it("labels an unavailable KPI instead of presenting a fallback value", () => {
    render(<KpiStrip items={[{ label: "Đang trên đường", value: null, state: "unavailable" }]} />);

    expect(screen.getByText("Đang trên đường")).toBeInTheDocument();
    expect(screen.getByText("—")).toBeInTheDocument();
    expect(screen.getByText("Chưa có dữ liệu được xác nhận")).toBeInTheDocument();
  });
});
