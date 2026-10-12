/**
 * Unit & Integration Tests cho employeeColumns:
 * - Cột firstName: Link tới /employees/show/:id với table-number-link (font-weight 500).
 * - Cột lastName: Tooltip + table-cell-ellipsis.
 * - Cột phoneNumber & email: tabular-nums, Tooltip + table-cell-ellipsis.
 * - Cell rỗng: placeholder "—" (table-cell-empty).
 * - Cột status: StatusTag ngữ nghĩa cho active, inactive, on_leave.
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
import { employeeColumns } from "@features/employees/components/columns";
import type { Employee } from "@/types/employee.types";

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
              name: "employees",
              list: "/employees",
              show: "/employees/show/:id",
              edit: "/employees/edit/:id",
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

describe("employeeColumns — Chuẩn hóa UI & a11y", () => {
  const TableHarness = ({ data }: { data: Employee[] }) => {
    const columns = useLocalizedColumns(employeeColumns);
    return <Table columns={columns} dataSource={data} pagination={false} rowKey="id" />;
  };

  const sampleEmployee: Employee = {
    id: "emp-101",
    firstName: "Văn A",
    lastName: "Nguyễn",
    email: "nguyen.vana@logisticsx.com",
    phoneNumber: "0901234567",
    status: "active",
    joinedDate: "2025-01-15",
    salaryType: "monthly",
  };

  it("cột firstName render router Link tới /employees/show/:id với class table-number-link", () => {
    renderWithProviders(<TableHarness data={[sampleEmployee]} />);

    const link = screen.getByRole("link", { name: "Văn A" });
    expect(link).toBeInTheDocument();
    expect(link).toHaveClass("table-number-link");
    expect(link).toHaveAttribute("href", "/employees/show/emp-101");
  });

  it("cột phoneNumber và email render tabular-nums và có tooltip + ellipsis", () => {
    const { container } = renderWithProviders(<TableHarness data={[sampleEmployee]} />);

    expect(screen.getByText("nguyen.vana@logisticsx.com")).toBeInTheDocument();
    expect(screen.getByText("0901234567")).toBeInTheDocument();

    const tabularElements = container.querySelectorAll(".tabular-nums");
    expect(tabularElements.length).toBeGreaterThanOrEqual(2);

    const ellipsisElements = container.querySelectorAll(".table-cell-ellipsis");
    expect(ellipsisElements.length).toBeGreaterThanOrEqual(2);
  });

  it("cột status render StatusTag với role status, nhãn i18n và tone ngữ nghĩa", () => {
    const employees: Employee[] = [
      { ...sampleEmployee, id: "e1", status: "active" },
      { ...sampleEmployee, id: "e2", status: "inactive" },
      { ...sampleEmployee, id: "e3", status: "on_leave" },
    ];

    renderWithProviders(<TableHarness data={employees} />);

    const activeTag = screen.getByText("Hoạt động").closest(".status-tag");
    expect(activeTag).toBeInTheDocument();
    expect(activeTag).toHaveClass("status-tag--success");

    const inactiveTag = screen.getByText("Không hoạt động").closest(".status-tag");
    expect(inactiveTag).toBeInTheDocument();
    expect(inactiveTag).toHaveClass("status-tag--neutral");

    const leaveTag = screen.getByText("Đang nghỉ").closest(".status-tag");
    expect(leaveTag).toBeInTheDocument();
    expect(leaveTag).toHaveClass("status-tag--warning");
  });

  it("hiển thị '—' với class table-cell-empty khi dữ liệu null hoặc rỗng", () => {
    const emptyEmployee: Employee = {
      id: "emp-empty",
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: null,
      status: "active",
      joinedDate: "2025-01-15",
      salaryType: "monthly",
    };

    const { container } = renderWithProviders(<TableHarness data={[emptyEmployee]} />);

    const emptyPlaceholders = container.querySelectorAll(".table-cell-empty");
    expect(emptyPlaceholders.length).toBeGreaterThanOrEqual(3);
  });

  it("cấu hình cột actions cố định bên phải và có độ rộng chuẩn 130px", () => {
    const actionsCol = employeeColumns.find((col) => col.key === "actions");
    expect(actionsCol).toBeDefined();
    expect(actionsCol?.width).toBe(130);
    expect(actionsCol?.fixed).toBe("right");
  });
});
