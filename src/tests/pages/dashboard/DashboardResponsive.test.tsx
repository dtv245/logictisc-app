import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { TopFilterBar } from "@features/dashboard/components/TopFilterBar";
import { KpiCards } from "@features/dashboard/components/KpiCards";
import { FinancialSection } from "@features/dashboard/components/FinancialSection";
import { DriverRankingTable } from "@features/dashboard/components/DriverRankingTable";
import { ProfitabilityRankingsTable } from "@features/dashboard/components/ProfitabilityRankingsTable";
import { VehicleTrackingMap } from "@features/operations/components/VehicleTrackingMap";
import { OperationsChart } from "@features/operations/components/OperationsChart";
import type {
  DashboardFilters,
  DriverRankingItem,
  ExpenseSummaryReport,
  FuelReport,
  KnownOperatingCpmReport,
  LaneProfitabilityReport,
  MaintenanceSummaryReport,
  MonthlyTrendPoint,
  OtdReport,
  TruckProfitabilityReport,
  WidgetAsyncState,
} from "@features/dashboard/types";

// Helper to set viewport
const setViewport = (width: number, height = 800) => {
  Object.defineProperty(window, "innerWidth", { writable: true, configurable: true, value: width });
  Object.defineProperty(window, "innerHeight", { writable: true, configurable: true, value: height });
  window.dispatchEvent(new Event("resize"));
};

const createMockAsync = <T,>(data: T): WidgetAsyncState<T> => ({
  data,
  isLoading: false,
  isFetching: false,
  isForbidden: false,
  error: null,
  refetch: vi.fn(),
});

describe("Dashboard & Operations Responsive Verification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("1. TopFilterBar responsive controls", () => {
    const mockFilters: DashboardFilters = {
      preset: "30d",
      from: "2026-09-12",
      to: "2026-10-12",
      currency: "VND",
      comparePrevious: true,
      businessZoneId: "ALL",
    };

    it("renders presets container across mobile, tablet, and desktop viewports (375px, 414px, 768px, 1024px, 1440px)", () => {
      const viewports = [375, 414, 768, 1024, 1440];

      viewports.forEach((width) => {
        setViewport(width);
        const onChange = vi.fn();
        const onRefresh = vi.fn();

        const { container, unmount } = render(
          <TopFilterBar
            filters={mockFilters}
            onChange={onChange}
            onRefresh={onRefresh}
            title="Điều Phối Vận Hành"
          />
        );

        const presetsContainer = container.querySelector(".top-filter-bar__presets-container");
        expect(presetsContainer).toBeInTheDocument();
        expect(presetsContainer).toHaveAttribute("role", "region");

        // Verify all 5 quick date presets are present
        expect(screen.getByRole("radio", { name: "Hôm nay" })).toBeInTheDocument();
        expect(screen.getByRole("radio", { name: "7 ngày" })).toBeInTheDocument();
        expect(screen.getByRole("radio", { name: "30 ngày" })).toBeInTheDocument();
        expect(screen.getByRole("radio", { name: "Tháng này" })).toBeInTheDocument();
        expect(screen.getByRole("radio", { name: "Tuỳ chọn" })).toBeInTheDocument();

        // RangePicker and Currency have responsive classes
        expect(container.querySelector(".top-filter-bar__range-picker")).toBeInTheDocument();
        expect(container.querySelector(".top-filter-bar__currency-select")).toBeInTheDocument();

        unmount();
      });
    });

    it("disables range picker when preset is not 'custom' and enables on 'custom'", () => {
      const onChange = vi.fn();
      const { container, rerender } = render(
        <TopFilterBar
          filters={mockFilters}
          onChange={onChange}
          onRefresh={vi.fn()}
        />
      );

      const rangeInputs = container.querySelectorAll(".ant-picker-input input");
      rangeInputs.forEach((input) => {
        expect(input).toBeDisabled();
      });

      rerender(
        <TopFilterBar
          filters={{ ...mockFilters, preset: "custom" }}
          onChange={onChange}
          onRefresh={vi.fn()}
        />
      );

      const activeRangeInputs = container.querySelectorAll(".ant-picker-input input");
      activeRangeInputs.forEach((input) => {
        expect(input).not.toBeDisabled();
      });
    });
  });

  describe("2. KpiCards responsive layout & data integrity", () => {
    const sampleTrend: MonthlyTrendPoint[] = [
      { monthKey: "2026-05", label: "T5", revenue: 120000000, cost: 95000000, profit: 25000000, marginPercent: 20.8, currency: "VND", isAvailable: true },
      { monthKey: "2026-06", label: "T6", revenue: 145000000, cost: 110000000, profit: 35000000, marginPercent: 24.1, currency: "VND", isAvailable: true },
    ];

    const mockExpenses = createMockAsync<ExpenseSummaryReport>({
      totalApprovedAmount: 110000000,
      currency: "VND",
      byCategory: { Fuel: 60000000, Maintenance: 30000000, Tolls: 20000000 },
    });

    const mockCpm = createMockAsync<KnownOperatingCpmReport>({
      knownOperatingCostPerMile: { value: 1.85, unit: "USD/mi" },
      driverCostIncluded: true,
      fixedCostIncluded: true,
      currency: "USD",
    });

    const mockOtd = createMockAsync<OtdReport>({
      otdPercentage: 96.4,
      onTimeLoads: 241,
      totalEligibleLoads: 250,
    });

    it("renders all 6 KPI cards with responsive column properties without distorting values", () => {
      const { container } = render(
        <MemoryRouter>
          <KpiCards
            currency="VND"
            monthlyTrendPoints={sampleTrend}
            expenses={mockExpenses}
            operatingCpm={mockCpm}
            otd={mockOtd}
            fleetCount={{ totalTrucks: 52, totalLoads: 180 }}
            enableFinancials={true}
          />
        </MemoryRouter>
      );

      expect(container.querySelector(".kpi-cards-row")).toBeInTheDocument();
      const cols = container.querySelectorAll(".kpi-card-col");
      expect(cols.length).toBe(6);

      // Verify numbers and labels are rendered safely
      expect(screen.getByText("Doanh Thu")).toBeInTheDocument();
      expect(screen.getByText("Chi Phí Hoạt Động")).toBeInTheDocument();
      expect(screen.getByText("Lợi Nhuận Thuần")).toBeInTheDocument();
      expect(screen.getByText("Đúng Giờ (OTD)")).toBeInTheDocument();
      expect(screen.getByText("Chi Phí / Dặm (CPM)")).toBeInTheDocument();
      expect(screen.getByText("Đội Xe Hoạt Động")).toBeInTheDocument();
    });

    it("supports role restriction (hide financials) without breaking layout", () => {
      render(
        <MemoryRouter>
          <KpiCards
            currency="VND"
            monthlyTrendPoints={sampleTrend}
            expenses={mockExpenses}
            operatingCpm={mockCpm}
            otd={mockOtd}
            fleetCount={{ totalTrucks: 52, totalLoads: 180 }}
            enableFinancials={false}
          />
        </MemoryRouter>
      );

      expect(screen.queryByText("Doanh Thu")).not.toBeInTheDocument();
      expect(screen.queryByText("Chi Phí Hoạt Động")).not.toBeInTheDocument();
      expect(screen.getByText("Đúng Giờ (OTD)")).toBeInTheDocument();
      expect(screen.getByText("Đội Xe Hoạt Động")).toBeInTheDocument();
    });
  });

  describe("3. FinancialSection charts & mobile readability", () => {
    const sampleTrend: MonthlyTrendPoint[] = [
      { monthKey: "2026-05", label: "T5", revenue: 120000000, cost: 95000000, profit: 25000000, marginPercent: 20.8, currency: "VND", isAvailable: true },
      { monthKey: "2026-06", label: "T6", revenue: 145000000, cost: 110000000, profit: 35000000, marginPercent: 24.1, currency: "VND", isAvailable: true },
    ];

    it("renders trend and pie chart containers with valid responsive dimensions", () => {
      const mockExpenses = createMockAsync<ExpenseSummaryReport>({
        totalApprovedAmount: 85000000,
        currency: "VND",
        byCategory: { "Nhiên liệu": 45000000, "Bảo trì": 25000000, "Cầu đường": 15000000 },
      });

      const { container } = render(
        <MemoryRouter>
          <FinancialSection
            currency="VND"
            monthlyTrendPoints={sampleTrend}
            monthlyTrendLoading={false}
            onRefreshMonthly={vi.fn()}
            expenses={mockExpenses}
            fuel={createMockAsync<FuelReport>({ totalFuelCost: 45000000, currency: "VND" })}
            maintenance={createMockAsync<MaintenanceSummaryReport>({ totalCost: 25000000, currency: "VND" })}
          />
        </MemoryRouter>
      );

      expect(screen.getByText("Xu Hướng Tài Chính 6 Tháng Gần Nhất")).toBeInTheDocument();
      expect(screen.getByText("Cơ Cấu Chi Phí Theo Hạng Mục")).toBeInTheDocument();

      const responsiveContainers = container.querySelectorAll(".recharts-responsive-container");
      expect(responsiveContainers.length).toBeGreaterThan(0);
    });
  });

  describe("4. DriverRankingTable & ProfitabilityRankingsTable sticky columns & horizontal scroll", () => {
    const mockDrivers: DriverRankingItem[] = [
      {
        rank: 1,
        driverId: "DRV-101",
        driverName: "Trần Văn Nam",
        score: 98,
        completedLoads: 45,
        totalMiles: 18500,
        onTimePercent: 97.5,
        revenue: 125000000,
        revenuePerMile: 2.85,
        driverPay: 35000000,
        exceptionsCount: 0,
      },
    ];

    it("renders DriverRankingTable with fixed left columns for Rank & Driver Name", () => {
      const { container } = render(
        <MemoryRouter>
          <DriverRankingTable
            drivers={mockDrivers}
            isLoading={false}
            isMock={false}
            sortBy="score"
            onSortChange={vi.fn()}
            currency="VND"
          />
        </MemoryRouter>
      );

      expect(screen.getByText("Trần Văn Nam")).toBeInTheDocument();
      const fixedCells = container.querySelectorAll(".ant-table-cell-fix-left");
      expect(fixedCells.length).toBeGreaterThan(0);
    });

    it("renders ProfitabilityRankingsTable with fixed left column and tab toggle", () => {
      const mockLanes: LaneProfitabilityReport[] = [
        {
          originState: "HCM",
          destinationState: "DAN",
          loadCount: 30,
          totalMiles: 28500,
          totalRevenue: 220000000,
          totalCost: 165000000,
          totalProfit: 55000000,
          averageMarginPercent: 25.0,
          averageRpm: 2.7,
          currency: "VND",
        },
      ];

      const mockTrucks: TruckProfitabilityReport[] = [
        {
          truckId: "TRK-01",
          truckNumber: "51C-999.88",
          loadCount: 22,
          totalMiles: 14200,
          totalRevenue: 135000000,
          totalCost: 98000000,
          totalProfit: 37000000,
          averageMarginPercent: 27.4,
          costPerMile: 2.45,
          currency: "VND",
        },
      ];

      render(
        <MemoryRouter>
          <ProfitabilityRankingsTable
            laneRankings={createMockAsync(mockLanes)}
            truckRankings={createMockAsync(mockTrucks)}
            currency="VND"
          />
        </MemoryRouter>
      );

      expect(screen.getByText("Tuyến đường (Lanes)")).toBeInTheDocument();
      expect(screen.getByText("HCM")).toBeInTheDocument();

      // Switch to Trucks tab
      fireEvent.click(screen.getByText("Đội xe (Trucks)"));
      expect(screen.getAllByText("Đầu xe").length).toBeGreaterThan(0);
      expect(screen.getByText("51C-999.88")).toBeInTheDocument();
    });
  });

  describe("5. VehicleTrackingMap viewport responsiveness & interactive controls", () => {
    it("renders map container, status filter pills, and locate button", () => {
      const points = [
        { id: "1", label: "51C-123.45", latitude: 10.77, longitude: 106.70, status: "available" },
        { id: "2", label: "29H-678.90", latitude: 21.02, longitude: 105.83, status: "in_transit" },
      ];

      const { container } = render(
        <VehicleTrackingMap
          points={points}
          isLoading={false}
          loadErrorText="Lỗi tải bản đồ"
          inaccessibleText=""
          noLocationText="Không có toạ độ"
          mapLabel="Bản đồ theo dõi xe"
          statusLabel={(s) => (s === "available" ? "Sẵn sàng" : "Đang chạy")}
        />
      );

      expect(container.querySelector(".vehicle-map-container")).toBeInTheDocument();
      expect(screen.getByText("Định vị xe")).toBeInTheDocument();
      expect(screen.getByText("Tất cả (2)")).toBeInTheDocument();
      expect(screen.getByText("Sẵn sàng (1)")).toBeInTheDocument();
      expect(screen.getByText("Đang chạy (1)")).toBeInTheDocument();

      // Filter by status
      fireEvent.click(screen.getByText("Sẵn sàng (1)"));
    });

    it("displays friendly empty and error states without crashing", () => {
      const { rerender } = render(
        <VehicleTrackingMap
          points={[]}
          isLoading={false}
          loadErrorText="Lỗi"
          inaccessibleText=""
          noLocationText="Không có xe nào được ghi nhận vị trí"
          mapLabel="Bản đồ"
          statusLabel={(s) => s}
        />
      );

      expect(screen.getByText("Không có xe nào được ghi nhận vị trí")).toBeInTheDocument();

      rerender(
        <VehicleTrackingMap
          points={[]}
          errorMessage="Máy chủ ngắt kết nối"
          isLoading={false}
          loadErrorText="Lỗi"
          inaccessibleText=""
          noLocationText="Trống"
          mapLabel="Bản đồ"
          statusLabel={(s) => s}
        />
      );

      expect(screen.getByText("Máy chủ ngắt kết nối")).toBeInTheDocument();
    });
  });

  describe("6. OperationsChart responsiveness", () => {
    it("renders bar percentages safely for responsive container", () => {
      const items = [
        { color: "#2563eb", label: "Đầu xe", value: 45 },
        { color: "#14b8a6", label: "Đơn hàng", value: 120 },
      ];

      const { container } = render(
        <OperationsChart items={items} isLoading={false} lockedText="Khoá" />
      );

      expect(container.querySelector(".operations-chart")).toBeInTheDocument();
      expect(screen.getByText("Đầu xe")).toBeInTheDocument();
      expect(screen.getByText("Đơn hàng")).toBeInTheDocument();
      expect(screen.getByText("45")).toBeInTheDocument();
      expect(screen.getByText("120")).toBeInTheDocument();
    });
  });
});
