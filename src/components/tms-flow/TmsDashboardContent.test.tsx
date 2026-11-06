import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import { TmsDashboardContent } from "@/components/tms-flow/TmsDashboardContent";
import type { TmsDashboardModel } from "@/hooks/tms-flow/useTmsDashboard";

vi.mock("@/components/tms-flow/TmsFleetMap", () => ({
  TmsFleetMap: () => <div data-testid="fleet-map-mock" />,
}));
vi.mock("@/components/tms-flow/TmsTimeline", () => ({
  TmsTimeline: () => <div data-testid="timeline-mock" />,
}));

const baseDashboard = (): TmsDashboardModel => ({
  workspace: {
    isRefreshing: false,
    refreshFailed: false,
    riskShipments: [],
    trucks: { data: { items: [] }, isLoading: false },
    trucksError: null,
  },
  primary: undefined,
  nextAction: { kind: "none" },
  timeline: { data: { events: [] }, isLoading: false, error: null },
  counts: {
    attention: { state: "unavailable", reason: "attention-filter-unavailable" },
    unassigned: { state: "unavailable", reason: "unassigned-filter-unavailable" },
    overdue: { state: "unavailable", reason: "server-filter-unavailable" },
    pending: { state: "ready", value: 0 },
    inTransit: { state: "unavailable", reason: "lifecycle-filter-unavailable" },
  },
  isPriorityLoading: false,
  updatedAt: undefined,
  refreshFailed: false,
} as unknown as TmsDashboardModel);

function LocationReadout() {
  const location = useLocation();
  return <output data-testid="location-readout">{location.pathname}{location.search}</output>;
}

describe("TmsDashboardContent", () => {
  it("shows an em dash and an unavailable message when a count API fails", () => {
    const dashboard = baseDashboard();
    dashboard.counts.attention = { state: "error" };
    dashboard.counts.pending = { state: "error" };
    dashboard.counts.inTransit = { state: "error" };

    render(<MemoryRouter><TmsDashboardContent dashboard={dashboard} /></MemoryRouter>);

    const attention = screen.getByTestId("dashboard-kpi-at-risk");
    expect(within(attention).getByText("—")).toBeInTheDocument();
    expect(attention).toHaveTextContent("Chưa lấy được");
    const pending = screen.getByTestId("dashboard-kpi-pending");
    expect(within(pending).getByText("—")).toBeInTheDocument();
    expect(pending).toHaveTextContent("Chưa lấy được");
    expect(within(screen.getByTestId("dashboard-kpi-in-transit")).getByText("—")).toBeInTheDocument();
    expect(screen.queryByText("0 lô cần ưu tiên xử lý.")).not.toBeInTheDocument();
  });

  it("says there is no work only when both exact server queues are empty", () => {
    const dashboard = baseDashboard();
    dashboard.counts.attention = { state: "ready", value: 0 };
    dashboard.counts.unassigned = { state: "ready", value: 0 };
    render(<MemoryRouter><TmsDashboardContent dashboard={dashboard} /></MemoryRouter>);

    expect(screen.getByText("Không có lô nào cần xử lý.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Bắt đầu xử lý" })).not.toBeInTheDocument();
  });

  it("opens the matching dispatch filter from the overdue card", () => {
    render(
      <MemoryRouter>
        <TmsDashboardContent dashboard={baseDashboard()} />
        <LocationReadout />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByTestId("dashboard-kpi-overdue"));
    expect(screen.getByTestId("location-readout")).toHaveTextContent("/tms/dispatch?filter=overdue");
  });

  it("shows a reason beside lifecycle counts that cannot be filtered accurately", () => {
    render(<MemoryRouter><TmsDashboardContent dashboard={baseDashboard()} /></MemoryRouter>);

    const attention = screen.getByTestId("dashboard-kpi-at-risk");
    const unassigned = screen.getByTestId("dashboard-kpi-unassigned");
    const overdue = screen.getByTestId("dashboard-kpi-overdue");
    const transit = screen.getByTestId("dashboard-kpi-in-transit");
    expect(within(attention).getByText("—")).toBeInTheDocument();
    expect(attention).toHaveTextContent("Chưa thể đếm chính xác vì máy chủ chưa cho lọc danh sách theo lý do cần chú ý.");
    expect(within(unassigned).getByText("—")).toBeInTheDocument();
    expect(unassigned).toHaveTextContent("Chưa thể đếm chính xác vì bộ lọc Refine chưa hỗ trợ giá trị xe trống.");
    expect(within(overdue).getByText("—")).toBeInTheDocument();
    expect(overdue).toHaveTextContent("Chưa thể đếm vì bộ lọc hạn lấy/giao chưa được cho phép trên máy chủ.");
    expect(within(transit).getByText("—")).toBeInTheDocument();
    expect(transit).toHaveTextContent("Chưa thể đếm chính xác vì trạng thái lấy/giao chưa có bộ lọc vòng đời trên máy chủ.");
  });
});
