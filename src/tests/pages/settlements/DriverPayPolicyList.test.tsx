import { fireEvent, render as rtlRender, screen } from "@testing-library/react";
import { Refine } from "@refinedev/core";
import type { ReactNode } from "react";
import { createAccessControlProvider } from "@providers/accessControlProvider";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";

import { DriverPayPolicyList } from "@/pages/settlements/DriverPayPolicyList";
import type { DriverPayPolicyView } from "@/types/driverPayPolicy.dto";

const mockUseDriverPayPolicies = vi.fn();
const mockUseDriverPayPolicyMutations = vi.fn();

const render = (ui: ReactNode) => rtlRender(
  <Refine accessControlProvider={createAccessControlProvider({ getJwtRoles: async () => ["ACCOUNTANT"] })}>
    {ui}
  </Refine>,
);

vi.mock("@/features/settlements/driverPayPolicy.query", () => ({
  useDriverPayPolicies: () => mockUseDriverPayPolicies(),
  useDriverPayPolicyMutations: () => mockUseDriverPayPolicyMutations(),
}));

describe("DriverPayPolicyList", () => {
  const samplePolicies: DriverPayPolicyView[] = [
    {
      id: "pol-v1",
      policyCode: "POL-001",
      name: "Standard Mileage Policy v1",
      driverId: null,
      payMethod: "PER_MILE",
      perMileRate: 0.65,
      perLoadRate: null,
      hourlyRate: null,
      dailyRate: null,
      flatRate: null,
      revenuePercentage: null,
      mileageBasis: "ACTUAL_ALL_MILES",
      revenueBasis: null,
      detentionRate: 35,
      detentionFreeMinutes: 120,
      detentionBlockMinutes: 15,
      layoverRate: 100,
      stopPayRate: 20,
      currency: "USD",
      effectiveFrom: "2025-01-01",
      effectiveTo: "2025-12-31",
      policyVersion: 1,
      active: true,
    },
    {
      id: "pol-v2",
      policyCode: "POL-001",
      name: "Standard Mileage Policy v2",
      driverId: null,
      payMethod: "PER_MILE",
      perMileRate: 0.72,
      perLoadRate: null,
      hourlyRate: null,
      dailyRate: null,
      flatRate: null,
      revenuePercentage: null,
      mileageBasis: "ACTUAL_ALL_MILES",
      revenueBasis: null,
      detentionRate: 40,
      detentionFreeMinutes: 120,
      detentionBlockMinutes: 15,
      layoverRate: 120,
      stopPayRate: 25,
      currency: "USD",
      effectiveFrom: "2026-01-01",
      effectiveTo: null,
      policyVersion: 2,
      active: true,
    },
    {
      id: "pol-pct",
      policyCode: "POL-002",
      name: "Owner Operator Percent Revenue",
      driverId: "drv-999",
      payMethod: "PERCENT_REVENUE",
      perMileRate: null,
      perLoadRate: null,
      hourlyRate: null,
      dailyRate: null,
      flatRate: null,
      revenuePercentage: 0.28, // 28%
      mileageBasis: null,
      revenueBasis: "INVOICE_SUBTOTAL",
      detentionRate: 50,
      detentionFreeMinutes: 60,
      detentionBlockMinutes: 30,
      layoverRate: 150,
      stopPayRate: 30,
      currency: "USD",
      effectiveFrom: "2026-02-01",
      effectiveTo: null,
      policyVersion: 1,
      active: true,
    },
  ];

  beforeEach(() => {
    mockUseDriverPayPolicies.mockReturnValue({
      policies: samplePolicies,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });

    mockUseDriverPayPolicyMutations.mockReturnValue({
      createPolicy: vi.fn(),
      createNewVersion: vi.fn(),
      isSubmitting: false,
    });
  });

  it("renders list showing latest version of each policyCode", () => {
    render(
      <MemoryRouter>
        <DriverPayPolicyList />
      </MemoryRouter>
    );

    // Latest version of POL-001 is v2
    expect(screen.getByText("Standard Mileage Policy v2")).toBeInTheDocument();
    // Total versions count displayed
    expect(screen.getByText(/2 versions/i)).toBeInTheDocument();

    // POL-002 is shown
    expect(screen.getByText("Owner Operator Percent Revenue")).toBeInTheDocument();
    expect(screen.getByText("Specific Driver")).toBeInTheDocument();
  });

  it("opens version history modal showing all versions when History is clicked", async () => {
    render(
      <MemoryRouter>
        <DriverPayPolicyList />
      </MemoryRouter>
    );

    const historyButtons = screen.getAllByText("History");
    fireEvent.click(historyButtons[0]);

    // Modal title displays policy code
    expect(screen.getByText(/Version History:/i)).toBeInTheDocument();
    // Modal table contains both v1 and v2
    expect(screen.getByText("Standard Mileage Policy v1")).toBeInTheDocument();
    expect(screen.getAllByText("Standard Mileage Policy v2").length).toBe(2);
    // Historical v1 is marked as Read-Only
    expect(screen.getByText("Read-Only")).toBeInTheDocument();
  });

  it("filters policies by search term", () => {
    render(
      <MemoryRouter>
        <DriverPayPolicyList />
      </MemoryRouter>
    );

    const searchInput = screen.getByPlaceholderText("Search by code or name");
    fireEvent.change(searchInput, { target: { value: "POL-002" } });

    expect(screen.getByText("Owner Operator Percent Revenue")).toBeInTheDocument();
    expect(screen.queryByText("Standard Mileage Policy v2")).not.toBeInTheDocument();
  });
});
