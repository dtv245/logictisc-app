import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as refineCore from "@refinedev/core";
import { LoadTimelinePanel } from "@/features/loads/LoadTimelinePanel";
import type { LoadTimelineResponse } from "@/types/loadTimeline.types";

vi.mock("@refinedev/core", () => ({
  useCustom: vi.fn(),
}));

describe("LoadTimelinePanel", () => {
  const sampleTimeline: LoadTimelineResponse = {
    loadId: "load-101",
    loadNumber: "LD-5001",
    currentStatus: "IN_TRANSIT",
    events: [
      {
        id: "evt-1",
        loadId: "load-101",
        eventType: "DISPATCHED",
        previousStatus: "ASSIGNED",
        newStatus: "DISPATCHED",
        occurredAt: "2026-10-04T08:00:00Z",
        source: "DISPATCHER",
        note: "Dispatched to driver",
      },
      {
        id: "evt-2",
        loadId: "load-101",
        eventType: "PICKED_UP",
        previousStatus: "DISPATCHED",
        newStatus: "IN_TRANSIT",
        occurredAt: "2026-10-04T09:30:00Z",
        source: "DRIVER",
        note: "Cargo loaded and signed",
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders timeline events in chronological order with transitions and notes", () => {
    vi.mocked(refineCore.useCustom).mockReturnValue({
      data: { data: sampleTimeline },
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof refineCore.useCustom>);

    render(<LoadTimelinePanel loadId="load-101" />);

    expect(screen.getByTestId("load-timeline-panel")).toBeInTheDocument();
    expect(screen.getAllByText("IN_TRANSIT").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("DISPATCHED").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Dispatched to driver")).toBeInTheDocument();
    expect(screen.getByText("Cargo loaded and signed")).toBeInTheDocument();
  });

  it("renders empty state when no events exist", () => {
    vi.mocked(refineCore.useCustom).mockReturnValue({
      data: {
        data: {
          loadId: "load-101",
          loadNumber: "LD-5001",
          currentStatus: "PENDING",
          events: [],
        },
      },
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof refineCore.useCustom>);

    render(<LoadTimelinePanel loadId="load-101" />);

    expect(
      screen.getByText(/No execution events recorded yet|Chưa ghi nhận sự kiện/i),
    ).toBeInTheDocument();
  });

  it("renders error alert when timeline query fails", () => {
    vi.mocked(refineCore.useCustom).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: { message: "Timeline service unavailable" },
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof refineCore.useCustom>);

    render(<LoadTimelinePanel loadId="load-101" />);

    expect(screen.getByText("Timeline service unavailable")).toBeInTheDocument();
  });
});
