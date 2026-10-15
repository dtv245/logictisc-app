import { describe, it, expect, beforeAll, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Refine, type DataProvider } from "@refinedev/core";
import { Table } from "antd";
import { I18nextProvider } from "react-i18next";
import type { i18n as I18nInstance } from "i18next";

import { initializeAppI18n } from "@locales";
import { useLocalizedColumns } from "@hooks/useLocalizedColumns";
import {
  paymentColumns,
  formatPaymentAmount,
  paymentStatusMap,
} from "@features/payments/components/columns";
import type { Payment } from "@/features/payments/types";

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
    <I18nextProvider i18n={i18nInstance}>
      <MemoryRouter>
        <QueryClientProvider client={queryClient}>
          <Refine
            dataProvider={mockDataProvider}
            resources={[
              {
                name: "payments",
                list: "/payments",
                show: "/payments/show/:id",
                edit: "/payments/edit/:id",
              },
              {
                name: "invoices",
                list: "/invoices",
                show: "/invoices/show/:id",
              },
            ]}
          >
            {node}
          </Refine>
        </QueryClientProvider>
      </MemoryRouter>
    </I18nextProvider>,
  );
};

describe("paymentColumns — Chuẩn hóa UI & UX", () => {
  const TableHarness = ({ data }: { data: Payment[] }) => {
    const columns = useLocalizedColumns(paymentColumns);
    return <Table columns={columns} dataSource={data} pagination={false} rowKey="id" />;
  };

  const samplePayment: Payment = {
    id: "pay-101",
    referenceNumber: "PAY-2026-001",
    amountAmount: 15000000,
    amountCurrency: "VND",
    status: "succeeded",
    invoiceId: "inv-201",
    invoiceNumber: 1002,
    recordedAt: "2026-03-15T09:30:00Z",
  };

  it("cột referenceNumber: render dạng router Link, có class table-number-link và table-mono-cell", () => {
    renderWithProviders(<TableHarness data={[samplePayment]} />);

    const link = screen.getByRole("link", { name: "PAY-2026-001" });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/payments/show/pay-101");
    expect(link).toHaveClass("table-number-link");
    expect(link).toHaveClass("table-mono-cell");
  });

  it("cột amountAmount: align right, tabular-nums, định dạng tiền tệ VND", () => {
    renderWithProviders(<TableHarness data={[samplePayment]} />);

    const formattedAmount = formatPaymentAmount(samplePayment.amountAmount, samplePayment);
    expect(formattedAmount).toContain("15.000.000");

    const amountCell = screen.getByText(/15\.000\.000/);
    expect(amountCell).toBeInTheDocument();
    expect(amountCell).toHaveClass("tabular-nums");
    expect(amountCell.textContent).toBe(formattedAmount);

    // Kiểm tra cấu hình cột numeric & align right
    const amountCol = paymentColumns.find((col) => col.dataIndex === "amountAmount");
    expect(amountCol?.align).toBe("right");
    expect(amountCol?.numeric).toBe(true);
  });

  it("cột status: ánh xạ chính xác tone và nhãn chữ semantic cho succeeded, pending, failed", () => {
    expect(paymentStatusMap.succeeded).toBe("success");
    expect(paymentStatusMap.pending).toBe("warning");
    expect(paymentStatusMap.failed).toBe("error");

    const paymentsWithStatuses: Payment[] = [
      { ...samplePayment, id: "p1", status: "succeeded" },
      { ...samplePayment, id: "p2", status: "pending" },
      { ...samplePayment, id: "p3", status: "failed" },
    ];

    renderWithProviders(<TableHarness data={paymentsWithStatuses} />);

    // Nhãn chữ tiếng Việt từ forms.options
    const successTag = screen.getByRole("status", { name: "Thành công" });
    expect(successTag).toBeInTheDocument();
    expect(successTag).toHaveClass("status-tag--success");

    const pendingTag = screen.getByRole("status", { name: "Đang chờ" });
    expect(pendingTag).toBeInTheDocument();
    expect(pendingTag).toHaveClass("status-tag--warning");

    const failedTag = screen.getByRole("status", { name: "Thất bại" });
    expect(failedTag).toBeInTheDocument();
    expect(failedTag).toHaveClass("status-tag--error");
  });

  it("cột invoiceId: render Link tới invoice show với số hóa đơn có #", () => {
    renderWithProviders(<TableHarness data={[samplePayment]} />);

    const invoiceLink = screen.getByRole("link", { name: "#1002" });
    expect(invoiceLink).toBeInTheDocument();
    expect(invoiceLink).toHaveAttribute("href", "/invoices/show/inv-201");
    expect(invoiceLink).toHaveClass("table-number-link");
    expect(invoiceLink).toHaveClass("table-mono-cell");
  });

  it("cột recordedAt: format datetime với tabular-nums", () => {
    renderWithProviders(<TableHarness data={[samplePayment]} />);

    // Thời điểm ghi nhận có năm 2026
    const dateCells = screen.getAllByText(/2026/);
    const recordedCell = dateCells.find((el) => el.classList.contains("tabular-nums"));
    expect(recordedCell).toBeDefined();
  });

  it("hiển thị '—' với class table-cell-empty khi dữ liệu trống", () => {
    const emptyPayment: Payment = {
      id: "pay-empty",
      referenceNumber: "",
      amountAmount: null as unknown as number,
      amountCurrency: "",
      status: "",
      invoiceId: "",
      invoiceNumber: null,
      recordedAt: null,
    };

    const { container } = renderWithProviders(<TableHarness data={[emptyPayment]} />);

    const emptyPlaceholders = container.querySelectorAll(".table-cell-empty");
    expect(emptyPlaceholders.length).toBeGreaterThanOrEqual(3);
    emptyPlaceholders.forEach((el) => {
      expect(el).toHaveTextContent("—");
    });
  });

  it("cột thao tác: hiển thị nút hành động với capability tương ứng", () => {
    renderWithProviders(<TableHarness data={[samplePayment]} />);

    const viewButton = screen.getByRole("button", { name: "Xem pay-101" });
    expect(viewButton).toBeInTheDocument();
  });
});
