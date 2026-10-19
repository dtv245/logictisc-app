import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { DispatchTimeline } from "@/features/dashboard/components/DispatchTimeline";
import type { DriverTimelineRow } from "@/types/dashboard/operations-panels.types";

const driver: DriverTimelineRow = { driverId: "test-driver", driverName: "Tài xế kiểm thử", vehiclePlate: "TEST-001", blocks: [
  { id: "past", driverId: "test-driver", startAt: "02:00", endAt: "03:00", kind: "scheduled", label: "Ngoài khung giờ" },
  { id: "clipped", driverId: "test-driver", startAt: "05:00", endAt: "08:00", kind: "active", label: "Chuyến đang chạy" },
  { id: "proposal", driverId: "test-driver", startAt: "13:00", endAt: "15:00", kind: "ai-suggested", label: "Chuyến đề xuất" },
] };

describe("DispatchTimeline", () => {
  it("does not inject drivers or a 214-driver total", () => {
    render(<MemoryRouter><DispatchTimeline /></MemoryRouter>);
    expect(screen.getByRole("status")).toHaveTextContent("Chưa có lịch điều phối");
    expect(screen.queryByText(/Nguyễn Văn Hùng|214|Marcus/)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Mở điều phối|Open dispatch/ })).not.toBeInTheDocument();
  });
  it("clips a partially visible block without inventing offscreen blocks", () => {
    render(<MemoryRouter><DispatchTimeline drivers={[driver]} now="11:58" /></MemoryRouter>);
    expect(screen.queryByText("Ngoài khung giờ")).not.toBeInTheDocument();
    expect(screen.getByRole("img", { name: /Chuyến đang chạy/ })).toHaveStyle({ left: "0%" });
    expect(screen.getByRole("img", { name: /Chuyến đề xuất/ })).toHaveClass("ops-timeline-block--ai-suggested");
    expect(screen.getByText("11:58")).toBeInTheDocument();
  });
  it("rejects an invalid time range instead of rendering invalid percentages", () => {
    render(<MemoryRouter><DispatchTimeline drivers={[driver]} startHour={18} endHour={6} /></MemoryRouter>);
    expect(screen.getByRole("alert")).toHaveTextContent("không hợp lệ");
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });
  it("does not display a marker outside the displayed day range", () => {
    render(<MemoryRouter><DispatchTimeline drivers={[driver]} now="23:30" /></MemoryRouter>);
    expect(screen.queryByText("23:30")).not.toBeInTheDocument();
  });
  it("hides stale rows while loading", () => {
    render(<MemoryRouter><DispatchTimeline drivers={[driver]} isLoading /></MemoryRouter>);
    expect(screen.getByRole("status")).toHaveTextContent("Đang tải");
    expect(screen.queryByText("Tài xế kiểm thử")).not.toBeInTheDocument();
  });
});
