import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { TripShow } from "@/pages/trips/show";

vi.mock("@refinedev/core", () => ({ useShow: () => ({ queryResult: { data: { data: { id: "1", number: 38, name: "Chuyến", status: "PLANNED", completedAt: "2026-11-01T00:00:00Z" } } } }) }));
vi.mock("@refinedev/antd", () => ({ Show: ({ children }: { children: ReactNode }) => <div>{children}</div>, TextField: ({ value }: { value: ReactNode }) => <span>{value}</span> }));
vi.mock("@/features/trips/components/TripStopsTimeline", () => ({ TripStopsTimeline: () => null }));
vi.mock("@/features/trips/components/TripMileageSummary", () => ({ TripMileageSummary: () => null }));

describe("thông tin hoàn tất chuyến", () => {
  it("cảnh báo khi chuyến chưa hoàn tất đã có thời điểm hoàn tất", () => {
    render(<TripShow />);
    // Cảnh báo phải thấy ngay, không nằm sau tab Chi tiết.
    expect(screen.getByText(/Dữ liệu không nhất quán/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("tab", { name: /chi tiết đầy đủ|full details/i }));
    expect(screen.getByText(/Dữ liệu không nhất quán/)).toBeInTheDocument();
    // Timestamp vẫn được hiển thị, kèm nhãn cảnh báo thay vì bị ẩn.
    expect(screen.getByText("Không nhất quán")).toBeInTheDocument();
  });
});
