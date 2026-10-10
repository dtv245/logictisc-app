import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TripStopActions } from "@/features/trips/TripStopActions";
import type { TripStopExecution } from "@/types/tripExecution.types";

const createMockStop = (status: string): TripStopExecution => ({
  id: "stop-123",
  tripId: "trip-456",
  order: 1,
  type: "PICKUP",
  status,
});

describe("TripStopActions", () => {
  it("renders Arrive button for PENDING and EN_ROUTE status", () => {
    const onTransition = vi.fn().mockResolvedValue(true);

    const { rerender } = render(
      <TripStopActions
        stop={createMockStop("PENDING")}
        onTransition={onTransition}
      />,
    );
    expect(screen.getByRole("button", { name: /Arrive/i })).toBeInTheDocument();

    rerender(
      <TripStopActions
        stop={createMockStop("EN_ROUTE")}
        onTransition={onTransition}
      />,
    );
    expect(screen.getByRole("button", { name: /Arrive/i })).toBeInTheDocument();
  });

  it("renders Start Service button for ARRIVED status", () => {
    const onTransition = vi.fn().mockResolvedValue(true);
    render(
      <TripStopActions
        stop={createMockStop("ARRIVED")}
        onTransition={onTransition}
      />,
    );
    expect(
      screen.getByRole("button", { name: /Start Service/i }),
    ).toBeInTheDocument();
  });

  it("renders Complete Service button for SERVICE_STARTED status", () => {
    const onTransition = vi.fn().mockResolvedValue(true);
    render(
      <TripStopActions
        stop={createMockStop("SERVICE_STARTED")}
        onTransition={onTransition}
      />,
    );
    expect(
      screen.getByRole("button", { name: /Complete Service/i }),
    ).toBeInTheDocument();
  });

  it("renders Depart button for SERVICE_COMPLETED status", () => {
    const onTransition = vi.fn().mockResolvedValue(true);
    render(
      <TripStopActions
        stop={createMockStop("SERVICE_COMPLETED")}
        onTransition={onTransition}
      />,
    );
    expect(
      screen.getByRole("button", { name: /Depart/i }),
    ).toBeInTheDocument();
  });

  it("renders read-only tag and no action button for DEPARTED status", () => {
    const onTransition = vi.fn().mockResolvedValue(true);
    render(
      <TripStopActions
        stop={createMockStop("DEPARTED")}
        onTransition={onTransition}
      />,
    );
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.getByTestId("stop-status-departed")).toBeInTheDocument();
  });

  it("calls onTransition with proper action when button is clicked", () => {
    const onTransition = vi.fn().mockResolvedValue(true);
    render(
      <TripStopActions
        stop={createMockStop("ARRIVED")}
        onTransition={onTransition}
      />,
    );

    const btn = screen.getByRole("button", { name: /Start Service/i });
    fireEvent.click(btn);

    expect(onTransition).toHaveBeenCalledTimes(1);
    expect(onTransition).toHaveBeenCalledWith("startService", "stop-123");
  });

  it("disables button when isSubmitting is true", () => {
    const onTransition = vi.fn().mockResolvedValue(true);
    render(
      <TripStopActions
        stop={createMockStop("PENDING")}
        onTransition={onTransition}
        isSubmitting={true}
      />,
    );

    const btn = screen.getByRole("button", { name: /Arrive/i });
    expect(btn).toBeDisabled();
  });

  it("does not render any status dropdown select element", () => {
    const onTransition = vi.fn().mockResolvedValue(true);
    render(
      <TripStopActions
        stop={createMockStop("ARRIVED")}
        onTransition={onTransition}
      />,
    );

    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });
});
