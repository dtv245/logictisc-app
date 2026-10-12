import { AntdLocaleProvider } from "@components/AntdLocaleProvider";
import { ResourceEditModal } from "@components/ResourceEditModal";
import { initializeAppI18n } from "@locales";
import { Refine, type DataProvider } from "@refinedev/core";
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

const mockTruckRecord = {
  id: "trk-101",
  number: "TRK-101",
  status: "available",
  type: "SEMI_TRUCK",
  vehicleCapacity: 20000,
  make: "Volvo",
  adrEquipmentIsAdrCertified: true,
  adrEquipmentAllowedClasses: "CLASS_3",
  adrEquipmentOrangePlateNumber: "33/1203",
};

const mockDataProvider: DataProvider = {
  create: vi.fn(async () => ({ data: { id: "new-1" } })) as unknown as DataProvider["create"],
  deleteOne: vi.fn(async () => ({ data: { id: "del-1" } })) as unknown as DataProvider["deleteOne"],
  getApiUrl: () => "http://localhost:8080",
  getList: vi.fn(async () => ({ data: [], total: 0 })) as unknown as DataProvider["getList"],
  getMany: vi.fn(async () => ({ data: [] })) as unknown as DataProvider["getMany"],
  getOne: vi.fn(async ({ id }) => {
    if (id === "fail") {
      throw new Error("Lỗi kết nối máy chủ");
    }
    return { data: { ...mockTruckRecord, id: String(id), number: `TRK-${id}` } };
  }) as unknown as DataProvider["getOne"],
  update: vi.fn(async () => ({ data: { ...mockTruckRecord } })) as unknown as DataProvider["update"],
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
              create: "/trucks/create",
              edit: "/trucks/edit/:id",
              list: "/trucks",
              show: "/trucks/show/:id",
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

describe("ResourceEditModal — Nâng cấp Popup Edit (AC01 - AC08)", () => {
  it("Header hiển thị ngữ cảnh 'Chỉnh sửa xe tải [số hiệu]' kèm StatusTag", async () => {
    renderWithProviders(
      <ResourceEditModal
        id="101"
        onClose={vi.fn()}
        resource="trucks"
        visible={true}
      />,
    );

    await waitFor(() => {
      // Tiêu đề chứa số hiệu
      expect(screen.getByText(/TRK-101/)).toBeInTheDocument();
      // StatusTag hiển thị trạng thái
      expect(screen.getByRole("status")).toHaveTextContent("Sẵn sàng");
    });
  });

  it("Nút [Lưu thay đổi] disabled khi chưa thay đổi, enabled khi gõ, và disabled lại khi hoàn tác về ban đầu", async () => {
    renderWithProviders(
      <ResourceEditModal
        id="101"
        onClose={vi.fn()}
        resource="trucks"
        visible={true}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText(/TRK-101/)).toBeInTheDocument();
    });

    const saveBtn = screen.getByRole("button", { name: /Lưu thay đổi/i });
    expect(saveBtn).toBeDisabled();

    // Sửa trường Hãng xe (make)
    const makeInput = screen.getByLabelText(/Hãng/i);
    expect(makeInput).toHaveValue("Volvo");

    fireEvent.change(makeInput, { target: { value: "Scania" } });

    await waitFor(() => {
      expect(saveBtn).not.toBeDisabled();
    });

    // Hoàn tác về lại "Volvo"
    fireEvent.change(makeInput, { target: { value: "Volvo" } });

    await waitFor(() => {
      expect(saveBtn).toBeDisabled();
    });
  });

  it("Nút [Khôi phục] đưa form về lại snapshot gốc và đưa nút Lưu về disabled", async () => {
    renderWithProviders(
      <ResourceEditModal
        id="101"
        onClose={vi.fn()}
        resource="trucks"
        visible={true}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText(/TRK-101/)).toBeInTheDocument();
    });

    const saveBtn = screen.getByRole("button", { name: /Lưu thay đổi/i });
    const resetBtn = screen.getByRole("button", { name: /Khôi phục/i });
    expect(resetBtn).toBeDisabled();

    const makeInput = screen.getByLabelText(/Hãng/i);
    fireEvent.change(makeInput, { target: { value: "Mercedes" } });

    await waitFor(() => {
      expect(saveBtn).not.toBeDisabled();
      expect(resetBtn).not.toBeDisabled();
    });

    // Bấm nút Khôi phục
    fireEvent.click(resetBtn);

    await waitFor(() => {
      expect(makeInput).toHaveValue("Volvo");
      expect(saveBtn).toBeDisabled();
      expect(resetBtn).toBeDisabled();
    });
  });

  it("Mở Edit nhiều bản ghi liên tiếp: không rò rỉ dữ liệu của bản ghi trước", async () => {
    const { rerender } = renderWithProviders(
      <ResourceEditModal
        id="101"
        onClose={vi.fn()}
        resource="trucks"
        visible={true}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText(/TRK-101/)).toBeInTheDocument();
    });

    // Đổi sang id 102
    rerender(
      <MemoryRouter>
        <QueryClientProvider client={queryClient}>
          <Refine
            dataProvider={mockDataProvider}
            resources={[{ name: "trucks" }]}
          >
            <I18nextProvider i18n={i18nInstance}>
              <AntdLocaleProvider>
                <AntdApp>
                  <ResourceEditModal
                    id="102"
                    onClose={vi.fn()}
                    resource="trucks"
                    visible={true}
                  />
                </AntdApp>
              </AntdLocaleProvider>
            </I18nextProvider>
          </Refine>
        </QueryClientProvider>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText(/TRK-102/)).toBeInTheDocument();
      expect(screen.queryByText(/TRK-101/)).not.toBeInTheDocument();
    });
  });
});
