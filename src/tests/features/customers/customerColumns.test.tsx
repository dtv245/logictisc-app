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
  customerColumns,
  customerStatusMap,
} from "@features/customers/components/columns";
import type { Customer } from "@/types/customer.types";
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
              name: "customers",
              list: "/customers",
              show: "/customers/show/:id",
              edit: "/customers/edit/:id",
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

const createMockCustomer = (overrides: Partial<Customer> = {}): Customer => ({
  id: "cust-001",
  name: "Công ty Cổ phần Vận tải Á Châu",
  email: "contact@achau.vn",
  phone: "0901234567",
  status: "active",
  isVatExempt: false,
  ...overrides,
});

describe("customerColumns — Chuẩn hóa UI Danh sách Khách hàng", () => {
  const TableHarness = ({ data }: { data: Customer[] }) => {
    const columns = useLocalizedColumns(customerColumns);
    return <Table columns={columns} dataSource={data} pagination={false} rowKey="id" />;
  };

  it("cột name render router Link tới /customers/show/:id với class table-number-link và table-cell-ellipsis", () => {
    const sampleCustomer = createMockCustomer({
      id: "cust-101",
      name: "Tập đoàn Logistics Toàn Cầu",
    });

    renderWithProviders(<TableHarness data={[sampleCustomer]} />);

    const link = screen.getByRole("link", { name: "Tập đoàn Logistics Toàn Cầu" });
    expect(link).toBeInTheDocument();
    expect(link).toHaveClass("table-number-link");
    expect(link).toHaveClass("table-cell-ellipsis");
    expect(link).toHaveAttribute("href", "/customers/show/cust-101");
  });

  it("cột name hiển thị '—' khi giá trị rỗng/null", () => {
    const emptyCustomer = createMockCustomer({
      id: "cust-empty-name",
      name: "",
    });

    const { container } = renderWithProviders(<TableHarness data={[emptyCustomer]} />);

    const emptySpans = container.querySelectorAll(".table-cell-empty");
    expect(emptySpans.length).toBeGreaterThanOrEqual(1);
    expect(emptySpans[0]).toHaveTextContent("—");
  });

  it("cột email: có ellipsis class và hiển thị '—' khi rỗng", () => {
    const customerWithEmail = createMockCustomer({
      id: "cust-email-1",
      email: "very-long-corporate-email-address@enterprise-domain.com.vn",
    });
    const customerEmptyEmail = createMockCustomer({
      id: "cust-email-2",
      email: null,
    });

    const { container } = renderWithProviders(
      <TableHarness data={[customerWithEmail, customerEmptyEmail]} />,
    );

    const emailCell = screen.getByText("very-long-corporate-email-address@enterprise-domain.com.vn");
    expect(emailCell).toBeInTheDocument();
    expect(emailCell).toHaveClass("table-cell-ellipsis");

    const emptySpans = container.querySelectorAll(".table-cell-empty");
    expect(emptySpans.length).toBeGreaterThanOrEqual(1);
  });

  it("cột phone: sử dụng tabular-nums và hiển thị '—' khi rỗng", () => {
    const customerWithPhone = createMockCustomer({
      id: "cust-phone-1",
      phone: "+84 28 3822 8888",
    });
    const customerEmptyPhone = createMockCustomer({
      id: "cust-phone-2",
      phone: "",
    });

    const { container } = renderWithProviders(
      <TableHarness data={[customerWithPhone, customerEmptyPhone]} />,
    );

    const phoneCell = screen.getByText("+84 28 3822 8888");
    expect(phoneCell).toBeInTheDocument();
    expect(phoneCell).toHaveClass("tabular-nums");

    const emptySpans = container.querySelectorAll(".table-cell-empty");
    expect(emptySpans.length).toBeGreaterThanOrEqual(1);
  });

  it("cột status map chính xác: active (success), inactive (default / neutral) kèm nhãn chữ", () => {
    expect(customerStatusMap.active).toBe("success");
    expect(customerStatusMap.inactive).toBe("neutral");

    const sampleStatuses: Customer[] = [
      createMockCustomer({ id: "cust-active", status: "active" }),
      createMockCustomer({ id: "cust-inactive", status: "inactive" }),
    ];

    const { container } = renderWithProviders(<TableHarness data={sampleStatuses} />);

    // Nhãn chữ đầy đủ (a11y không chỉ dựa vào màu sắc)
    const activeLabel = screen.getByText("Hoạt động");
    const inactiveLabel = screen.getByText("Không hoạt động");
    expect(activeLabel).toBeInTheDocument();
    expect(inactiveLabel).toBeInTheDocument();

    // Semantic StatusTag classes
    expect(container.querySelector(".status-tag--success")).toBeInTheDocument();
    expect(container.querySelector(".status-tag--neutral")).toBeInTheDocument();

    // WCAG contrast kiểm chứng
    expect(defaultStatusStyles.success.color).toBe("#15803d");
    expect(defaultStatusStyles.neutral.color).toBe("#475569");
  });

  it("cột actions cố định bên phải với chiều rộng 130px", () => {
    const actionsCol = customerColumns.find((col) => col.key === "actions");
    expect(actionsCol).toBeDefined();
    expect(actionsCol?.fixed).toBe("right");
    expect(actionsCol?.width).toBe(130);
  });
});
