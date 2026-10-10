import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LoadShow } from "@/pages/loads/show";
import type { Load } from "@/types/load.types";

const mockRefetch = vi.fn();
const permissions = vi.hoisted(() => ({ can: true }));

const mockQueryResult: {
  data?: { data: Load };
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
  useCan: () => ({ data: { can: permissions.can } }),
  useShow: () => ({ queryResult: mockQueryResult }),
  useCustom: () => ({
    data: { data: [] },
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
  useList: () => ({
    data: { data: [] },
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
  useCustomMutation: () => ({
    mutateAsync: vi.fn(),
  }),
  useNotification: () => ({
    open: vi.fn(),
  }),
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

vi.mock("@/features/loads/LoadTimelinePanel", () => ({
  LoadTimelinePanel: ({ loadId }: { loadId: string }) => (
    <div data-testid="mock-timeline-panel">Timeline for {loadId}</div>
  ),
}));

vi.mock("@/features/loads/LoadFinancialPanel", () => ({
  LoadFinancialPanel: ({ loadId }: { loadId: string }) => (
    <div data-testid="mock-financial-panel">Financial for {loadId}</div>
  ),
}));

describe("LoadShow Page", () => {
  const sampleLoad: Load = {
    id: "load-101",
    number: 9001,
    name: "Express Freight",
    type: "dry_van",
    status: "dispatched",
    distance: 350,
    isInProximity: true,
    customerId: "cust-1",
    customerName: "Acme Logistics",
    assignedTruckId: "trk-1",
    assignedTruckNumber: "TRK-88",
    source: "manual",
    isHazmat: false,
    deliveryCostAmount: 1800, deliveryCostCurrency: "USD", version: 2,
    originAddressLine1: "123 Main St",
    originAddressCity: "Dallas",
    originAddressState: "TX",
    originAddressZipCode: "75001",
    originAddressCountry: "USA",
    originLocationLatitude: 32.77, originLocationLongitude: -96.79,
    destinationAddressLine1: "456 Port Rd",
    destinationAddressCity: "Houston",
    destinationAddressState: "TX",
    destinationAddressZipCode: "77001",
    destinationAddressCountry: "USA",
    destinationLocationLatitude: 29.76, destinationLocationLongitude: -95.36,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    permissions.can = true;
    mockQueryResult.isError = false;
    mockQueryResult.isLoading = false;
    delete mockQueryResult.error;
    mockQueryResult.data = { data: sampleLoad };
  });

  it("renders load header info with number, truck, and delivery cost", () => {
    render(<LoadShow />);

    expect(screen.getByTestId("show-header")).toHaveTextContent("Express Freight #9001");
    expect(screen.getByTestId("show-header")).toHaveTextContent("TRK-88");
    expect(screen.getByTestId("show-header")).toHaveTextContent("1,800 USD");
  });

  it("renders default Overview tab and switches to Timeline and Financials tabs", () => {
    render(<LoadShow />);

    // Default tab is Overview
    expect(screen.getByTestId("load-overview-panel")).toBeInTheDocument();
    expect(screen.queryByTestId("mock-timeline-panel")).not.toBeInTheDocument();

    // Click Timeline tab
    const timelineTab = screen.getByRole("tab", { name: /Timeline|Lịch trình/i });
    fireEvent.click(timelineTab);
    expect(screen.getByTestId("mock-timeline-panel")).toHaveTextContent("load-101");

    // Click Financials tab
    const financialTab = screen.getByRole("tab", { name: /Financials|Tài chính/i });
    fireEvent.click(financialTab);
    expect(screen.getByTestId("mock-financial-panel")).toHaveTextContent("load-101");
  });

  it("renders error alert with retry button when query fails", () => {
    mockQueryResult.isError = true;
    mockQueryResult.error = { message: "Load not found" };
    delete mockQueryResult.data;

    render(<LoadShow />);

    expect(screen.getByText("Load not found")).toBeInTheDocument();
    const retryBtn = screen.getByRole("button", { name: /Thử lại|Retry/i });
    fireEvent.click(retryBtn);

    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });

  it("hides the Financial tab and never mounts it without a confirmed capability", () => {
    permissions.can = false;
    render(<LoadShow />);
    expect(screen.queryByRole("tab", { name: /Financials|Tài chính/i })).not.toBeInTheDocument();
    expect(screen.queryByTestId("mock-financial-panel")).not.toBeInTheDocument();
  });
});
