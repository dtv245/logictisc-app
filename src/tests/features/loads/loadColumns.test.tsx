/**
 * Unit & Integration Tests cho loadColumns:
 * - Cột number: Link tới /loads/show/:id, font-weight 500, tabular-nums, class table-number-link.
 * - Cột status: StatusTag ngữ nghĩa cho draft, dispatched, in_transit, delivered, cancelled.
 * - Cột customerName, assignedTruckNumber, name: ellipsis + Tooltip, fallback "—" (table-cell-empty).
 * - Cột actions: fixed right, width 130.
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
import { useLocalizedColumns } from "@hooks/useLocalizedColumns";
import { loadColumns } from "@features/loads/components/columns";
import type { Load } from "@/types/load.types";

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
              name: "loads",
              list: "/loads",
              show: "/loads/show/:id",
              edit: "/loads/edit/:id",
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

describe("loadColumns — Chuẩn hóa UI & a11y", () => {
  const TableHarness = ({ data }: { data: Load[] }) => {
    const columns = useLocalizedColumns(loadColumns);
    return <Table columns={columns} dataSource={data} pagination={false} rowKey="id" />;
  };

  const sampleLoad: Load = {
    id: "load-101",
    number: 101,
    name: "Vận chuyển thép cuộn HN-HP",
    status: "in_transit",
    customerId: "cust-01",
    customerName: "Công ty Thép Việt Nhật",
    assignedTruckNumber: "29C-99999",
    distance: 120,
    isHazmat: false,
    isInProximity: false,
    source: "manual",
    type: "standard",
  };

  it("cột number render router Link tới /loads/show/:id với class table-number-link", () => {
    renderWithProviders(<TableHarness data={[sampleLoad]} />);

    const link = screen.getByRole("link", { name: "101" });
    expect(link).toBeInTheDocument();
    expect(link).toHaveClass("table-number-link");
    expect(link).toHaveAttribute("href", "/loads/show/load-101");
  });

  it("cột status render StatusTag với role status, nhãn tiếng Việt và tone ngữ nghĩa", () => {
    const testCases = [
      { status: "draft", expectedLabel: "Nháp", expectedClass: "status-tag--neutral" },
      { status: "dispatched", expectedLabel: "Đã điều phối", expectedClass: "status-tag--processing" },
      { status: "in_transit", expectedLabel: "Đang vận chuyển", expectedClass: "status-tag--processing" },
      { status: "delivered", expectedLabel: "Đã giao", expectedClass: "status-tag--success" },
      { status: "cancelled", expectedLabel: "Đã hủy", expectedClass: "status-tag--error" },
    ];

    const loads: Load[] = testCases.map((tc, index) => ({
      ...sampleLoad,
      id: `load-${index}`,
      number: index + 1,
      status: tc.status,
    }));

    renderWithProviders(<TableHarness data={loads} />);

    testCases.forEach((tc) => {
      const labelEl = screen.getByText(tc.expectedLabel);
      expect(labelEl).toBeInTheDocument();
      const tag = labelEl.closest(".status-tag");
      expect(tag).toBeInTheDocument();
      expect(tag).toHaveAttribute("role", "status");
      expect(tag).toHaveClass(tc.expectedClass);
    });
  });

  it("cột customerName và assignedTruckNumber render ellipsis và Tooltip khi có dữ liệu", () => {
    const { container } = renderWithProviders(<TableHarness data={[sampleLoad]} />);

    expect(screen.getByText("Công ty Thép Việt Nhật")).toBeInTheDocument();
    expect(screen.getByText("29C-99999")).toBeInTheDocument();

    const ellipses = container.querySelectorAll(".table-cell-ellipsis");
    expect(ellipses.length).toBeGreaterThanOrEqual(2);
  });

  it("hiển thị '—' với class table-cell-empty khi chưa phân xe hoặc thông tin null/rỗng", () => {
    const unassignedLoad: Load = {
      ...sampleLoad,
      id: "load-102",
      number: 102,
      name: "",
      customerName: null,
      customerId: "",
      assignedTruckNumber: null,
    };

    const { container } = renderWithProviders(<TableHarness data={[unassignedLoad]} />);

    const emptyPlaceholders = container.querySelectorAll(".table-cell-empty");
    // Cả name, customerName, và assignedTruckNumber đều hiển thị "—"
    expect(emptyPlaceholders.length).toBeGreaterThanOrEqual(3);
    emptyPlaceholders.forEach((el) => {
      expect(el).toHaveTextContent("—");
    });
  });

  it("cấu hình cột actions cố định bên phải và có độ rộng chuẩn 130px", () => {
    const actionsCol = loadColumns.find((col) => col.key === "actions");
    expect(actionsCol).toBeDefined();
    expect(actionsCol?.width).toBe(130);
    expect(actionsCol?.fixed).toBe("right");
  });
});
