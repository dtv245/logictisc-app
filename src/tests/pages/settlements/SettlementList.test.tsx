import { fireEvent, render as rtlRender, screen } from "@testing-library/react";
import { Refine } from "@refinedev/core";
import type { ReactNode } from "react";
import { createAccessControlProvider } from "@providers/accessControlProvider";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";

import { SettlementList } from "@/pages/settlements/SettlementList";
import type { DriverSettlementView } from "@/types/settlement.dto";

const mockUseSettlements = vi.fn();
const mockUsePayPeriods = vi.fn();
const mockUseDrivers = vi.fn();
const mockCalculateSettlement = vi.fn();

const render = (ui: ReactNode) => rtlRender(
  <Refine accessControlProvider={createAccessControlProvider({ getJwtRoles: async () => ["ACCOUNTANT"] })}>
    {ui}
  </Refine>,
);

vi.mock("@/features/settlements/settlement.query", () => ({
  useSettlements: (filters?: unknown) => mockUseSettlements(filters),
  usePayPeriods: () => mockUsePayPeriods(),
  useDrivers: () => mockUseDrivers(),
  useCalculateSettlement: () => ({
    calculateSettlement: mockCalculateSettlement,
    isCalculating: false,
  }),
}));

describe("SettlementList", () => {
  const sampleSettlements: DriverSettlementView[] = [
    {
      id: "ds-001",
      settlementNumber: "DS-2026-001",
      driverId: "drv-001",
      driverName: "Alex Driver",
      payPeriodId: "pp-001",
      payPeriodCode: "PP-2026-W40",
      settlementType: "ORIGINAL",
      status: "CALCULATED",
      currency: "USD",
      grossEarnings: 2450.0,
      reimbursementAmount: 150.0,
      deductionAmount: 100.0,
      settlementNet: 2500.0,
      calculatedAt: "2026-10-04T10:00:00Z",
      approvedAt: null,
      lockedAt: null,
    },
    {
      id: "ds-002",
      settlementNumber: "DS-2026-002",
      driverId: "drv-002",
      driverName: "Beth Runner",
      payPeriodId: "pp-001",
      payPeriodCode: "PP-2026-W40",
      settlementType: "ADJUSTMENT",
      status: "APPROVED",
      currency: "EUR",
      grossEarnings: 1200.0,
      reimbursementAmount: 0.0,
      deductionAmount: 50.0,
      settlementNet: 1150.0,
      calculatedAt: "2026-10-04T11:00:00Z",
      approvedAt: "2026-10-04T12:00:00Z",
      lockedAt: null,
    },
    {
      id: "ds-003",
      settlementNumber: "DS-2026-003",
      driverId: "drv-003",
      driverName: "Charlie Brown",
      payPeriodId: "pp-002",
      payPeriodCode: "PP-2026-W41",
      settlementType: "REVERSAL",
      status: "LOCKED",
      currency: "USD",
      grossEarnings: 800.0,
      reimbursementAmount: 0.0,
      deductionAmount: 0.0,
      settlementNet: 800.0,
      calculatedAt: "2026-10-04T13:00:00Z",
      approvedAt: "2026-10-04T14:00:00Z",
      lockedAt: "2026-10-04T15:00:00Z",
    },
  ];

  beforeEach(() => {
    mockUseSettlements.mockReturnValue({
      settlements: sampleSettlements,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });

    mockUsePayPeriods.mockReturnValue({
      payPeriods: [
        {
          id: "pp-001",
          periodCode: "PP-2026-W40",
          startDate: "2026-09-28",
          endDate: "2026-10-04",
          status: "OPEN",
        },
      ],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    mockUseDrivers.mockReturnValue({
      drivers: [
        { id: "drv-001", fullName: "Alex Driver" },
        { id: "drv-002", fullName: "Beth Runner" },
      ],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    mockCalculateSettlement.mockResolvedValue(sampleSettlements[0]);
  });

  it("renders settlements table with proper columns, data, and summary stats", () => {
    render(
      <MemoryRouter>
        <SettlementList />
      </MemoryRouter>
    );

    // Title and quick stats
    expect(screen.getByText("Driver Settlements")).toBeInTheDocument();
    expect(screen.getByText("Total Settlements")).toBeInTheDocument();
    expect(screen.queryByText("Total Gross Earnings")).not.toBeInTheDocument();
    expect(screen.queryByText("Total Net Payout")).not.toBeInTheDocument();

    // Table rows
    expect(screen.getByText("DS-2026-001")).toBeInTheDocument();
    expect(screen.getByText("Alex Driver")).toBeInTheDocument();
    expect(screen.getByText("DS-2026-002")).toBeInTheDocument();
    expect(screen.getByText("Beth Runner")).toBeInTheDocument();
    expect(screen.getByText("DS-2026-003")).toBeInTheDocument();

    // Status and type tags
    expect(screen.getByText("ORIGINAL")).toBeInTheDocument();
    expect(screen.getByText("ADJUSTMENT")).toBeInTheDocument();
    expect(screen.getByText("REVERSAL")).toBeInTheDocument();
    expect(screen.getByText("CALCULATED")).toBeInTheDocument();
    expect(screen.getByText("APPROVED")).toBeInTheDocument();
    expect(screen.getByText("LOCKED")).toBeInTheDocument();
  });

  it("preserves row currencies and backend net values without inventing a combined payout", () => {
    render(<MemoryRouter><SettlementList /></MemoryRouter>);
    expect(screen.getByText("€1,150.00")).toBeInTheDocument();
    expect(screen.getByText("$2,500.00")).toBeInTheDocument();
    expect(screen.queryByText("$4,450.00")).not.toBeInTheDocument();
    expect(screen.queryByText("Total Net Payout")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /edit/i })).not.toBeInTheDocument();
  });

  it("filters settlements table by search query", () => {
    render(
      <MemoryRouter>
        <SettlementList />
      </MemoryRouter>
    );

    const searchInput = screen.getByPlaceholderText(
      "Search by settlement #, driver, or pay period"
    );
    fireEvent.change(searchInput, { target: { value: "Beth" } });

    expect(screen.getByText("DS-2026-002")).toBeInTheDocument();
    expect(screen.queryByText("DS-2026-001")).not.toBeInTheDocument();
    expect(screen.queryByText("DS-2026-003")).not.toBeInTheDocument();
  });

  it("opens calculation modal and triggers settlement calculation", async () => {
    render(
      <MemoryRouter>
        <SettlementList />
      </MemoryRouter>
    );

    const calcBtn = await screen.findByText("Calculate Settlement");
    fireEvent.click(calcBtn);

    // Modal title is displayed
    expect(await screen.findByText("Calculate Driver Settlement")).toBeInTheDocument();
  });

  it("displays error banner when settlement fetch fails", () => {
    mockUseSettlements.mockReturnValue({
      settlements: [],
      isLoading: false,
      isError: true,
      error: { message: "Internal server error connecting to payroll service" },
      refetch: vi.fn(),
    });

    render(
      <MemoryRouter>
        <SettlementList />
      </MemoryRouter>
    );

    expect(screen.getByText("Failed to load settlements")).toBeInTheDocument();
    expect(
      screen.getByText("Internal server error connecting to payroll service")
    ).toBeInTheDocument();
  });
});
