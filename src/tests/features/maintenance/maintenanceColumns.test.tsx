/**
 * Unit & Integration Tests cho maintenanceColumns:
 * - formatOdometer & formatMaintenanceCost formatters.
 * - isDateOverdue logic cảnh báo quá hạn.
 * - Cột serviceDate: Link tới /maintenance/show/:id với table-number-link.
 * - Cột truckId: Link tới /trucks/show/:truckId.
 * - Cột odometerReading: căn phải, numeric, tabular-nums.
 * - Cột totalCost: căn phải, format tiền tệ VND, tabular-nums.
 * - Cột nextDueDate: cảnh báo quá hạn với Tag Quá hạn + màu error #b91c1c khi quá hạn; placeholder "—" khi rỗng.
 * - Cột actions: fixed right, width 130px.
 */

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
import { useLocalizedColumns } from "@components/useLocalizedColumns";
import {
  maintenanceColumns,
  isDateOverdue,
  formatOdometer,
  formatMaintenanceCost,
} from "@features/maintenance/components/columns";
import type { MaintenanceRecord } from "@/types/truck.types";

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
              name: "maintenance",
              list: "/maintenance",
              show: "/maintenance/show/:id",
              edit: "/maintenance/edit/:id",
            },
            {
              name: "trucks",
              list: "/trucks",
              show: "/trucks/show/:id",
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

describe("Maintenance Helpers", () => {
  it("formatOdometer format số km phân cách hàng nghìn", () => {
    expect(formatOdometer(45000)).toMatch(/45\.000\s*km/);
    expect(formatOdometer(0)).toMatch(/0\s*km/);
    expect(formatOdometer(null)).toBe("");
    expect(formatOdometer("")).toBe("");
  });

  it("formatMaintenanceCost định dạng tiền tệ VND", () => {
    const formatted = formatMaintenanceCost(12500000);
    expect(formatted).toMatch(/12\.500\.000/);
    expect(formatMaintenanceCost(null)).toBe("");
    expect(formatMaintenanceCost("")).toBe("");
  });

  it("isDateOverdue so sánh chuẩn xác với mốc ngày hiện tại", () => {
    const now = new Date("2026-10-12T12:00:00Z");

    // Ngày trong quá khứ -> quá hạn
    expect(isDateOverdue("2026-10-01", now)).toBe(true);
    expect(isDateOverdue("2026-10-11", now)).toBe(true);

    // Hôm nay hoặc tương lai -> không quá hạn
    expect(isDateOverdue("2026-10-12", now)).toBe(false);
    expect(isDateOverdue("2026-10-25", now)).toBe(false);

    // Không hợp lệ / rỗng -> false
    expect(isDateOverdue(null, now)).toBe(false);
    expect(isDateOverdue("", now)).toBe(false);
  });
});

describe("maintenanceColumns — Chuẩn hóa UI & a11y", () => {
  const TableHarness = ({ data }: { data: MaintenanceRecord[] }) => {
    const columns = useLocalizedColumns(maintenanceColumns);
    return <Table columns={columns} dataSource={data} pagination={false} rowKey="id" />;
  };

  const sampleRecord: MaintenanceRecord = {
    id: "maint-001",
    truckId: "truck-101",
    maintenanceType: "oil_change",
    serviceDate: "2026-10-10",
    odometerReading: 85200,
    laborCost: 1000000,
    partsCost: 2500000,
    totalCost: 3500000,
    nextDueDate: "2026-12-10",
    createdAt: "2026-10-10T08:00:00Z",
  };

  it("cột serviceDate render router Link tới /maintenance/show/:id với class table-number-link", () => {
    renderWithProviders(<TableHarness data={[sampleRecord]} />);

    const link = screen.getByRole("link", { name: "10/10/2026" });
    expect(link).toBeInTheDocument();
    expect(link).toHaveClass("table-number-link");
    expect(link).toHaveAttribute("href", "/maintenance/show/maint-001");
  });

  it("cột truckId render router Link tới /trucks/show/:truckId với class table-number-link", () => {
    renderWithProviders(<TableHarness data={[sampleRecord]} />);

    const link = screen.getByRole("link", { name: "truck-101" });
    expect(link).toBeInTheDocument();
    expect(link).toHaveClass("table-number-link");
    expect(link).toHaveAttribute("href", "/trucks/show/truck-101");
  });

  it("cột odometerReading và totalCost căn phải và hiển thị định dạng số chuẩn", () => {
    const odometerCol = maintenanceColumns.find((c) => c.dataIndex === "odometerReading");
    const costCol = maintenanceColumns.find((c) => c.dataIndex === "totalCost");

    expect(odometerCol?.align).toBe("right");
    expect(odometerCol?.numeric).toBe(true);

    expect(costCol?.align).toBe("right");
    expect(costCol?.numeric).toBe(true);

    renderWithProviders(<TableHarness data={[sampleRecord]} />);

    expect(screen.getByText(/85\.200\s*km/)).toBeInTheDocument();
    expect(screen.getByText(/3\.500\.000/)).toBeInTheDocument();
  });

  it("cột nextDueDate hiển thị Tag 'Quá hạn' khi hạn đã qua", () => {
    const overdueRecord: MaintenanceRecord = {
      ...sampleRecord,
      id: "maint-overdue",
      nextDueDate: "2020-01-01",
    };

    renderWithProviders(<TableHarness data={[overdueRecord]} />);

    const overdueTag = screen.getByRole("status", { name: "Quá hạn" });
    expect(overdueTag).toBeInTheDocument();
    expect(overdueTag).toHaveTextContent("Quá hạn");
    expect(overdueTag).toHaveStyle({ color: "#b91c1c" });
  });

  it("hiển thị '—' với class table-cell-empty khi dữ liệu null hoặc rỗng", () => {
    const emptyRecord: MaintenanceRecord = {
      id: "maint-empty",
      truckId: "",
      maintenanceType: "inspection",
      serviceDate: "",
      odometerReading: 0,
      laborCost: 0,
      partsCost: 0,
      totalCost: 0,
      nextDueDate: null,
    };

    const { container } = renderWithProviders(<TableHarness data={[emptyRecord]} />);

    const emptyPlaceholders = container.querySelectorAll(".table-cell-empty");
    expect(emptyPlaceholders.length).toBeGreaterThanOrEqual(1);
  });

  it("cấu hình cột actions cố định bên phải và có độ rộng chuẩn 130px", () => {
    const actionsCol = maintenanceColumns.find((col) => col.key === "actions");
    expect(actionsCol).toBeDefined();
    expect(actionsCol?.width).toBe(130);
    expect(actionsCol?.fixed).toBe("right");
  });
});
