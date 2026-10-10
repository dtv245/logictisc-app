import { fireEvent, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { FleetKpiGrid } from "@/features/fleet/FleetKpiGrid";
import { FleetHealthTable } from "@/features/fleet/FleetHealthTable";
import { fleetMetric, fleetReport, fleetTruckId } from "@/tests/fixtures/fleet";
import { renderFinance } from "@/tests/fixtures/FinanceTestHarness";
const metric = (code = "FLEET_UTILIZATION_PERCENT") => within(screen.getByTestId(`fleet-metric-${code}`));
describe("FleetKpiGrid", () => {
  it("shows independent backend percentages and raw numerator/denominator without deriving totals", async () => {
    await renderFinance(<FleetKpiGrid report={fleetReport} />, vi.fn());
    expect(metric().getByText("50%")).toBeInTheDocument(); expect(metric("LOADED_MILES_PERCENT").getByText("70%")).toBeInTheDocument();
    expect(metric("DEADHEAD_PERCENT").getByText("25%")).toBeInTheDocument(); expect(screen.queryByText("30%")).not.toBeInTheDocument(); expect(metric().getByText(/10 \/ 20/)).toBeInTheDocument();
    expect(metric("PM_COMPLIANCE").getByText("Historical PM due occurrences are unavailable.")).toBeInTheDocument(); expect(metric("MAINTENANCE_COST_PER_MILE").getByText("—")).toBeInTheDocument();
  });
  it.each(["AVAILABLE", "PARTIAL", "UNAVAILABLE", "NOT_APPLICABLE"] as const)("preserves %s availability and shows only qualified values", async (availability) => {
    await renderFinance(<FleetKpiGrid report={{ ...fleetReport, utilization: fleetMetric("FLEET_UTILIZATION_PERCENT", "0", { availability }) }} />, vi.fn());
    expect(metric().getByText(({ AVAILABLE: "Available", PARTIAL: "Partial", UNAVAILABLE: "Unavailable", NOT_APPLICABLE: "Not Applicable" })[availability])).toBeInTheDocument();
    expect(metric().getByText(["AVAILABLE", "PARTIAL"].includes(availability) ? "0%" : "—")).toBeInTheDocument();
  });
  it.each([null, "NaN", "not-a-number", "Infinity"])("does not turn invalid/missing value %s into zero", async (value) => {
    await renderFinance(<FleetKpiGrid report={{ ...fleetReport, utilization: fleetMetric("FLEET_UTILIZATION_PERCENT", value) }} />, vi.fn());
    expect(metric().getByText("—")).toBeInTheDocument(); expect(metric().queryByText("0%")).not.toBeInTheDocument();
  });
  it("keeps backend basis/reasons and monetary units without inventing a currency", async () => {
    await renderFinance(<FleetKpiGrid report={{ ...fleetReport, utilization: fleetMetric("FLEET_UTILIZATION_PERCENT", null, { availability: "UNAVAILABLE", reason: "NO_AVAILABILITY_HISTORY;SOURCE_CAPACITY_CONFLICT;FUTURE_REASON" }),
      health: [fleetMetric("MAINTENANCE_COST_PER_MILE", "0.125", { unit: "MONEY_PER_MILE" })] }} />, vi.fn());
    expect(metric().getByText(/No availability history.*Conflicting capacity evidence.*FUTURE_REASON/)).toBeInTheDocument();
    expect(metric("MAINTENANCE_COST_PER_MILE").getByText("0.125")).toBeInTheDocument(); expect(screen.queryByText(/USD|VND|\$/)).not.toBeInTheDocument();
  });
  it("pages backend-provided coverage rows locally without row requests or calculating ratios", async () => {
    const request = vi.fn(); const coverage = Array.from({ length: 21 }, (_, index) => ({ ...fleetReport.coverage[0]!, truckId: `${fleetTruckId}-${index}` }));
    await renderFinance(<FleetHealthTable coverage={coverage} />, request);
    expect(screen.getByText(`${fleetTruckId}-0`)).toBeInTheDocument(); expect(screen.queryByText(`${fleetTruckId}-20`)).not.toBeInTheDocument();
    fireEvent.click(screen.getByTitle("2")); expect(await screen.findByText(`${fleetTruckId}-20`)).toBeInTheDocument(); expect(request).not.toHaveBeenCalled();
  });
});
