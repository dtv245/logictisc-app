import { describe, it, expect, beforeAll, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Refine, type DataProvider } from "@refinedev/core";
import { App as AntdApp, Table } from "antd";
import { I18nextProvider } from "react-i18next";
import type { i18n as I18nInstance } from "i18next";

import { initializeAppI18n } from "@locales";
import { useLocalizedColumns } from "@hooks/useLocalizedColumns";
import { tripColumns, tripStatusMap } from "@features/trips/components/columns";
import type { Trip } from "@/types/trip.types";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

let i18nInstance: I18nInstance;

const mockDataProvider: DataProvider = {
  create: vi.fn(async () => ({ data: { id: "1" } })) as unknown as DataProvider["create"],
  deleteOne: vi.fn(async () => ({ data: { id: "1" } })) as unknown as DataProvider["deleteOne"],
  getApiUrl: () => "http://localhost:8080",
  getList: vi.fn(async () => ({ data: [], total: 0 })) as unknown as DataProvider["getList"],
  getMany: vi.fn(async () => ({ data: [] })) as unknown as DataProvider["getMany"],
  getOne: vi.fn(async () => ({ data: { id: "1" } })) as unknown as DataProvider["getOne"],
  update: vi.fn(async () => ({ data: { id: "1" } })) as unknown as DataProvider["update"],
};

beforeAll(async () => {
  i18nInstance = await initializeAppI18n({ locale: "vi", fallbackLocale: "en" });
});

const renderWithProviders = (node: ReactNode) => {
  return render(
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>
        <Refine
          dataProvider={mockDataProvider}
          resources={[
            {
              name: "trips",
              list: "/trips",
              show: "/trips/show/:id",
              edit: "/trips/edit/:id",
            },
          ]}
        >
          <I18nextProvider i18n={i18nInstance}>
            <AntdApp>{node}</AntdApp>
          </I18nextProvider>
        </Refine>
      </QueryClientProvider>
    </MemoryRouter>,
  );
};

describe("tripColumns — Chuẩn hóa UI Trips List theo Trucks", () => {
  const TableHarness = ({ data }: { data: Trip[] }) => {
    const columns = useLocalizedColumns(tripColumns);
    return <Table columns={columns} dataSource={data} pagination={false} rowKey="id" />;
  };

  it("cột number render router Link tới /trips/show/:id với class table-number-link", () => {
    const sampleTrip: Trip = {
      id: "trip-101",
      number: 101,
      name: "Chuyến Hà Nội - Hải Phòng",
      status: "active",
      truckNumber: "29C-88888",
      totalDistance: 125.5,
    };

    renderWithProviders(<TableHarness data={[sampleTrip]} />);

    const link = screen.getByRole("link", { name: "101" });
    expect(link).toBeInTheDocument();
    expect(link).toHaveClass("table-number-link");
    expect(link).toHaveAttribute("href", "/trips/show/trip-101");
  });

  it("cột totalDistance: align right, tabular-nums, kèm đơn vị km và định dạng số", () => {
    const sampleTrip: Trip = {
      id: "trip-102",
      number: 102,
      name: "Chuyến Đà Nẵng - Huế",
      status: "completed",
      truckNumber: "43A-12345",
      totalDistance: 1050,
    };

    renderWithProviders(<TableHarness data={[sampleTrip]} />);

    // Kiểm tra định dạng số và đơn vị km
    expect(screen.getByText(/1\.050 km/)).toBeInTheDocument();

    // Cột totalDistance có align right và numeric
    const totalDistanceCol = tripColumns.find((col) => col.dataIndex === "totalDistance");
    expect(totalDistanceCol?.align).toBe("right");
    expect(totalDistanceCol?.numeric).toBe(true);
  });

  it("cột totalDistance: hiển thị '—' khi null hoặc rỗng", () => {
    const sampleTripNull: Trip = {
      id: "trip-103",
      number: 103,
      name: "Chuyến mới tạo",
      status: "planned",
      truckNumber: null,
      totalDistance: null as unknown as number,
    };

    const { container } = renderWithProviders(<TableHarness data={[sampleTripNull]} />);

    const emptySpans = container.querySelectorAll(".table-cell-empty");
    expect(emptySpans.length).toBeGreaterThanOrEqual(1);
    expect(emptySpans[0]).toHaveTextContent("—");
  });

  it("cột status map chính xác các trạng thái: planned (neutral), active (processing), completed (success), cancelled (error)", () => {
    expect(tripStatusMap.planned).toBe("neutral");
    expect(tripStatusMap.active).toBe("processing");
    expect(tripStatusMap.completed).toBe("success");
    expect(tripStatusMap.cancelled).toBe("error");

    const sampleTrips: Trip[] = [
      { id: "1", number: 1, name: "T1", status: "planned", totalDistance: 10 },
      { id: "2", number: 2, name: "T2", status: "active", totalDistance: 20 },
      { id: "3", number: 3, name: "T3", status: "completed", totalDistance: 30 },
      { id: "4", number: 4, name: "T4", status: "cancelled", totalDistance: 40 },
    ];

    const { container } = renderWithProviders(<TableHarness data={sampleTrips} />);

    expect(container.querySelector(".status-tag--neutral")).toBeInTheDocument();
    expect(container.querySelector(".status-tag--processing")).toBeInTheDocument();
    expect(container.querySelector(".status-tag--success")).toBeInTheDocument();
    expect(container.querySelector(".status-tag--error")).toBeInTheDocument();
  });

  it("cột actions cố định bên phải với chiều rộng 130px", () => {
    const actionsCol = tripColumns.find((col) => col.key === "actions");
    expect(actionsCol).toBeDefined();
    expect(actionsCol?.fixed).toBe("right");
    expect(actionsCol?.width).toBe(130);
  });
});
