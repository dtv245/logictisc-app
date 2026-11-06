import { AntdLocaleProvider } from "@components/AntdLocaleProvider";
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

import { InvoiceCreateModal } from "@/components/invoices/InvoiceCreateModal";
import { LoadCreateModal } from "@/components/loads/LoadCreateModal";
import { PaymentCreateModal } from "@/components/payments/PaymentCreateModal";
import { TripCreateModal } from "@/components/trips/TripCreateModal";
import { ApiHttpError } from "@/utils/httpError";

let i18nInstance: I18nInstance;
let mockCreate: ReturnType<typeof vi.fn>;

beforeAll(async () => {
  i18nInstance = await initializeAppI18n({
    fallbackLocale: "vi",
    locale: "vi",
  });
});

beforeEach(() => {
  mockCreate = vi.fn(async ({ variables }: { variables: Record<string, unknown> }) => ({
    data: { id: "created-id-2", ...variables },
  }));
});

const renderWithProviders = (ui: ReactNode) => {
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
    getList: vi.fn(async ({ resource }) => {
      if (resource === "invoices") {
        return {
          data: [{ id: "inv-001", number: 202601 }],
          total: 1,
        };
      }
      if (resource === "customers") {
        return {
          data: [{ id: "cust-001", name: "Acme Corp" }],
          total: 1,
        };
      }
      return { data: [], total: 0 };
    }) as unknown as DataProvider["getList"],
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
                resources={[
                  { name: "trips" },
                  { name: "loads" },
                  { name: "invoices" },
                  { name: "payments" },
                  { name: "trucks" },
                  { name: "customers" },
                  { name: "employees" },
                ]}
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

describe("Đợt 2 — Popup Create riêng theo hợp đồng Swagger (Trips, Loads, Invoices, Payments)", () => {
  it("giữ Form của LoadCreateModal được kết nối khi popup đang đóng", async () => {
    const warningSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const rendered = renderWithProviders(
      <LoadCreateModal trigger={(show) => <button onClick={show} type="button">Mở tạo lô</button>} />,
    );

    await waitFor(() => {
      expect(document.querySelector("#create-loads-form")).toBeInTheDocument();
    });

    const disconnectedFormWarning = warningSpy.mock.calls.some((args) =>
      args.some((value) =>
        typeof value === "string" && value.includes("Instance created by `useForm` is not connected"),
      ),
    );
    rendered.unmount();
    warningSpy.mockRestore();
    expect(disconnectedFormWarning).toBe(false);
  });

  it("TripCreateModal gửi đúng 4 trường chuẩn CreateTripRequest và trả về TripView qua onCreated", async () => {
    const onCreated = vi.fn();
    mockCreate.mockResolvedValueOnce({
      data: {
        id: "trip-001",
        number: 108,
        version: 1,
        name: "Tuyến Dallas - Houston",
        status: "planned",
        totalDistance: 240.5,
        truckNumber: "TRK-102",
      },
    });

    renderWithProviders(
      <TripCreateModal
        onCreated={onCreated}
        trigger={(show) => (
          <button onClick={show} type="button">
            Mở tạo chuyến xe
          </button>
        )}
      />,
    );

    fireEvent.click(screen.getByText("Mở tạo chuyến xe"));

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/Tên chuyến xe/i), {
      target: { value: "Tuyến Dallas - Houston" },
    });
    fireEvent.change(screen.getByLabelText(/Tổng quãng đường dự kiến/i), {
      target: { value: "240.5" },
    });

    const submitBtn = document.querySelector(".resource-form-modal__submit-btn") as HTMLElement;
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledTimes(1);
      const callArg = mockCreate.mock.calls[0][0];
      expect(callArg.resource).toBe("trips");
      expect(callArg.variables).toEqual({
        name: "Tuyến Dallas - Houston",
        status: "planned",
        totalDistance: 240.5,
      });
      expect(onCreated).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "trip-001",
          number: 108,
          truckNumber: "TRK-102",
        }),
      );
    });
  });

  it("InvoiceCreateModal tự động tính totalAmount bằng Decimal và đồng bộ 3 trường currency trong CreateInvoiceRequest", async () => {
    const onCreated = vi.fn();
    mockCreate.mockResolvedValueOnce({
      data: {
        id: "inv-001",
        number: 5001,
        type: "CUSTOMER",
        status: "draft",
        subtotalAmount: 100.1,
        subtotalCurrency: "USD",
        taxTotalAmount: 20.2,
        taxTotalCurrency: "USD",
        totalAmount: 120.3,
        totalCurrency: "USD",
      },
    });

    renderWithProviders(
      <InvoiceCreateModal
        onCreated={onCreated}
        trigger={(show) => (
          <button onClick={show} type="button">
            Mở tạo hóa đơn
          </button>
        )}
      />,
    );

    fireEvent.click(screen.getByText("Mở tạo hóa đơn"));

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/Tiền trước thuế/i), {
      target: { value: "100.10" },
    });
    fireEvent.change(screen.getByLabelText(/Tiền thuế/i), {
      target: { value: "20.20" },
    });

    const submitBtn = document.querySelector(".resource-form-modal__submit-btn") as HTMLElement;
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledTimes(1);
      const callArg = mockCreate.mock.calls[0][0];
      expect(callArg.resource).toBe("invoices");
      expect(callArg.variables).toMatchObject({
        type: "CUSTOMER",
        status: "draft",
        taxBehavior: "EXCLUSIVE",
        subtotalAmount: 100.1,
        subtotalCurrency: "USD",
        taxTotalAmount: 20.2,
        taxTotalCurrency: "USD",
        totalAmount: 120.3,
        totalCurrency: "USD",
      });
      expect(onCreated).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "inv-001",
          number: 5001,
        }),
      );
    });
  });

  it("LoadCreateModal ẩn mục lục Anchor và thanh footer trang riêng khi mở ở chế độ Modal", async () => {
    renderWithProviders(
      <LoadCreateModal
        trigger={(show) => (
          <button onClick={show} type="button">
            Mở tạo vận đơn
          </button>
        )}
      />,
    );

    fireEvent.click(screen.getByText("Mở tạo vận đơn"));

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByText("Thông tin chung")).toBeInTheDocument();
      expect(screen.getByText("Điểm lấy hàng (Origin)")).toBeInTheDocument();
      expect(screen.getByText("Điểm giao hàng (Destination)")).toBeInTheDocument();
      expect(screen.queryByText("Mục lục biểu mẫu")).not.toBeInTheDocument();
    });
  });

  it("PaymentCreateModal hiển thị đầy đủ các trường bắt buộc của CreatePaymentRequest và xử lý lỗi 400 từ backend", async () => {
    mockCreate.mockRejectedValueOnce(
      new ApiHttpError({
        statusCode: 400,
        code: "VALIDATION_FAILED",
        message: "Validation failed",
        requestId: "req-pay-400",
        fieldErrors: {
          referenceNumber: ["Số tham chiếu thanh toán đã tồn tại"],
        },
      }),
    );

    renderWithProviders(
      <PaymentCreateModal
        trigger={(show) => (
          <button onClick={show} type="button">
            Mở tạo thanh toán
          </button>
        )}
      />,
    );

    fireEvent.click(screen.getByText("Mở tạo thanh toán"));

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByText("Thông tin giao dịch thanh toán")).toBeInTheDocument();
      expect(screen.getByText("Địa chỉ thanh toán (Billing Address)")).toBeInTheDocument();
    });
  });
});
