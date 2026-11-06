/**
 * Unit tests cho Đợt 3:
 * 1. ResourceListPage loại bỏ fallback ResourceCreateModal chung, bắt buộc truyền popup riêng qua headerButtons và tôn trọng canCreate.
 * 2. DispatchPage mở LoadCreateModal khi bấm "New shipment" thay vì chuyển trang /loads/create.
 * 3. DriverDirectoryPage tích hợp DriverCreateModal và tự động reload danh bạ khi tạo tài xế mới.
 */

import { AntdLocaleProvider } from "@/components/AntdLocaleProvider";
import { ResourceListPage } from "@/components/ResourceListPage";
import { initializeAppI18n } from "@/locales";
import { DriverDirectoryPage } from "@/pages/drivers/DriverDirectoryPage";
import { DispatchPage } from "@/pages/tms-flow/DispatchPage";
import { Refine, type AccessControlProvider, type DataProvider } from "@refinedev/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { App as AntdApp } from "antd";
import type { i18n as I18nInstance } from "i18next";
import type { ReactNode } from "react";
import { I18nextProvider } from "react-i18next";
import { MemoryRouter } from "react-router-dom";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const mockState = vi.hoisted(() => ({
  canCreate: true,
  refetchLoadsSpy: vi.fn(),
  reloadDriversSpy: vi.fn(),
}));

vi.mock("@/hooks/tms-flow/useTmsWorkspace", () => ({
  useTmsWorkspace: () => ({
    approvals: [],
    approvalIds: new Set<string>(),
    approvalsError: null,
    collection: { items: [], totalItems: 0, truncated: false },
    error: null,
    generatedAt: 1700000000000,
    isLoading: false,
    loads: { refetch: mockState.refetchLoadsSpy },
    pending: { refetch: vi.fn() },
    shipments: [],
    statuses: { refetch: vi.fn() },
    trucks: { data: { items: [] }, refetch: vi.fn() },
    trucksError: null,
  }),
}));

vi.mock("@/hooks/tms-flow/useTmsQueries", () => ({
  useTmsTimeline: () => ({
    data: { events: [] },
    error: null,
    isLoading: false,
    refetch: vi.fn(),
  }),
}));

vi.mock("@/components/tms-flow/TmsFlowMap", () => ({
  TmsFlowMap: () => <div data-testid="mock-tms-map" />,
}));

vi.mock("@/hooks/drivers/useDriverProfileRequest", () => ({
  useDriverProfileRequest: () => ({
    data: { items: [], currentPage: 1, pageSize: 20, totalItems: 0 },
    error: undefined,
    loading: false,
    reload: mockState.reloadDriversSpy,
  }),
}));

let i18nInstance: I18nInstance;
let mockCreate: ReturnType<typeof vi.fn>;

beforeAll(async () => {
  i18nInstance = await initializeAppI18n({ locale: "vi", fallbackLocale: "en" });
});

beforeEach(() => {
  mockState.canCreate = true;
  mockState.refetchLoadsSpy.mockClear();
  mockState.reloadDriversSpy.mockClear();
  mockCreate = vi.fn(async ({ variables }: { variables: Record<string, unknown> }) => ({
    data: { id: "created-batch3-1", ...variables },
  }));
});

const TEST_COLUMNS = [{ dataIndex: "name", key: "name", title: "Tên" }];

const renderWithApp = (node: ReactNode) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const dataProvider: DataProvider = {
    create: mockCreate as unknown as DataProvider["create"],
    deleteOne: vi.fn() as unknown as DataProvider["deleteOne"],
    getApiUrl: () => "http://localhost:8080",
    getList: vi.fn(async () => ({ data: [], total: 0 })) as unknown as DataProvider["getList"],
    getMany: vi.fn(async () => ({ data: [] })) as unknown as DataProvider["getMany"],
    getOne: vi.fn(async () => ({ data: { id: "1" } })) as unknown as DataProvider["getOne"],
    update: vi.fn() as unknown as DataProvider["update"],
  };

  const accessControlProvider: AccessControlProvider = {
    can: async ({ action }) => {
      if (action === "create") {
        return { can: mockState.canCreate };
      }
      return { can: true };
    },
  };

  return render(
    <MemoryRouter>
      <I18nextProvider i18n={i18nInstance}>
        <AntdLocaleProvider>
          <AntdApp>
            <QueryClientProvider client={queryClient}>
              <Refine
                accessControlProvider={accessControlProvider}
                dataProvider={dataProvider}
                options={{ disableTelemetry: true }}
                resources={[
                  { name: "customers" },
                  { name: "drivers" },
                  { name: "employees" },
                  { name: "loads" },
                  { name: "trucks" },
                  { name: "terminals" },
                ]}
              >
                {node}
              </Refine>
            </QueryClientProvider>
          </AntdApp>
        </AntdLocaleProvider>
      </I18nextProvider>
    </MemoryRouter>,
  );
};

describe("Đợt 3 — Dọn dẹp fallback ResourceCreateModal & tích hợp Popup vào màn hình thực tế", () => {
  it("ResourceListPage không còn tự render ResourceCreateModal mặc định khi không truyền headerButtons", async () => {
    renderWithApp(
      <ResourceListPage
        columns={TEST_COLUMNS}
        resource="customers"
      />,
    );

    await waitFor(() => {
      expect(screen.getByRole("columnheader", { name: "Tên" })).toBeInTheDocument();
    });
    expect(screen.queryByRole("button", { name: /Tạo|Thêm mới/i })).not.toBeInTheDocument();
  });

  it("ResourceListPage hiển thị headerButtons khi canCreate = true và ẩn khi canCreate = false", async () => {
    mockState.canCreate = true;
    const { unmount } = renderWithApp(
      <ResourceListPage
        columns={TEST_COLUMNS}
        resource="customers"
        headerButtons={() => <button type="button">Popup riêng Khách hàng</button>}
      />,
    );

    expect(await screen.findByRole("button", { name: "Popup riêng Khách hàng" })).toBeInTheDocument();
    unmount();

    mockState.canCreate = false;
    renderWithApp(
      <ResourceListPage
        columns={TEST_COLUMNS}
        resource="customers"
        headerButtons={() => <button type="button">Popup riêng Khách hàng</button>}
      />,
    );

    await waitFor(() => {
      expect(screen.getByRole("columnheader", { name: "Tên" })).toBeInTheDocument();
    });
    expect(screen.queryByRole("button", { name: "Popup riêng Khách hàng" })).not.toBeInTheDocument();
  });

  it("DispatchPage mở LoadCreateModal khi bấm 'Tạo lô hàng' thay vì chuyển trang", async () => {
    renderWithApp(<DispatchPage />);

    const newShipmentBtn = screen.getByRole("button", { name: "Tạo lô hàng" });
    fireEvent.click(newShipmentBtn);

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Thông tin chung")).toBeInTheDocument();
    expect(screen.getByText("Điểm lấy hàng (Origin)")).toBeInTheDocument();
  });

  it("DriverDirectoryPage mở DriverCreateModal khi bấm 'Thêm mới' và reload danh bạ khi tạo tài xế thành công", async () => {
    renderWithApp(<DriverDirectoryPage />);

    const createDriverBtn = screen.getByRole("button", { name: /Thêm mới/i });
    fireEvent.click(createDriverBtn);

    expect(await screen.findByRole("dialog")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/Họ và tên đệm/i), {
      target: { value: "Nguyễn Văn" },
    });
    fireEvent.change(screen.getByLabelText(/Tên tài xế/i), {
      target: { value: "Tài" },
    });
    fireEvent.change(screen.getByLabelText(/Email tài xế/i), {
      target: { value: "tai.driver@company.com" },
    });

    const dialog = screen.getByRole("dialog");
    const submitBtn = dialog.querySelector("button.ant-btn-primary") as HTMLButtonElement;
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledTimes(1);
    });
    await waitFor(() => {
      expect(mockState.reloadDriversSpy).toHaveBeenCalledTimes(1);
    });
  });
});
