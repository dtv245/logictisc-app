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
import {
  containerColumns,
  containerStatusMap,
} from "@features/containers/components/columns";
import type { Container } from "@/types/container.types";

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
              name: "containers",
              list: "/containers",
              show: "/containers/show/:id",
              edit: "/containers/edit/:id",
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

describe("containerColumns — Chuẩn hóa UI Containers List theo Trucks", () => {
  const TableHarness = ({ data }: { data: Container[] }) => {
    const columns = useLocalizedColumns(containerColumns);
    return <Table columns={columns} dataSource={data} pagination={false} rowKey="id" />;
  };

  it("cột number render router Link tới /containers/show/:id với class monospace và tabular-nums", () => {
    const sampleContainer: Container = {
      id: "cntr-01",
      number: "MSKU9012345",
      isoType: "40HC",
      isLaden: true,
      grossWeight: 28500,
      status: "loaded",
      createdAt: "2026-03-01T00:00:00Z",
    };

    renderWithProviders(<TableHarness data={[sampleContainer]} />);

    const link = screen.getByRole("link", { name: "MSKU9012345" });
    expect(link).toBeInTheDocument();
    expect(link).toHaveClass("table-number-link");
    expect(link).toHaveClass("table-mono-cell");
    expect(link).toHaveClass("tabular-nums");
    expect(link).toHaveAttribute("href", "/containers/show/cntr-01");
  });

  it("cột number hiển thị '—' khi giá trị rỗng/null", () => {
    const sampleContainerEmpty: Container = {
      id: "cntr-empty",
      number: "",
      isoType: "20GP",
      isLaden: false,
      grossWeight: 2200,
      status: "empty",
      createdAt: "2026-03-01T00:00:00Z",
    };

    const { container } = renderWithProviders(<TableHarness data={[sampleContainerEmpty]} />);
    const emptySpan = container.querySelector(".table-cell-empty");
    expect(emptySpan).toBeInTheDocument();
    expect(emptySpan).toHaveTextContent("—");
  });

  it("cột grossWeight: align right, tabular-nums, kèm đơn vị kg và định dạng số", () => {
    const sampleContainer: Container = {
      id: "cntr-02",
      number: "CMAU1234567",
      isoType: "40HC",
      isLaden: true,
      grossWeight: 30480,
      status: "in_transit",
      createdAt: "2026-03-01T00:00:00Z",
    };

    renderWithProviders(<TableHarness data={[sampleContainer]} />);

    expect(screen.getByText(/30\.480 kg/)).toBeInTheDocument();

    const weightCol = containerColumns.find((col) => col.dataIndex === "grossWeight");
    expect(weightCol?.align).toBe("right");
    expect(weightCol?.numeric).toBe(true);
  });

  it("cột grossWeight: hiển thị '—' khi null hoặc rỗng", () => {
    const sampleContainerNull: Container = {
      id: "cntr-03",
      number: "HLXU7654321",
      isoType: "20GP",
      isLaden: false,
      grossWeight: null as unknown as number,
      status: "empty",
      createdAt: "2026-03-01T00:00:00Z",
    };

    const { container } = renderWithProviders(<TableHarness data={[sampleContainerNull]} />);
    const emptySpans = container.querySelectorAll(".table-cell-empty");
    expect(emptySpans.length).toBeGreaterThanOrEqual(1);
    expect(emptySpans[0]).toHaveTextContent("—");
  });

  it("cột status ánh xạ chính xác 4 trạng thái theo yêu cầu: empty (default/neutral), loaded (success), in_transit (info/processing), maintenance (warning) kèm nhãn tiếng Việt", () => {
    expect(containerStatusMap.empty).toBe("neutral");
    expect(containerStatusMap.loaded).toBe("success");
    expect(containerStatusMap.in_transit).toBe("processing");
    expect(containerStatusMap.maintenance).toBe("warning");

    const sampleContainers: Container[] = [
      { id: "1", number: "C1", isoType: "20GP", isLaden: false, grossWeight: 2000, status: "empty", createdAt: "2026-03-01T00:00:00Z" },
      { id: "2", number: "C2", isoType: "40GP", isLaden: true, grossWeight: 22000, status: "loaded", createdAt: "2026-03-01T00:00:00Z" },
      { id: "3", number: "C3", isoType: "40HC", isLaden: true, grossWeight: 25000, status: "in_transit", createdAt: "2026-03-01T00:00:00Z" },
      { id: "4", number: "C4", isoType: "20HC", isLaden: false, grossWeight: 2100, status: "maintenance", createdAt: "2026-03-01T00:00:00Z" },
    ];

    const { container } = renderWithProviders(<TableHarness data={sampleContainers} />);

    // Kiểm tra class tone của StatusTag
    expect(container.querySelector(".status-tag--neutral")).toBeInTheDocument();
    expect(container.querySelector(".status-tag--success")).toBeInTheDocument();
    expect(container.querySelector(".status-tag--processing")).toBeInTheDocument();
    expect(container.querySelector(".status-tag--warning")).toBeInTheDocument();

    // Kiểm tra nhãn tiếng Việt
    expect(screen.getByText("Rỗng")).toBeInTheDocument();
    expect(screen.getByText("Đã đóng hàng")).toBeInTheDocument();
    expect(screen.getByText("Đang vận chuyển")).toBeInTheDocument();
    expect(screen.getByText("Bảo trì")).toBeInTheDocument();
  });

  it("cột actions cố định bên phải với chiều rộng 130px", () => {
    const actionsCol = containerColumns.find((col) => col.key === "actions");
    expect(actionsCol).toBeDefined();
    expect(actionsCol?.fixed).toBe("right");
    expect(actionsCol?.width).toBe(130);
  });
});
