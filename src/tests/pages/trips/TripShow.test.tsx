import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TripShow } from "@/pages/trips/show";

const mockRefetch = vi.fn();

const mockQueryResult: {
  data?: {
    data: {
      id: string;
      number: number;
      name: string;
      status: string;
      truckNumber: string;
      totalDistance: number;
      plannedDistanceMiles: number | null;
      actualDistanceMiles: number | null;
      loadedMiles: number | null;
      emptyMiles: number | null;
      dispatchedAt: string | null;
      completedAt: string | null;
      cancelledAt: string | null;
      createdAt: string;
    };
  };
  error?: { message: string };
  isError: boolean;
  isLoading: boolean;
  refetch: typeof mockRefetch;
} = {
  isError: false,
  isLoading: false,
  refetch: mockRefetch,
};

vi.mock("@refinedev/core", () => ({
  useShow: () => ({ queryResult: mockQueryResult }),
}));

vi.mock("@refinedev/antd", () => ({
  Show: ({ children, title }: { children: ReactNode; title?: ReactNode }) => (
    <div>
      <div data-testid="show-header">{title}</div>
      {children}
    </div>
  ),
  TextField: ({ value }: { value: unknown }) => <span>{String(value)}</span>,
}));

vi.mock("@/features/trips/TripStopsTimeline", () => ({
  TripStopsTimeline: ({ tripId }: { tripId: string }) => (
    <div data-testid="mock-stops-timeline">Stops Timeline for {tripId}</div>
  ),
}));

vi.mock("@/features/trips/TripDriverAssignments", () => ({
  TripDriverAssignments: ({ tripId }: { tripId: string }) => (
    <div data-testid="mock-driver-assignments">Driver Assignments for {tripId}</div>
  ),
}));

describe("TripShow Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockQueryResult.isError = false;
    mockQueryResult.isLoading = false;
    delete mockQueryResult.error;
    mockQueryResult.data = {
      data: {
        id: "trip-789",
        number: 4001,
        name: "Coast Express",
        status: "dispatched",
        truckNumber: "TRK-99",
        totalDistance: 750,
        plannedDistanceMiles: 750,
        actualDistanceMiles: 742,
        loadedMiles: 700,
        emptyMiles: 42,
        dispatchedAt: "2026-10-04T01:00:00Z",
        completedAt: null,
        cancelledAt: null,
        createdAt: "2026-10-03T10:00:00Z",
      },
    };
  });

  it("renders trip header info and mileage summary", () => {
    render(<TripShow />);

    expect(screen.getByTestId("show-header")).toHaveTextContent("Coast Express #4001");
    expect(screen.getByTestId("show-header")).toHaveTextContent("TRK-99");
    expect(screen.getByTestId("trip-mileage-summary")).toBeInTheDocument();
  });

  it("renders default Stops Timeline tab and switches to Driver Assignments tab", () => {
    render(<TripShow />);

    // Default tab is stops
    expect(screen.getByTestId("mock-stops-timeline")).toHaveTextContent("trip-789");
    expect(screen.queryByTestId("mock-driver-assignments")).not.toBeInTheDocument();

    // Click Driver Assignments tab
    const driverTab = screen.getByRole("tab", { name: /Driver Assignments/i });
    fireEvent.click(driverTab);

    expect(screen.getByTestId("mock-driver-assignments")).toHaveTextContent("trip-789");
  });

  it("renders error alert with retry button when query fails", () => {
    mockQueryResult.isError = true;
    mockQueryResult.error = { message: "Server connection failed" };
    delete mockQueryResult.data;

    render(<TripShow />);

    expect(screen.getByText("Server connection failed")).toBeInTheDocument();
    const retryBtn = screen.getByRole("button", { name: /Thử lại|Retry/i });
    fireEvent.click(retryBtn);

    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });
});
