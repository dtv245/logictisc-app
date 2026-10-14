import { fireEvent, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { FleetKpiGrid } from "@/features/fleet/components/FleetKpiGrid";
import { FleetHealthTable } from "@/features/fleet/components/FleetHealthTable";
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
  it("separates operational KPIs and maintenance health into distinct sections", async () => {
    await renderFinance(<FleetKpiGrid report={fleetReport} />, vi.fn());
    expect(screen.getByRole("heading", { name: "Operational KPIs" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Maintenance Health" })).toBeInTheDocument();
  });
  it("renders all 4 maintenance metrics as honest unavailable cards with explanation and never fake zero", async () => {
    await renderFinance(<FleetKpiGrid report={fleetReport} />, vi.fn());
    const codes = ["UNPLANNED_DOWNTIME", "PM_COMPLIANCE", "MAINTENANCE_COST_PER_MILE", "BREAKDOWNS_PER_100K_MILES"] as const;
    for (const code of codes) {
      const card = metric(code);
      expect(card.getByText("Unavailable")).toBeInTheDocument();
      expect(card.getByText("This metric will be available when the periodic maintenance module is connected")).toBeInTheDocument();
      expect(card.getByText("—")).toBeInTheDocument();
      expect(card.queryByText("0")).not.toBeInTheDocument();
      expect(card.queryByText("0%")).not.toBeInTheDocument();
    }
  });
  it("switches FleetMetricCard cleanly from unavailable to available by changing status, value and unit without layout alteration", async () => {
    await renderFinance(
      <FleetKpiGrid
        report={{
          ...fleetReport,
          health: [
            fleetMetric("UNPLANNED_DOWNTIME", "3600", { unit: "SECOND", availability: "AVAILABLE" }),
            fleetMetric("PM_COMPLIANCE", "95.5", { unit: "PERCENT", availability: "AVAILABLE" }),
            fleetMetric("MAINTENANCE_COST_PER_MILE", "0.25", { unit: "MONEY_PER_MILE", availability: "AVAILABLE" }),
            fleetMetric("BREAKDOWNS_PER_100K_MILES", "1.5", { unit: "COUNT_PER_100K_MILES", availability: "AVAILABLE" }),
          ],
        }}
      />,
      vi.fn()
    );
    const downtime = metric("UNPLANNED_DOWNTIME");
    expect(downtime.getByText("Available")).toBeInTheDocument();
    expect(downtime.getByText("3600")).toBeInTheDocument();
    expect(downtime.queryByText("This metric will be available when the periodic maintenance module is connected")).not.toBeInTheDocument();

    const pm = metric("PM_COMPLIANCE");
    expect(pm.getByText("Available")).toBeInTheDocument();
    expect(pm.getByText("95.5%")).toBeInTheDocument();

    const cost = metric("MAINTENANCE_COST_PER_MILE");
    expect(cost.getByText("Available")).toBeInTheDocument();
    expect(cost.getByText("0.25")).toBeInTheDocument();

    const breakdowns = metric("BREAKDOWNS_PER_100K_MILES");
    expect(breakdowns.getByText("Available")).toBeInTheDocument();
    expect(breakdowns.getByText("1.5")).toBeInTheDocument();
  });

  it("provides formula and period tooltips on operational KPI cards (Requirement 1)", async () => {
    await renderFinance(<FleetKpiGrid report={fleetReport} />, vi.fn());

    // Utilization: Productive/Capacity seconds
    const utilCard = metric("FLEET_UTILIZATION_PERCENT");
    const utilInfo = utilCard.getByTestId("fleet-metric-info-FLEET_UTILIZATION_PERCENT");
    expect(utilInfo).toHaveAttribute("title", expect.stringContaining("Productive/Capacity seconds"));
    expect(utilInfo).toHaveAttribute("title", expect.stringMatching(/2026/));

    // Loaded miles: Loaded/(Loaded+Empty)
    const loadedCard = metric("LOADED_MILES_PERCENT");
    const loadedInfo = loadedCard.getByTestId("fleet-metric-info-LOADED_MILES_PERCENT");
    expect(loadedInfo).toHaveAttribute("title", expect.stringContaining("Loaded/(Loaded+Empty)"));
    expect(loadedInfo).toHaveAttribute("title", expect.stringMatching(/2026/));

    // Deadhead: Empty/Actual
    const deadheadCard = metric("DEADHEAD_PERCENT");
    const deadheadInfo = deadheadCard.getByTestId("fleet-metric-info-DEADHEAD_PERCENT");
    expect(deadheadInfo).toHaveAttribute("title", expect.stringContaining("Empty/Actual"));
    expect(deadheadInfo).toHaveAttribute("title", expect.stringMatching(/2026/));
  });

  it("maps FLEET_MILEAGE_ATTRIBUTION_REQUIRED to warning and attribution action for permitted users (Requirement 2)", async () => {
    const onNavigate = vi.fn();
    await renderFinance(
      <FleetKpiGrid
        report={{
          ...fleetReport,
          loadedMilesPercent: fleetMetric("LOADED_MILES_PERCENT", null, {
            availability: "UNAVAILABLE",
            reason: "FLEET_MILEAGE_ATTRIBUTION_REQUIRED",
          }),
        }}
        onNavigateMileageAttributions={onNavigate}
      />,
      vi.fn(),
      { role: "ADMIN" }
    );

    const loadedCard = metric("LOADED_MILES_PERCENT");
    expect(loadedCard.getByText("Chưa xác nhận dặm cho các chuyến trong kỳ")).toBeInTheDocument();
    expect(loadedCard.getByText("—")).toBeInTheDocument();
    expect(loadedCard.queryByText("0%")).not.toBeInTheDocument();

    const button = await loadedCard.findByRole("button", { name: "Nhập phân bổ dặm" });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute("data-endpoint", "/api/fleet/mileage-attributions");
    fireEvent.click(button);
    expect(onNavigate).toHaveBeenCalledTimes(1);
  });

  it("hides attribution action button when user does not have permission (Requirement 2)", async () => {
    await renderFinance(
      <FleetKpiGrid
        report={{
          ...fleetReport,
          loadedMilesPercent: fleetMetric("LOADED_MILES_PERCENT", null, {
            availability: "UNAVAILABLE",
            reason: "FLEET_MILEAGE_ATTRIBUTION_REQUIRED",
          }),
        }}
      />,
      vi.fn(),
      { role: "DRIVER" }
    );

    const loadedCard = metric("LOADED_MILES_PERCENT");
    expect(loadedCard.getByText("Chưa xác nhận dặm cho các chuyến trong kỳ")).toBeInTheDocument();
    expect(loadedCard.queryByRole("button", { name: "Nhập phân bổ dặm" })).not.toBeInTheDocument();
  });

  it("maps ACTUAL_MILEAGE_HISTORY_UNAVAILABLE to message and non-speculation explanation (Requirement 2)", async () => {
    await renderFinance(
      <FleetKpiGrid
        report={{
          ...fleetReport,
          deadheadPercent: fleetMetric("DEADHEAD_PERCENT", null, {
            availability: "UNAVAILABLE",
            reason: "ACTUAL_MILEAGE_HISTORY_UNAVAILABLE",
          }),
        }}
      />,
      vi.fn()
    );

    const deadheadCard = metric("DEADHEAD_PERCENT");
    expect(deadheadCard.getByText("Chưa có lịch sử dặm thực tế cho kỳ này")).toBeInTheDocument();
    expect(deadheadCard.getByText("Hệ thống không suy đoán từ trạng thái xe hiện tại.")).toBeInTheDocument();
    expect(deadheadCard.getByText("—")).toBeInTheDocument();
    expect(deadheadCard.queryByText("0%")).not.toBeInTheDocument();
  });

  it("shows unknown statuses/reasons verbatim without crashing (Requirement 2)", async () => {
    await renderFinance(
      <FleetKpiGrid
        report={{
          ...fleetReport,
          utilization: fleetMetric("FLEET_UTILIZATION_PERCENT", null, {
            availability: "UNAVAILABLE",
            reason: "CUSTOM_UNKNOWN_BACKEND_STATUS_CODE",
          }),
        }}
      />,
      vi.fn()
    );

    const utilCard = metric("FLEET_UTILIZATION_PERCENT");
    expect(utilCard.getByText("CUSTOM_UNKNOWN_BACKEND_STATUS_CODE")).toBeInTheDocument();
    expect(utilCard.getByText("—")).toBeInTheDocument();
    expect(utilCard.queryByText("0%")).not.toBeInTheDocument();
  });

  it("strictly distinguishes true zero, missing data, and not applicable (Requirement 3)", async () => {
    await renderFinance(
      <FleetKpiGrid
        report={{
          ...fleetReport,
          utilization: fleetMetric("FLEET_UTILIZATION_PERCENT", "0", { availability: "AVAILABLE" }),
          loadedMilesPercent: fleetMetric("LOADED_MILES_PERCENT", null, { availability: "UNAVAILABLE", reason: "FLEET_MILEAGE_ATTRIBUTION_REQUIRED" }),
          deadheadPercent: fleetMetric("DEADHEAD_PERCENT", null, { availability: "NOT_APPLICABLE" }),
        }}
      />,
      vi.fn()
    );

    // 1. "bằng 0 thật": has qualified data, result is 0
    const utilCard = metric("FLEET_UTILIZATION_PERCENT");
    expect(utilCard.getByText("0%")).toBeInTheDocument();
    expect(utilCard.getByText("Available")).toBeInTheDocument();
    expect(utilCard.getByTestId("fleet-metric-updated-FLEET_UTILIZATION_PERCENT")).toBeInTheDocument();

    // 2. "chưa có dữ liệu": unavailable, shows "—", never "0%"
    const loadedCard = metric("LOADED_MILES_PERCENT");
    expect(loadedCard.getByText("—")).toBeInTheDocument();
    expect(loadedCard.queryByText("0%")).not.toBeInTheDocument();
    expect(loadedCard.getByText("Unavailable")).toBeInTheDocument();
    expect(loadedCard.queryByTestId("fleet-metric-updated-LOADED_MILES_PERCENT")).not.toBeInTheDocument();

    // 3. "không áp dụng": not applicable, shows "—", never "0%"
    const deadheadCard = metric("DEADHEAD_PERCENT");
    expect(deadheadCard.getByText("—")).toBeInTheDocument();
    expect(deadheadCard.queryByText("0%")).not.toBeInTheDocument();
    expect(deadheadCard.getByText("Not Applicable")).toBeInTheDocument();
    expect(deadheadCard.queryByTestId("fleet-metric-updated-DEADHEAD_PERCENT")).not.toBeInTheDocument();
  });

  it("provides comprehensive aria-labels with metric name, value or status on every card (Requirement 4)", async () => {
    await renderFinance(
      <FleetKpiGrid
        report={{
          ...fleetReport,
          utilization: fleetMetric("FLEET_UTILIZATION_PERCENT", "50.00", { availability: "AVAILABLE" }),
          loadedMilesPercent: fleetMetric("LOADED_MILES_PERCENT", null, {
            availability: "UNAVAILABLE",
            reason: "FLEET_MILEAGE_ATTRIBUTION_REQUIRED",
          }),
          deadheadPercent: fleetMetric("DEADHEAD_PERCENT", null, { availability: "NOT_APPLICABLE" }),
        }}
      />,
      vi.fn()
    );

    // Card with value: reads name and value
    const utilCard = screen.getByTestId("fleet-metric-FLEET_UTILIZATION_PERCENT");
    expect(utilCard).toHaveAttribute("aria-label", "Fleet Utilization: 50%");

    // Card with unavailable reason: reads name and status with reason
    const loadedCard = screen.getByTestId("fleet-metric-LOADED_MILES_PERCENT");
    expect(loadedCard).toHaveAttribute(
      "aria-label",
      "Loaded Miles: Unavailable - Chưa xác nhận dặm cho các chuyến trong kỳ"
    );

    // Card with not applicable: reads name and status
    const deadheadCard = screen.getByTestId("fleet-metric-DEADHEAD_PERCENT");
    expect(deadheadCard).toHaveAttribute("aria-label", "Deadhead: Not Applicable");
  });
});

