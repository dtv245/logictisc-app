import { act, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { I18nextProvider } from "react-i18next";
import { parseTableParams } from "@refinedev/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { initializeAppI18n } from "@/locales";

import { DashboardHeader } from "@features/dashboard/components/DashboardHeader";
import { KpiStrip } from "@features/dashboard/components/KpiStrip";
import { PriorityShipmentCard } from "@/components/dashboard/PriorityShipmentCard";
import { OperationsBrief } from "@features/dashboard/components/OperationsBrief";
import { NetworkMiniMap } from "@features/dashboard/components/NetworkMiniMap";
import { DispatchTimeline } from "@features/dashboard/components/DispatchTimeline";
import { OperationsDashboardView } from "@features/dashboard/components/OperationsDashboardView";
import { VehicleTrackingMap } from "@features/operations/components/VehicleTrackingMap";
import { OperationsChart } from "@features/operations/components/OperationsChart";
import type { KpiItemProps } from "@features/dashboard/types/primitives.types";

// Helper to set viewport
const setViewport = (width: number, height = 800) => {
  Object.defineProperty(window, "innerWidth", { writable: true, configurable: true, value: width });
  Object.defineProperty(window, "innerHeight", { writable: true, configurable: true, value: height });
  window.dispatchEvent(new Event("resize"));
};

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

let testI18n: Awaited<ReturnType<typeof initializeAppI18n>>;

const renderWithProviders = (ui: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  return render(
    <I18nextProvider i18n={testI18n}>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>{ui}</MemoryRouter>
      </QueryClientProvider>
    </I18nextProvider>,
  );
};

const SearchLocationProbe = () => {
  const location = useLocation();
  return <output data-testid="search-location">{location.pathname}{location.search}</output>;
};

// Mock Refine core hooks used by DashboardHeader & OperationsDashboardView
vi.mock("@hooks/useCurrentUser", () => ({
  useCurrentUser: () => ({
    data: { id: "u-1", name: "Nguyễn Văn Điều Phối", email: "dispatcher@logistics.com", roles: ["DISPATCHER"] },
    isLoading: false,
  }),
}));

vi.mock("@hooks/useCurrentTenant", () => ({
  useCurrentTenant: () => ({
    tenant: { id: "t-1", tenantName: "Logistics Hub Miền Nam" },
  }),
}));

beforeAll(async () => {
  testI18n = await initializeAppI18n({ locale: "vi", fallbackLocale: "en" });
});

vi.mock("@/hooks/useDashboardData", () => ({
  useDashboardData: () => ({
    otd: { data: { otdPercentage: 94 }, isLoading: false, error: null },
    delays: { data: { totalLateLoads: 3 }, isLoading: false, error: null },
    exceptions: { data: { totalExceptions: 2 }, isLoading: false, isError: false },
    refetchAll: vi.fn(),
  }),
}));

vi.mock("react-map-gl/maplibre", () => ({
  default: ({ children }: { children?: React.ReactNode }) => <div data-testid="maplibre-map">{children}</div>,
  NavigationControl: () => <div data-testid="navigation-control" />,
  Source: ({ children }: { children?: React.ReactNode }) => <div data-testid="map-source">{children}</div>,
  Layer: () => <div data-testid="map-layer" />,
}));

describe("Dashboard & Operations Responsive Verification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("1. DashboardHeader responsive controls", () => {
    it("renders greeting, search trigger, and monitoring pill across viewports", () => {
      const viewports = [375, 414, 768, 1024, 1440];

      viewports.forEach((width) => {
        setViewport(width);
        const { unmount } = renderWithProviders(
          <DashboardHeader approvalsCount={3} monitoringCount={28} />,
        );

        expect(screen.getByText(/Giám sát 28/)).toBeInTheDocument();
        expect(screen.getByText(/Tìm chuyến hàng, tài xế/)).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Tìm chuyến hàng, tài xế" })).toHaveAttribute(
          "aria-keyshortcuts",
          "Meta+K Control+K",
        );
        expect(screen.getByRole("button", { name: /Tạo đơn hàng/ })).toBeInTheDocument();

        unmount();
      });
    });

    it("opens quick search from Ctrl+K and Meta+K", async () => {
      const firstRender = renderWithProviders(<DashboardHeader />);

      fireEvent.keyDown(window, { key: "k", ctrlKey: true });
      expect(await screen.findByPlaceholderText(/Nhập mã đơn hàng/)).toBeInTheDocument();

      firstRender.unmount();
      renderWithProviders(<DashboardHeader />);
      fireEvent.keyDown(window, { key: "k", metaKey: true });
      expect(await screen.findByPlaceholderText(/Nhập mã đơn hàng/)).toBeInTheDocument();
    });

    it("opens the loads list with a Refine-compatible search filter", async () => {
      const queryClient = createTestQueryClient();
      render(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter>
            <>
              <DashboardHeader />
              <SearchLocationProbe />
            </>
          </MemoryRouter>
        </QueryClientProvider>,
      );

      fireEvent.click(screen.getByRole("button", { name: "Tìm chuyến hàng, tài xế" }));
      fireEvent.change(await screen.findByPlaceholderText(/Nhập mã đơn hàng/), {
        target: { value: "  LD-42  " },
      });
      fireEvent.click(screen.getByRole("button", { name: "Tìm" }));

      const location = screen.getByTestId("search-location").textContent ?? "";
      const query = location.slice(location.indexOf("?"));
      expect(location).toContain("/loads?");
      expect(parseTableParams(query)).toMatchObject({
        parsedCurrent: 1,
        parsedFilters: [{ field: "search", operator: "contains", value: "LD-42" }],
      });
    });
  });

  describe("2. KpiStrip responsive cards", () => {
    const mockKpiItems: KpiItemProps[] = [
      { label: "Đang trên đường", value: 28, delta: { text: "+4", tone: "positive" } },
      { label: "Nguy cơ trễ", value: 3, delta: { text: "+2", tone: "negative" } },
      { label: "Đúng giờ (OTD)", value: 94, delta: { text: "+1.2%", tone: "positive" } },
      { label: "Đã giao hôm nay", value: 46 },
      { label: "Xe sẵn sàng", value: 14 },
      { label: "Ngoại lệ", value: 2 },
    ];

    it("renders all 6 KPI items across viewports", () => {
      const viewports = [375, 768, 1200];

      viewports.forEach((width) => {
        setViewport(width);
        const { unmount } = renderWithProviders(
          <KpiStrip items={mockKpiItems} />,
        );

        expect(screen.getByText("Đang trên đường")).toBeInTheDocument();
        expect(screen.getByText("Nguy cơ trễ")).toBeInTheDocument();
        expect(screen.getByText("Đúng giờ (OTD)")).toBeInTheDocument();

        unmount();
      });
    });
  });

  describe("3. PriorityShipmentCard details", () => {
    it("renders priority header, time window stats and telemetry callouts", () => {
      renderWithProviders(<PriorityShipmentCard shipments={[{
        id: "load-test", reference: "#42", origin: "Điểm đi", destination: "Điểm đến", deliveryWindow: "15:00–15:30", eta: "15:49",
      }]} />);

      expect(screen.getByText("Chuyến vận chuyển ưu tiên")).toBeInTheDocument();
      expect(screen.getByText("Khung giờ giao")).toBeInTheDocument();
      expect(screen.getByText("ETA hiện tại")).toBeInTheDocument();
      expect(screen.getByRole("group", { name: "Tiến độ hành trình" })).toBeInTheDocument();
    });
  });

  describe("4. OperationsBrief AI analysis", () => {
    it("renders AI brief summary, causes and proposed actions", () => {
      renderWithProviders(<OperationsBrief />);

      expect(screen.getByRole("region", { name: "Operations brief" })).toBeInTheDocument();
      expect(screen.getByText(/NGUYÊN NHÂN ĐÓNG GÓP/)).toBeInTheDocument();
      expect(screen.getByText(/CẦN BẠN PHÊ DUYỆT/)).toBeInTheDocument();
    });
  });

  describe("5. NetworkMiniMap network status", () => {
    it("renders live status badge, map canvas and legend", () => {
      renderWithProviders(<NetworkMiniMap isLive vehicles={[{
        id: "truck-test", plate: "TEST-001", latitude: 10.7769, longitude: 106.7009, status: "moving",
      }]} />);

      expect(screen.getByText(/Mạng lưới xe thời gian thực/)).toBeInTheDocument();
      expect(screen.getByText(/Trực tuyến/)).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Chi tiết bản đồ" })).not.toBeInTheDocument();
    });
  });

  describe("6. DispatchTimeline driver schedule blocks", () => {
    it("renders time axis and driver rows", () => {
      renderWithProviders(<DispatchTimeline drivers={[
        { driverId: "driver-1", driverName: "Nguyễn Văn Hùng", vehiclePlate: "TEST-001", blocks: [] },
        { driverId: "driver-2", driverName: "Trần Văn Nam", vehiclePlate: "TEST-002", blocks: [] },
      ]} />);

      expect(screen.getByRole("region", { name: "Biểu đồ điều phối tài xế" })).toBeInTheDocument();
      expect(screen.getByText("Nguyễn Văn Hùng")).toBeInTheDocument();
      expect(screen.getByText("Trần Văn Nam")).toBeInTheDocument();
    });
  });

  describe("7. OperationsDashboardView full assembly", () => {
    it("renders entire operations dashboard view in 12-column grid", () => {
      renderWithProviders(<OperationsDashboardView />);

      expect(screen.getByText("Mở AI Dispatch")).toBeInTheDocument();
      expect(screen.getByText(/Chuyến vận chuyển ưu tiên/)).toBeInTheDocument();
      expect(screen.getByRole("region", { name: "Operations brief" })).toBeInTheDocument();
      expect(screen.getByText("94")).toBeInTheDocument();
      expect(screen.getByText("3")).toBeInTheDocument();
      expect(screen.getByText("2")).toBeInTheDocument();
      expect(screen.queryByText("28")).not.toBeInTheDocument();
      expect(screen.queryByText("46")).not.toBeInTheDocument();
      expect(screen.queryByText("14")).not.toBeInTheDocument();
    });

    it("localizes dashboard KPI labels and search controls", async () => {
      await act(async () => {
        await testI18n.changeLanguage("ja");
      });

      const { unmount } = renderWithProviders(<OperationsDashboardView />);
      expect(screen.getByText("輸送中")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "貨物とドライバーを検索" })).toBeInTheDocument();
      unmount();

      await act(async () => {
        await testI18n.changeLanguage("vi");
      });
    });
  });

  describe("8. VehicleTrackingMap standalone controls", () => {
    it("renders map container with controls when points are available", () => {
      render(
        <VehicleTrackingMap
          inaccessibleText=""
          isLoading={false}
          loadErrorText="Lỗi bản đồ"
          mapLabel="Bản đồ vị trí gần nhất của phương tiện"
          noLocationText="Không có dữ liệu vị trí"
          points={[
            {
              id: "trk-1",
              label: "51D-89241",
              status: "in_transit",
              latitude: 10.8231,
              longitude: 106.6297,
            },
          ]}
          statusLabel={(s) => s}
        />,
      );

      expect(screen.getByLabelText("Bản đồ vị trí gần nhất của phương tiện")).toBeInTheDocument();
    });
  });

  describe("9. OperationsChart standalone controls", () => {
    it("renders chart items", () => {
      render(
        <OperationsChart
          isLoading={false}
          items={[
            { label: "Phương tiện", value: 10, color: "#2563eb" },
            { label: "Chuyến hàng", value: 20, color: "#14b8a6" },
          ]}
          lockedText="Cần quyền xem dữ liệu vận hành"
        />,
      );

      expect(screen.getByText("Phương tiện")).toBeInTheDocument();
      expect(screen.getByText("Chuyến hàng")).toBeInTheDocument();
    });
  });
});
