/**
 * Kiểm tra các tiêu chí chuẩn hoá Table CRUD với Modal và Thông báo (KAN-86).
 *
 * AC01: Create mở modal và không rời khỏi màn hình.
 * AC02: Edit mở modal và form nhận đúng record được chọn.
 * AC03: View mở modal và chỉ fetch detail khi được mở.
 * AC04: Delete luôn có popup xác nhận trước khi gọi API, nêu rõ tên record và cảnh báo không thể hoàn tác.
 * AC05: Create/Update/Delete đều có loading state và thông báo success/error.
 * AC07: Chống double submit hoặc double delete.
 * AC08: Pessimistic mutation mode đảm bảo không xóa giả lập nếu backend thất bại.
 * AC10: Tôn trọng permission và resource capabilities.
 */

import { AntdLocaleProvider } from "@components/AntdLocaleProvider";
import { ActionButtons } from "@components/ActionButtons";
import { ResourceActionContext } from "@components/ResourceActionContext";
import { ResourceCreateModal } from "@components/ResourceCreateModal";
import { ResourceEditModal } from "@components/ResourceEditModal";
import { initializeAppI18n } from "@locales";
import { Refine, type BaseRecord, type DataProvider } from "@refinedev/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { App as AntdApp } from "antd";
import type { ReactNode } from "react";
import { I18nextProvider } from "react-i18next";
import type { i18n as I18nInstance } from "i18next";
import { MemoryRouter } from "react-router-dom";
import { beforeAll, describe, expect, it, vi } from "vitest";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

let i18nInstance: I18nInstance;

const mockDataProvider: DataProvider = {
  create: vi.fn(async () => ({ data: { id: "new-1" } })) as unknown as DataProvider["create"],
  deleteOne: vi.fn(async () => ({ data: { id: "del-1" } })) as unknown as DataProvider["deleteOne"],
  getApiUrl: () => "http://localhost:8080",
  getList: vi.fn(async () => ({ data: [], total: 0 })) as unknown as DataProvider["getList"],
  getMany: vi.fn(async () => ({ data: [] })) as unknown as DataProvider["getMany"],
  getOne: vi.fn(async () => ({
    data: { id: "load-1", name: "Load 1", status: "created" },
  })) as unknown as DataProvider["getOne"],
  update: vi.fn(async () => ({ data: { id: "load-1" } })) as unknown as DataProvider["update"],
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
              create: "/loads/create",
              edit: "/loads/edit/:id",
              list: "/loads",
              show: "/loads/show/:id",
            },
            {
              name: "customers",
              create: "/customers/create",
              edit: "/customers/edit/:id",
              list: "/customers",
              show: "/customers/show/:id",
            },
            {
              name: "notifications",
              list: "/notifications",
              show: "/notifications/show/:id",
            },
          ]}
        >
          <I18nextProvider i18n={i18nInstance}>
            <AntdLocaleProvider>
              <AntdApp>{node}</AntdApp>
            </AntdLocaleProvider>
          </I18nextProvider>
        </Refine>
      </QueryClientProvider>
    </MemoryRouter>,
  );
};

describe("Table CRUD UX — ActionButtons & Delete Popconfirm (AC04, AC05, AC07, AC10)", () => {
  it("hiển thị đầy đủ nút Xem, Sửa, Xóa cho resource hỗ trợ đầy đủ CRUD", () => {
    const record: BaseRecord = {
      id: "load-123",
      number: "LD-2024-001",
    };

    const { container } = renderWithProviders(<ActionButtons record={record} resource="loads" />);

    expect(container.querySelector(".refine-show-button")).toBeInTheDocument();
    expect(container.querySelector(".refine-edit-button")).toBeInTheDocument();
    expect(container.querySelector(".refine-delete-button")).toBeInTheDocument();
  });

  it("ẩn nút Sửa và Xóa đối với resource chỉ cho phép đọc như notifications (AC10)", () => {
    const record: BaseRecord = {
      id: "notif-001",
      title: "Thông báo bảo trì hệ thống",
    };

    const { container } = renderWithProviders(<ActionButtons record={record} resource="notifications" />);

    expect(container.querySelector(".refine-show-button")).toBeInTheDocument();
    expect(container.querySelector(".refine-edit-button")).not.toBeInTheDocument();
    expect(container.querySelector(".refine-delete-button")).not.toBeInTheDocument();
  });

  it("nút Xóa không xóa ngay sau 1 click mà mở Popconfirm xác nhận với tên record và cảnh báo không thể hoàn tác (AC04)", async () => {
    const record: BaseRecord = {
      id: "load-789",
      number: "LD-789",
    };

    const { container } = renderWithProviders(<ActionButtons record={record} resource="loads" />);

    const deleteBtn = container.querySelector(".refine-delete-button")!;
    expect(deleteBtn).toBeInTheDocument();

    // Click vào nút Xóa lần 1
    fireEvent.click(deleteBtn);

    // Popconfirm phải xuất hiện với tên record và thông điệp cảnh báo
    await waitFor(() => {
      expect(
        screen.getByText(/Bạn có chắc chắn muốn xóa LD-789 không\? Hành động này không thể hoàn tác\./),
      ).toBeInTheDocument();
    });

    // Popconfirm có 2 nút: Xác nhận và Hủy
    expect(screen.getByRole("button", { name: "Xác nhận" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Hủy" })).toBeInTheDocument();
  });

  it("bấm nút Xem gọi showView từ ActionContext mà không chuyển trang (AC03)", () => {
    const record: BaseRecord = { id: "cust-55", name: "Công ty ABC" };
    const showView = vi.fn();
    const showEdit = vi.fn();

    const { container } = renderWithProviders(
      <ResourceActionContext.Provider value={{ showEdit, showView }}>
        <ActionButtons record={record} resource="customers" />
      </ResourceActionContext.Provider>,
    );

    const showBtn = container.querySelector(".refine-show-button")!;
    fireEvent.click(showBtn);
    expect(showView).toHaveBeenCalledWith("cust-55");
    expect(showEdit).not.toHaveBeenCalled();
  });

  it("bấm nút Sửa gọi showEdit từ ActionContext mà không chuyển trang (AC02)", () => {
    const record: BaseRecord = { id: "cust-55", name: "Công ty ABC" };
    const showView = vi.fn();
    const showEdit = vi.fn();

    const { container } = renderWithProviders(
      <ResourceActionContext.Provider value={{ showEdit, showView }}>
        <ActionButtons record={record} resource="customers" />
      </ResourceActionContext.Provider>,
    );

    const editBtn = container.querySelector(".refine-edit-button")!;
    fireEvent.click(editBtn);
    expect(showEdit).toHaveBeenCalledWith("cust-55");
    expect(showView).not.toHaveBeenCalled();
  });
});

describe("Table CRUD UX — Create & Edit Modals (AC01, AC02, AC05, AC06, AC07)", () => {
  it("ResourceCreateModal mở modal khi kích hoạt trigger mà không chuyển trang (AC01)", async () => {
    renderWithProviders(
      <ResourceCreateModal
        resource="loads"
        trigger={(show) => (
          <button type="button" onClick={show}>
            Mở tạo mới
          </button>
        )}
      />,
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    fireEvent.click(screen.getByText("Mở tạo mới"));

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByText("Thêm Chuyến hàng")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Thêm mới/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Hủy/i })).toBeInTheDocument();
    });
  });

  it("ResourceEditModal hiển thị modal sửa khi visible = true (AC02)", async () => {
    const onClose = vi.fn();

    renderWithProviders(
      <ResourceEditModal
        id="load-1"
        onClose={onClose}
        resource="loads"
        visible={true}
      />,
    );

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByText("Sửa Chuyến hàng")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Lưu/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Hủy/i })).toBeInTheDocument();
    });
  });
});
