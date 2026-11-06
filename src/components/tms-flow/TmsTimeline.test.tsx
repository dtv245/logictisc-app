import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { TmsTimelineEvent } from "@/types/tms-flow/tmsFlow.types";
import { TmsTimeline } from "./TmsTimeline";

const events: TmsTimelineEvent[] = Array.from({ length: 4 }, (_, index) => ({
  id: `event-${index + 1}`,
  loadId: "load-1",
  eventType: "STATUS_UPDATED",
  occurredAt: `2026-11-0${index + 1}T10:00:00Z`,
}));

describe("TmsTimeline dispatch compact history", () => {
  it("shows three newest events first and reveals the rest on request", () => {
    render(<TmsTimeline collapsible events={events} />);

    expect(screen.getByTestId("timeline-event-event-4")).toBeInTheDocument();
    expect(screen.getByTestId("timeline-event-event-3")).toBeInTheDocument();
    expect(screen.getByTestId("timeline-event-event-2")).toBeInTheDocument();
    expect(screen.queryByTestId("timeline-event-event-1")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Xem thêm" }));

    expect(screen.getByTestId("timeline-event-event-1")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Thu gọn" })).toBeInTheDocument();
  });

  it("preserves event order for existing non-collapsible timelines", () => {
    render(<TmsTimeline events={events} />);

    expect(screen.getAllByTestId(/^timeline-event-/).map((item) => item.getAttribute("data-testid"))).toEqual([
      "timeline-event-event-1",
      "timeline-event-event-2",
      "timeline-event-event-3",
      "timeline-event-event-4",
    ]);
  });

  it("translates transition enums and avoids exposing raw status codes", () => {
    render(
      <TmsTimeline
        events={[{
          ...events[0]!,
          eventType: "STATUS_CHANGED",
          previousStatus: "OPEN",
          newStatus: "IN_TRANSIT",
        }]}
      />,
    );

    expect(screen.getByText("Đổi trạng thái: Mới tạo, chưa xử lý → Đang giao")).toBeInTheDocument();
    expect(screen.queryByText(/OPEN|IN_TRANSIT/)).not.toBeInTheDocument();
  });
});
