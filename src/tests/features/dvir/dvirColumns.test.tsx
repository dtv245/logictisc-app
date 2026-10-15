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
  dvirColumns,
  dvirResultMap,
  dvirStatusMap,
} from "@features/dvir/components/columns";
import type { DvirReport } from "@/features/dvir/types";
import { defaultStatusStyles } from "@components/StatusTag";

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
              name: "dvir",
              list: "/dvir",
              show: "/dvir/show/:id",
              edit: "/dvir/edit/:id",
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

const createDvirReport = (overrides: Partial<DvirReport> = {}): DvirReport => ({
  id: "dvir-test",
  truckId: "TRK-01",
  driverId: "DRV-01",
  type: "pre_trip",
  status: "draft",
  inspectionDate: "2026-10-12T08:00:00Z",
  hasDefects: false,
  createdAt: "2026-10-12T00:00:00Z",
  ...overrides,
});

describe("dvirColumns — Chuẩn hóa UI Báo cáo kiểm tra an toàn xe (DVIR)", () => {
  const TableHarness = ({ data }: { data: DvirReport[] }) => {
    const columns = useLocalizedColumns(dvirColumns);
    return <Table columns={columns} dataSource={data} pagination={false} rowKey="id" />;
  };

  it("cột id render router Link tới /dvir/show/:id với class table-number-link", () => {
    const sampleReport = createDvirReport({
      id: "dvir-001",
      truckId: "TRK-101",
      driverId: "DRV-01",
      type: "pre_trip",
      status: "submitted",
      result: "safe",
      inspectionDate: "2026-10-12T08:30:00Z",
    });

    renderWithProviders(<TableHarness data={[sampleReport]} />);

    const link = screen.getByRole("link", { name: "dvir-001" });
    expect(link).toBeInTheDocument();
    expect(link).toHaveClass("table-number-link");
    expect(link).toHaveAttribute("href", "/dvir/show/dvir-001");
  });

  it("cột inspectionDate format an toàn với tabular-nums và hiển thị '—' khi trống", () => {
    const sampleWithDate = createDvirReport({
      id: "dvir-002",
      truckId: "TRK-102",
      type: "post_trip",
      status: "reviewed",
      result: "defect_found",
      inspectionDate: "2026-10-12T14:45:00Z",
      hasDefects: true,
    });

    const sampleEmptyDate = createDvirReport({
      id: "dvir-003",
      truckId: "TRK-103",
      type: "pre_trip",
      status: "draft",
      result: null,
      inspectionDate: "",
    });

    const { container } = renderWithProviders(
      <TableHarness data={[sampleWithDate, sampleEmptyDate]} />,
    );

    // Kiểm tra dòng có date: chứa tabular-nums
    const tabularSpans = container.querySelectorAll(".tabular-nums");
    expect(tabularSpans.length).toBeGreaterThan(0);

    // Dòng trống có placeholder table-cell-empty '—'
    const emptySpans = container.querySelectorAll(".table-cell-empty");
    expect(emptySpans.length).toBeGreaterThanOrEqual(1);
    expect(emptySpans[0]).toHaveTextContent("—");
  });

  it("cột kết quả (result): map màu ngữ nghĩa chính xác (safe: xanh lá, defect_found: cam, out_of_service: đỏ)", () => {
    expect(dvirResultMap.safe).toBe("success");
    expect(dvirResultMap.defect_found).toBe("warning");
    expect(typeof dvirResultMap.out_of_service).toBe("object");

    const sampleReports: DvirReport[] = [
      createDvirReport({
        id: "dvir-safe",
        status: "certified",
        result: "safe",
      }),
      createDvirReport({
        id: "dvir-defect",
        status: "submitted",
        result: "defect_found",
        hasDefects: true,
      }),
      createDvirReport({
        id: "dvir-oos",
        type: "post_trip",
        status: "reviewed",
        result: "out_of_service",
        hasDefects: true,
      }),
    ];

    const { container } = renderWithProviders(<TableHarness data={sampleReports} />);

    // 1. safe: tag xanh lá với nhãn "An toàn"
    const safeTag = screen.getByText("An toàn");
    expect(safeTag).toBeInTheDocument();

    // 2. defect_found: tag cam với nhãn "Phát hiện lỗi"
    const defectTag = screen.getByText("Phát hiện lỗi");
    expect(defectTag).toBeInTheDocument();

    // 3. out_of_service: tag đỏ với nhãn "Ngừng hoạt động"
    const oosTag = screen.getByText("Ngừng hoạt động");
    expect(oosTag).toBeInTheDocument();

    // Kiểm tra class tag semantic
    expect(container.querySelector(".status-tag--success")).toBeInTheDocument();
    expect(container.querySelector(".status-tag--warning")).toBeInTheDocument();
    expect(container.querySelector(".status-tag--error")).toBeInTheDocument();
  });

  it("với out_of_service: ngoài màu đỏ phải có icon hoặc chữ rõ ràng (a11y không chỉ dựa vào màu)", () => {
    const sampleOos = createDvirReport({
      id: "dvir-oos-a11y",
      type: "post_trip",
      status: "reviewed",
      result: "out_of_service",
      hasDefects: true,
    });

    const { container } = renderWithProviders(<TableHarness data={[sampleOos]} />);

    // Tag có role="status" và aria-label="Ngừng hoạt động"
    const oosStatus = screen.getByRole("status", { name: "Ngừng hoạt động" });
    expect(oosStatus).toHaveAttribute("aria-label", "Ngừng hoạt động");

    // Tag có text nhãn rõ ràng (không chỉ dùng icon/màu)
    expect(oosStatus).toHaveTextContent("Ngừng hoạt động");

    // Tag có icon StopOutlined (anticon-stop) hỗ trợ trực quan
    const stopIcon = container.querySelector(".anticon-stop");
    expect(stopIcon).toBeInTheDocument();

    // Màu tương phản đạt chuẩn WCAG AA (đỏ đậm #b91c1c trên nền #fef2f2: 5.86:1 >= 4.5:1)
    expect(defaultStatusStyles.error.color).toBe("#b91c1c");
    expect(defaultStatusStyles.error.bg).toBe("#fef2f2");
  });

  it("cột status map chính xác các trạng thái DVIR: draft (neutral), submitted (processing), reviewed (processing), certified (success)", () => {
    expect(dvirStatusMap.draft).toBe("neutral");
    expect(dvirStatusMap.submitted).toBe("processing");
    expect(dvirStatusMap.reviewed).toBe("processing");
    expect(dvirStatusMap.certified).toBe("success");

    const sampleStatuses: DvirReport[] = [
      createDvirReport({ id: "s-1", status: "draft" }),
      createDvirReport({ id: "s-2", status: "submitted" }),
      createDvirReport({ id: "s-3", status: "reviewed" }),
      createDvirReport({ id: "s-4", status: "certified" }),
    ];

    const { container } = renderWithProviders(<TableHarness data={sampleStatuses} />);

    expect(screen.getByText("Nháp")).toBeInTheDocument();
    expect(screen.getByText("Đã gửi")).toBeInTheDocument();
    expect(screen.getByText("Đã kiểm tra")).toBeInTheDocument();
    expect(screen.getByText("Đã chứng nhận")).toBeInTheDocument();

    expect(container.querySelector(".status-tag--neutral")).toBeInTheDocument();
    expect(container.querySelector(".status-tag--processing")).toBeInTheDocument();
    expect(container.querySelector(".status-tag--success")).toBeInTheDocument();
  });

  it("cột truckId căn chỉnh rõ ràng, dùng tabular-nums và hiển thị '—' khi trống", () => {
    const sampleTruck = createDvirReport({
      id: "d-truck",
      truckId: "29C-12345",
    });

    const sampleEmptyTruck = createDvirReport({
      id: "d-truck-empty",
      truckId: "",
    });

    const { container } = renderWithProviders(
      <TableHarness data={[sampleTruck, sampleEmptyTruck]} />,
    );

    expect(screen.getByText("29C-12345")).toHaveClass("tabular-nums");

    const emptySpans = container.querySelectorAll(".table-cell-empty");
    expect(emptySpans.length).toBeGreaterThanOrEqual(1);
  });

  it("cột actions cố định bên phải với chiều rộng 130px", () => {
    const actionsCol = dvirColumns.find((col) => col.key === "actions");
    expect(actionsCol).toBeDefined();
    expect(actionsCol?.fixed).toBe("right");
    expect(actionsCol?.width).toBe(130);
  });
});
