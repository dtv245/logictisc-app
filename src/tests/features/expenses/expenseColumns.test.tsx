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
  expenseColumns,
  expenseStatusMap,
  formatExpenseAmount,
} from "@features/expenses/components/columns";
import type { Expense } from "@/features/expenses/types";

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
              name: "expenses",
              list: "/expenses",
              show: "/expenses/show/:id",
              edit: "/expenses/edit/:id",
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

describe("expenseColumns — Chuẩn hóa UI Expenses List theo Trucks", () => {
  const TableHarness = ({ data }: { data: Expense[] }) => {
    const columns = useLocalizedColumns(expenseColumns);
    return <Table columns={columns} dataSource={data} pagination={false} rowKey="id" />;
  };

  it("cột number render router Link tới /expenses/show/:id với class table-number-link", () => {
    const sampleExpense: Expense = {
      id: "exp-001",
      number: 1001,
      type: "general",
      status: "approved",
      vendorName: "Công ty Xăng Dầu Petrolimex",
      expenseDate: "2026-03-15",
      amount: { amount: 2500000, currency: "VND" },
      createdAt: "2026-03-15T08:00:00Z",
    };

    renderWithProviders(<TableHarness data={[sampleExpense]} />);

    const link = screen.getByRole("link", { name: "1001" });
    expect(link).toBeInTheDocument();
    expect(link).toHaveClass("table-number-link");
    expect(link).toHaveAttribute("href", "/expenses/show/exp-001");
  });

  it("cột number hiển thị '—' khi giá trị null/rỗng", () => {
    const sampleExpenseEmpty: Expense = {
      id: "exp-empty",
      number: null as unknown as number,
      type: "repair",
      status: "draft",
      expenseDate: "2026-03-15",
      amount: { amount: 500000, currency: "VND" },
      createdAt: "2026-03-15T08:00:00Z",
    };

    const { container } = renderWithProviders(<TableHarness data={[sampleExpenseEmpty]} />);
    const emptySpan = container.querySelector(".table-cell-empty");
    expect(emptySpan).toBeInTheDocument();
    expect(emptySpan).toHaveTextContent("—");
  });

  it("cột vendorName hiển thị ellipsis và Tooltip cho text dài, hiển thị '—' khi null", () => {
    const sampleExpenseWithVendor: Expense = {
      id: "exp-002",
      number: 1002,
      type: "repair",
      status: "submitted",
      vendorName: "Trung tâm Bảo dưỡng và Sửa chữa Ô tô Vận tải Miền Bắc",
      expenseDate: "2026-03-16",
      amount: { amount: 8400000, currency: "VND" },
      createdAt: "2026-03-16T08:00:00Z",
    };

    const sampleExpenseNoVendor: Expense = {
      id: "exp-003",
      number: 1003,
      type: "general",
      status: "draft",
      vendorName: null,
      expenseDate: "2026-03-17",
      amount: { amount: 150000, currency: "VND" },
      createdAt: "2026-03-17T08:00:00Z",
    };

    const { container } = renderWithProviders(
      <TableHarness data={[sampleExpenseWithVendor, sampleExpenseNoVendor]} />,
    );

    // Text dài có class table-cell-ellipsis
    expect(container.querySelector(".table-cell-ellipsis")).toBeInTheDocument();

    // Vendor null hiển thị '—'
    const emptySpans = container.querySelectorAll(".table-cell-empty");
    expect(emptySpans.length).toBeGreaterThanOrEqual(1);
  });

  it("cột amount: align right, tabular-nums, định dạng tiền tệ và hiển thị '—' khi null", () => {
    const sampleExpenseMoney: Expense = {
      id: "exp-004",
      number: 1004,
      type: "truck",
      status: "paid",
      vendorName: "Trạm thu phí VEC",
      expenseDate: "2026-03-18",
      amount: { amount: 350000, currency: "VND" },
      createdAt: "2026-03-18T08:00:00Z",
    };

    const sampleExpenseNullAmount: Expense = {
      id: "exp-005",
      number: 1005,
      type: "general",
      status: "draft",
      vendorName: "Cửa hàng tiện lợi",
      expenseDate: "2026-03-19",
      amount: null as unknown as Expense["amount"],
      createdAt: "2026-03-19T08:00:00Z",
    };

    const { container } = renderWithProviders(
      <TableHarness data={[sampleExpenseMoney, sampleExpenseNullAmount]} />,
    );

    // Định dạng tiền tệ VND với ₫
    expect(screen.getByText(/350\.000\s*₫/)).toBeInTheDocument();

    // Cột amount có align right và numeric
    const amountCol = expenseColumns.find((col) => col.dataIndex === "amount");
    expect(amountCol?.align).toBe("right");
    expect(amountCol?.numeric).toBe(true);

    // Amount null hiển thị '—'
    const emptySpans = container.querySelectorAll(".table-cell-empty");
    expect(emptySpans.length).toBeGreaterThanOrEqual(1);
  });

  it("formatExpenseAmount hỗ trợ linh hoạt cả object Money và số nguyên/chuỗi", () => {
    expect(formatExpenseAmount({ amount: 1200000, currency: "VND" })).toMatch(/1\.200\.000\s*₫/);
    expect(formatExpenseAmount(500000)).toMatch(/500\.000\s*₫/);
    expect(formatExpenseAmount("750000")).toMatch(/750\.000\s*₫/);
    expect(formatExpenseAmount(null)).toBe("");
    expect(formatExpenseAmount(undefined)).toBe("");
    expect(formatExpenseAmount("invalid")).toBe("");
  });

  it("cột expenseDate: định dạng ngày, tabular-nums và hiển thị '—' khi null", () => {
    const sampleExpenseDate: Expense = {
      id: "exp-006",
      number: 1006,
      type: "general",
      status: "approved",
      vendorName: "Công ty nước giải khát",
      expenseDate: "2026-03-25",
      amount: { amount: 120000, currency: "VND" },
      createdAt: "2026-03-25T08:00:00Z",
    };

    const sampleExpenseNullDate: Expense = {
      id: "exp-007",
      number: 1007,
      type: "general",
      status: "draft",
      vendorName: "Chi tiêu vặt",
      expenseDate: null as unknown as string,
      amount: { amount: 80000, currency: "VND" },
      createdAt: "2026-03-25T08:00:00Z",
    };

    const { container } = renderWithProviders(
      <TableHarness data={[sampleExpenseDate, sampleExpenseNullDate]} />,
    );

    // 2026-03-25 định dạng theo vi-VN
    expect(screen.getByText(/25\/03\/2026/)).toBeInTheDocument();

    // Date null hiển thị '—'
    const emptySpans = container.querySelectorAll(".table-cell-empty");
    expect(emptySpans.length).toBeGreaterThanOrEqual(1);
  });

  it("cột status ánh xạ đầy đủ 5 trạng thái ngữ nghĩa kèm nhãn tiếng Việt", () => {
    expect(expenseStatusMap.draft).toBe("neutral");
    expect(expenseStatusMap.submitted).toBe("processing");
    expect(expenseStatusMap.approved).toBe("success");
    expect(expenseStatusMap.rejected).toBe("error");
    expect(expenseStatusMap.paid).toBe("success");

    const sampleExpenses: Expense[] = [
      { id: "1", number: 1, type: "general", status: "draft", expenseDate: "2026-03-01", amount: { amount: 10, currency: "VND" }, createdAt: "2026-03-01T00:00:00Z" },
      { id: "2", number: 2, type: "repair", status: "submitted", expenseDate: "2026-03-02", amount: { amount: 20, currency: "VND" }, createdAt: "2026-03-02T00:00:00Z" },
      { id: "3", number: 3, type: "truck", status: "approved", expenseDate: "2026-03-03", amount: { amount: 30, currency: "VND" }, createdAt: "2026-03-03T00:00:00Z" },
      { id: "4", number: 4, type: "repair", status: "rejected", expenseDate: "2026-03-04", amount: { amount: 40, currency: "VND" }, createdAt: "2026-03-04T00:00:00Z" },
      { id: "5", number: 5, type: "truck", status: "paid", expenseDate: "2026-03-05", amount: { amount: 50, currency: "VND" }, createdAt: "2026-03-05T00:00:00Z" },
    ];

    const { container } = renderWithProviders(<TableHarness data={sampleExpenses} />);

    // Tones
    expect(container.querySelector(".status-tag--neutral")).toBeInTheDocument();
    expect(container.querySelector(".status-tag--processing")).toBeInTheDocument();
    expect(container.querySelector(".status-tag--success")).toBeInTheDocument();
    expect(container.querySelector(".status-tag--error")).toBeInTheDocument();

    // Nhãn tiếng Việt
    expect(screen.getByText("Nháp")).toBeInTheDocument();
    expect(screen.getByText("Đã gửi")).toBeInTheDocument();
    expect(screen.getByText("Đã duyệt")).toBeInTheDocument();
    expect(screen.getByText("Đã từ chối")).toBeInTheDocument();
    expect(screen.getByText("Đã thanh toán")).toBeInTheDocument();
  });

  it("cột actions cố định bên phải với chiều rộng 130px", () => {
    const actionsCol = expenseColumns.find((col) => col.key === "actions");
    expect(actionsCol).toBeDefined();
    expect(actionsCol?.fixed).toBe("right");
    expect(actionsCol?.width).toBe(130);
  });
});
