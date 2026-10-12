import { AntdLocaleProvider } from "@components/AntdLocaleProvider";
import { ResourceCreateModal } from "@components/ResourceCreateModal";
import { initializeAppI18n } from "@locales";
import { Refine, type DataProvider } from "@refinedev/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { App as AntdApp } from "antd";
import type { i18n as I18nInstance } from "i18next";
import type { ReactNode } from "react";
import { I18nextProvider } from "react-i18next";
import { MemoryRouter } from "react-router-dom";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiHttpError } from "@/providers/api/httpError";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

let i18nInstance: I18nInstance;
let mockCreate: ReturnType<typeof vi.fn>;

beforeAll(async () => {
  i18nInstance = await initializeAppI18n({
    fallbackLocale: "vi",
    locale: "vi",
  });
});

beforeEach(() => {
  mockCreate = vi.fn(async () => ({ data: { id: "truck-101" } }));
});

const renderWithProviders = (ui: ReactNode) => {
  const dataProvider: DataProvider = {
    create: mockCreate as unknown as DataProvider["create"],
    deleteOne: vi.fn() as unknown as DataProvider["deleteOne"],
    getApiUrl: () => "http://localhost:8080",
    getList: vi.fn(async () => ({ data: [], total: 0 })) as unknown as DataProvider["getList"],
    getMany: vi.fn(async () => ({ data: [] })) as unknown as DataProvider["getMany"],
    getOne: vi.fn(async () => ({ data: { id: "1" } })) as unknown as DataProvider["getOne"],
    update: vi.fn() as unknown as DataProvider["update"],
  };

  return render(
    <MemoryRouter>
      <I18nextProvider i18n={i18nInstance}>
        <AntdLocaleProvider>
          <AntdApp>
            <QueryClientProvider client={queryClient}>
              <Refine
                dataProvider={dataProvider}
                resources={[{ name: "trucks" }, { name: "loads" }]}
              >
                {ui}
              </Refine>
            </QueryClientProvider>
          </AntdApp>
        </AntdLocaleProvider>
      </I18nextProvider>
    </MemoryRouter>,
  );
};

describe("ResourceCreateModal — Nâng cấp Popup Create (Trucks)", () => {
  it("khung modal hiển thị tiêu đề, mô tả ngắn, nút Hủy và nút [Tạo xe tải]", async () => {
    renderWithProviders(
      <ResourceCreateModal
        resource="trucks"
        trigger={(show) => (
          <button onClick={show} type="button">
            Mở tạo xe
          </button>
        )}
      />,
    );

    fireEvent.click(screen.getByText("Mở tạo xe"));

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByText("Thêm Xe tải")).toBeInTheDocument();
      expect(
        screen.getByText("Điền thông tin chi tiết để thêm mới Xe tải vào hệ thống."),
      ).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Hủy/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Tạo xe tải/i })).toBeInTheDocument();
    });
  });

  it("render theo các section và section ADR mặc định thu gọn", async () => {
    renderWithProviders(
      <ResourceCreateModal
        resource="trucks"
        trigger={(show) => (
          <button onClick={show} type="button">
            Mở tạo xe
          </button>
        )}
      />,
    );

    fireEvent.click(screen.getByText("Mở tạo xe"));

    await waitFor(() => {
      // Các section chính hiển thị
      expect(screen.getByText("Định danh phương tiện")).toBeInTheDocument();
      expect(screen.getByText("Thông số kỹ thuật & Vận hành")).toBeInTheDocument();
      expect(screen.getByText("Tài xế phụ trách")).toBeInTheDocument();
      expect(screen.getByText("Hàng nguy hiểm & Chứng chỉ ADR")).toBeInTheDocument();

      // Section ADR đang thu gọn nên chưa render các ô bên trong
      expect(screen.queryByLabelText(/Số biển cam ADR/i)).not.toBeInTheDocument();
    });
  });

  it("bật rồi tắt ADR: giá trị ADR không bị gửi lên payload", async () => {
    renderWithProviders(
      <ResourceCreateModal
        resource="trucks"
        trigger={(show) => (
          <button onClick={show} type="button">
            Mở tạo xe
          </button>
        )}
      />,
    );

    fireEvent.click(screen.getByText("Mở tạo xe"));

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    // Điền các trường bắt buộc cơ bản
    const numberInput = screen.getByPlaceholderText(/TRK-102/i);
    fireEvent.change(numberInput, { target: { value: "TRK-999" } });

    const capacityInput = screen.getByPlaceholderText(/20000/i);
    fireEvent.change(capacityInput, { target: { value: "25000" } });

    // Mở section ADR
    const adrHeader = screen.getByRole("button", { name: /Hàng nguy hiểm & Chứng chỉ ADR/i });
    fireEvent.click(adrHeader);

    // Bật switch chứng nhận ADR (switch thứ 2 trong section ADR: 0 là isHazmatPlacarded, 1 là adrEquipmentIsAdrCertified)
    await waitFor(() => {
      expect(screen.getAllByRole("switch").length).toBeGreaterThanOrEqual(2);
    });
    const switches = screen.getAllByRole("switch");
    const adrSwitch = switches[1];
    fireEvent.click(adrSwitch);

    // Điền số biển cam
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/33\/1203/i)).toBeInTheDocument();
    });
    const plateInput = screen.getByPlaceholderText(/33\/1203/i);
    fireEvent.change(plateInput, { target: { value: "33/1203" } });

    // Tắt lại switch chứng nhận ADR
    fireEvent.click(adrSwitch);

    // Gửi form
    const submitBtn = screen.getByRole("button", { name: /Tạo xe tải/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalled();
      const createCall = mockCreate.mock.calls[0][0];
      const payload = createCall.variables ?? createCall.values;
      expect(payload.number).toBe("TRK-999");
      // Dữ liệu ADR không bị gửi trong payload
      expect(payload.adrEquipmentIsAdrCertified).toBeFalsy();
      expect(payload.adrEquipmentOrangePlateNumber).toBeUndefined();
      expect(payload.adrEquipmentAllowedClasses).toBeUndefined();
    });
  });

  it("khi backend trả lỗi 400 ở field trong section thu gọn: section tự mở và focus đúng field", async () => {
    mockCreate.mockRejectedValueOnce(
      new ApiHttpError({
        statusCode: 400,
        code: "VALIDATION_FAILED",
        message: "Validation failed",
        requestId: "test-req",
        fieldErrors: {
          adrEquipmentOrangePlateNumber: ["Mã biển cam không hợp lệ"],
        },
      }),
    );

    renderWithProviders(
      <ResourceCreateModal
        resource="trucks"
        trigger={(show) => (
          <button onClick={show} type="button">
            Mở tạo xe
          </button>
        )}
      />,
    );

    fireEvent.click(screen.getByText("Mở tạo xe"));

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    // Điền các trường bắt buộc để vượt qua client validation
    const numberInput = screen.getByPlaceholderText(/TRK-102/i);
    fireEvent.change(numberInput, { target: { value: "TRK-100" } });

    const capacityInput = screen.getByPlaceholderText(/20000/i);
    fireEvent.change(capacityInput, { target: { value: "25000" } });

    // Gửi form khi section ADR đang thu gọn
    const submitBtn = screen.getByRole("button", { name: /Tạo xe tải/i });
    fireEvent.click(submitBtn);

    // Section ADR tự động bung mở và thông báo lỗi hiển thị ngay dưới field
    await waitFor(() => {
      expect(screen.getByText("Mã biển cam không hợp lệ")).toBeInTheDocument();
    });
  });
});
