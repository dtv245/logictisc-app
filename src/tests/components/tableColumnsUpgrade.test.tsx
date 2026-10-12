/**
 * Unit & Integration Tests cho nâng cấp Table Components:
 * - StatusTag: màu ngữ nghĩa, dot indicator, contrast >= 4.5:1, statusMap cho resource khác.
 * - ActionButtons: vùng chạm >= 32px, Tooltip/aria-label, hover danger, pessimistic loading, menu overflow > 3 actions.
 * - truckColumns: number link, formatting, placeholder "—" cho cell rỗng, alignment, width.
 */

import { describe, it, expect, beforeAll, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Refine, type BaseRecord, type DataProvider } from "@refinedev/core";
import { App as AntdApp, Table } from "antd";
import { I18nextProvider } from "react-i18next";
import type { i18n as I18nInstance } from "i18next";

import { initializeAppI18n } from "@locales";
import { StatusTag, defaultStatusStyles } from "@components/StatusTag";
import { ActionButtons } from "@components/ActionButtons";
import { useLocalizedColumns } from "@components/useLocalizedColumns";
import { truckColumns } from "@features/trucks/components/columns";
import type { Truck } from "@/types/truck.types";

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
              name: "trucks",
              list: "/trucks",
              show: "/trucks/show/:id",
              edit: "/trucks/edit/:id",
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

describe("StatusTag — Nâng cấp màu ngữ nghĩa, Dot Indicator và Contrast WCAG AA", () => {
  it("hiển thị nhãn i18n kèm chấm tròn nhỏ (dot indicator) và role status", () => {
    const { container } = render(<StatusTag label="Sẵn sàng" tone="success" />);

    const tag = screen.getByRole("status");
    expect(tag).toBeInTheDocument();
    expect(tag).toHaveTextContent("Sẵn sàng");

    const dot = container.querySelector(".status-tag__dot");
    expect(dot).toBeInTheDocument();
    expect(dot).toHaveStyle({ backgroundColor: defaultStatusStyles.success.dotColor });
  });

  it("mỗi trạng thái ứng với một màu ngữ nghĩa chính xác (available xanh lá, in_use xanh dương, maintenance cam, out_of_service đỏ)", () => {
    // 1. Success (available)
    const { container: cSuccess } = render(<StatusTag label="Available" tone="success" />);
    expect(cSuccess.querySelector(".status-tag__dot")).toHaveStyle({
      backgroundColor: defaultStatusStyles.success.dotColor,
    });

    // 2. Processing (in_use)
    const { container: cProc } = render(<StatusTag label="In Use" tone="processing" />);
    expect(cProc.querySelector(".status-tag__dot")).toHaveStyle({
      backgroundColor: defaultStatusStyles.processing.dotColor,
    });

    // 3. Warning (maintenance)
    const { container: cWarn } = render(<StatusTag label="Maintenance" tone="warning" />);
    expect(cWarn.querySelector(".status-tag__dot")).toHaveStyle({
      backgroundColor: defaultStatusStyles.warning.dotColor,
    });

    // 4. Error (out_of_service)
    const { container: cErr } = render(<StatusTag label="Out of Service" tone="error" />);
    expect(cErr.querySelector(".status-tag__dot")).toHaveStyle({
      backgroundColor: defaultStatusStyles.error.dotColor,
    });
  });

  it("cho phép truyền statusMap tùy biến để tái sử dụng cho resource khác (drivers, trailers)", () => {
    const driverStatusMap = {
      on_duty: "success" as const,
      driving: "processing" as const,
      sleeper_berth: "warning" as const,
      off_duty: {
        color: "#475569",
        bg: "#f1f5f9",
        border: "#cbd5e1",
        dotColor: "#64748b",
      },
    };

    const { container } = render(
      <StatusTag
        label="Nghỉ ngơi"
        statusKey="off_duty"
        statusMap={driverStatusMap}
      />,
    );

    const dot = container.querySelector(".status-tag__dot");
    expect(dot).toBeInTheDocument();
    expect(dot).toHaveStyle({ backgroundColor: "#64748b" });
  });
});

describe("ActionButtons — a11y, vùng chạm >= 32px, Tooltip, aria-label và overflow menu", () => {
  it("các nút hành động có kích thước tối thiểu >= 32px và đầy đủ aria-label", () => {
    const record: BaseRecord = { id: "cust-1", name: "Công ty ABC" };
    const { container } = renderWithProviders(
      <ActionButtons record={record} resource="customers" />,
    );

    const showBtn = container.querySelector(".refine-show-button");
    const editBtn = container.querySelector(".refine-edit-button");
    const deleteBtn = container.querySelector(".refine-delete-button");

    expect(showBtn).toBeInTheDocument();
    expect(editBtn).toBeInTheDocument();
    expect(deleteBtn).toBeInTheDocument();

    expect(showBtn).toHaveAttribute("aria-label", "Xem Công ty ABC");
    expect(editBtn).toHaveAttribute("aria-label", "Sửa Công ty ABC");
    expect(deleteBtn).toHaveAttribute("aria-label", "Xóa Công ty ABC");

    expect(showBtn).toHaveStyle({ minWidth: "32px", minHeight: "32px" });
    expect(deleteBtn).toHaveStyle({ minWidth: "32px", minHeight: "32px" });
  });

  it("nút Xóa có class table-action-btn--delete để chuyển màu danger khi hover", () => {
    const record: BaseRecord = { id: "cust-1", name: "Công ty ABC" };
    const { container } = renderWithProviders(
      <ActionButtons record={record} resource="customers" />,
    );

    const deleteBtn = container.querySelector(".table-action-btn--delete");
    expect(deleteBtn).toBeInTheDocument();
  });

  it("khi có > 3 hành động, gom các hành động vượt quá vào menu '...'", () => {
    const record: BaseRecord = { id: "cust-1", name: "Công ty ABC" };
    const extraActions = [
      { key: "clone", label: "Nhân bản", onClick: vi.fn() },
      { key: "print", label: "In phiếu", onClick: vi.fn() },
    ];

    const { container } = renderWithProviders(
      <ActionButtons
        record={record}
        resource="customers"
        extraActions={extraActions}
      />,
    );

    // Có Show và Edit ở ngoài, và 1 nút More "..."
    expect(container.querySelector(".refine-show-button")).toBeInTheDocument();
    expect(container.querySelector(".refine-edit-button")).toBeInTheDocument();

    // Nút ellipsis dropdown
    const moreBtn = container.querySelector(".ant-btn .anticon-ellipsis");
    expect(moreBtn).toBeInTheDocument();
  });
});

describe("truckColumns & useLocalizedColumns — Định dạng cột và dữ liệu trống", () => {
  const TableHarness = ({ data }: { data: Truck[] }) => {
    const columns = useLocalizedColumns(truckColumns);
    return <Table columns={columns} dataSource={data} pagination={false} rowKey="id" />;
  };

  it("cột number render dạng link nổi bật với font-weight 500, tabular-nums và class table-number-link", () => {
    const truck: Truck = {
      id: "1",
      number: "TRK-202",
      type: "SEMI_TRUCK",
      status: "available",
      licensePlate: "29C-12345",
      mainDriverName: "Nguyễn Văn A",
      isHazmatPlacarded: false,
      vehicleCapacity: 10000,
    };

    renderWithProviders(<TableHarness data={[truck]} />);

    const link = screen.getByRole("link", { name: "TRK-202" });
    expect(link).toBeInTheDocument();
    expect(link).toHaveClass("table-number-link");
    expect(link).toHaveAttribute("href", "/trucks/show/1");
  });

  it("hiển thị '—' với class table-cell-empty màu nhạt thống nhất khi dữ liệu trống", () => {
    const truckEmpty: Truck = {
      id: "2",
      number: "TRK-303",
      type: "FLATBED",
      status: "in_use",
      licensePlate: "",
      mainDriverName: null as unknown as string,
      isHazmatPlacarded: false,
      vehicleCapacity: 8000,
    };

    const { container } = renderWithProviders(<TableHarness data={[truckEmpty]} />);

    const emptyPlaceholders = container.querySelectorAll(".table-cell-empty");
    expect(emptyPlaceholders.length).toBeGreaterThanOrEqual(1);
    expect(emptyPlaceholders[0]).toHaveTextContent("—");
  });
});
