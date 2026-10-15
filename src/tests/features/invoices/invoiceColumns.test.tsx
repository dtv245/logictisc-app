/**
 * Unit & Integration Tests cho invoiceColumns sau khi chuẩn hóa UI:
 * - number dạng Link tới /invoices/show/:id, font-weight 500, tabular-nums
 * - totalAmount & balance: align right, tabular-nums, format tiền tệ
 * - dueDate: hiển thị cảnh báo kèm chữ khi quá hạn và chưa thanh toán đủ
 * - status: bọc trong StatusTag với màu ngữ nghĩa chính xác
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
import {
  invoiceColumns,
  calculateOverdueDays,
  isInvoiceFullyPaid,
} from "@features/invoices/components/columns";
import type { Invoice } from "@/types/invoice.types";

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
              name: "invoices",
              list: "/invoices",
              show: "/invoices/show/:id",
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

const InvoiceTableHarness = ({ data }: { data: Invoice[] }) => {
  const columns = useLocalizedColumns(invoiceColumns);
  return <Table columns={columns} dataSource={data} pagination={false} rowKey="id" />;
};

describe("invoiceColumns — Chuẩn hóa UI bảng Hóa đơn (Invoices List)", () => {
  const sampleInvoice: Invoice = {
    id: "inv-001",
    number: 1001,
    type: "customer",
    status: "issued",
    customerName: "Công ty Vận tải Miền Bắc",
    employeeName: "Nguyễn Văn A",
    totalAmount: 15000000,
    totalCurrency: "VND",
    balance: 15000000,
    dueDate: "2026-10-25",
  };

  it("cột number render Link tới trang chi tiết với class table-number-link", () => {
    renderWithProviders(<InvoiceTableHarness data={[sampleInvoice]} />);

    const link = screen.getByRole("link", { name: "1001" });
    expect(link).toBeInTheDocument();
    expect(link).toHaveClass("table-number-link");
    expect(link).toHaveAttribute("href", "/invoices/show/inv-001");
  });

  it("cột totalAmount và balance được format tiền tệ, align right và dùng tabular-nums", () => {
    renderWithProviders(<InvoiceTableHarness data={[sampleInvoice]} />);

    // Kiểm tra tiền tệ 15.000.000 ₫
    const formattedAmounts = screen.getAllByText(/15\.000\.000/);
    expect(formattedAmounts.length).toBeGreaterThanOrEqual(2);

    // Cả 2 span đều có class tabular-nums
    expect(formattedAmounts[0]).toHaveClass("tabular-nums");
    expect(formattedAmounts[1]).toHaveClass("tabular-nums");

    // Kiểm tra cấu hình align: right trong column definition
    const totalCol = invoiceColumns.find((col) => col.key === "totalAmount" || ("dataIndex" in col && col.dataIndex === "totalAmount"));
    const balanceCol = invoiceColumns.find((col) => col.key === "balance" || ("dataIndex" in col && col.dataIndex === "balance"));
    expect(totalCol?.align).toBe("right");
    expect(balanceCol?.align).toBe("right");
  });

  it("dữ liệu rỗng / null hiển thị '—' với class table-cell-empty", () => {
    const emptyInvoice: Invoice = {
      id: "inv-002",
      number: 1002,
      type: "customer",
      status: "draft",
      customerName: null,
      employeeName: null,
      totalAmount: null,
      totalCurrency: null,
      balance: null,
      dueDate: null,
    };

    const { container } = renderWithProviders(<InvoiceTableHarness data={[emptyInvoice]} />);

    const emptyPlaceholders = container.querySelectorAll(".table-cell-empty");
    expect(emptyPlaceholders.length).toBeGreaterThan(0);
    expect(emptyPlaceholders[0]).toHaveTextContent("—");
  });

  it("cột status bọc trong StatusTag với màu ngữ nghĩa chính xác", () => {
    const invoices: Invoice[] = [
      { id: "1", number: 1, type: "c", status: "paid", totalAmount: 100 },
      { id: "2", number: 2, type: "c", status: "issued", totalAmount: 100 },
      { id: "3", number: 3, type: "c", status: "partially_paid", totalAmount: 100 },
      { id: "4", number: 4, type: "c", status: "cancelled", totalAmount: 100 },
      { id: "5", number: 5, type: "c", status: "draft", totalAmount: 100 },
    ];

    const { container } = renderWithProviders(<InvoiceTableHarness data={invoices} />);

    expect(screen.getByText("Đã thanh toán")).toBeInTheDocument();
    expect(screen.getByText("Đã phát hành")).toBeInTheDocument();
    expect(screen.getByText("Thanh toán một phần")).toBeInTheDocument();
    expect(screen.getByText("Đã hủy")).toBeInTheDocument();
    expect(screen.getByText("Nháp")).toBeInTheDocument();

    expect(container.querySelector(".status-tag--success")).toBeInTheDocument();
    expect(container.querySelector(".status-tag--processing")).toBeInTheDocument();
    expect(container.querySelector(".status-tag--warning")).toBeInTheDocument();
    expect(container.querySelector(".status-tag--error")).toBeInTheDocument();
    expect(container.querySelector(".status-tag--neutral")).toBeInTheDocument();
  });

  it("cột dueDate: nếu quá hạn và chưa thanh toán đủ thì hiển thị cảnh báo kèm chữ 'Quá hạn X ngày'", () => {
    // Giả lập ngày hiện tại là 2026-10-12
    const refDate = new Date("2026-10-12T07:00:00+07:00");
    const overdueDays = calculateOverdueDays("2026-10-07", refDate, "Asia/Ho_Chi_Minh");
    expect(overdueDays).toBe(5);

    // Hóa đơn quá hạn 5 ngày và chưa thanh toán (issued, balance: 5000000)
    const overdueInvoice: Invoice = {
      id: "inv-overdue",
      number: 1005,
      type: "customer",
      status: "issued",
      totalAmount: 5000000,
      balance: 5000000,
      dueDate: "2026-10-07",
    };

    renderWithProviders(<InvoiceTableHarness data={[overdueInvoice]} />);

    // Kiểm tra tag quá hạn có role="status" và class table-overdue-tag
    const overdueTag = screen.getByRole("status", { name: /Quá hạn/ });
    expect(overdueTag).toBeInTheDocument();
    expect(overdueTag).toHaveClass("table-overdue-tag");
    expect(overdueTag).toHaveTextContent(/Quá hạn \d+ ngày/);
  });

  it("cột dueDate: nếu đã thanh toán đủ (status = paid hoặc balance = 0) thì KHÔNG hiển thị tag quá hạn", () => {
    // Hóa đơn ngày đến hạn trong quá khứ nhưng status = paid
    const paidInvoice: Invoice = {
      id: "inv-paid",
      number: 1006,
      type: "customer",
      status: "paid",
      totalAmount: 5000000,
      balance: 0,
      dueDate: "2026-10-07",
    };

    expect(isInvoiceFullyPaid(paidInvoice)).toBe(true);

    const { container } = renderWithProviders(<InvoiceTableHarness data={[paidInvoice]} />);

    // Không có tag quá hạn
    expect(container.querySelector(".table-overdue-tag")).not.toBeInTheDocument();
    // Vẫn hiển thị ngày đến hạn bình thường
    expect(screen.getByText("07/10/2026")).toBeInTheDocument();
  });

  it("cột actions cố định bên phải với chiều rộng 130px", () => {
    const actionsCol = invoiceColumns.find((col) => col.key === "actions");
    expect(actionsCol).toBeDefined();
    expect(actionsCol?.fixed).toBe("right");
    expect(actionsCol?.width).toBe(130);
  });
});
