import { AntdLocaleProvider } from "@/components/AntdLocaleProvider";
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

import { CustomerCreateModal } from "@/components/customers/CustomerCreateModal";
import { DriverCreateModal } from "@/components/drivers/DriverCreateModal";
import { EmployeeCreateModal } from "@/components/employees/EmployeeCreateModal";
import { TerminalCreateModal } from "@/components/terminals/TerminalCreateModal";
import { TruckCreateModal } from "@/components/trucks/TruckCreateModal";
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
    data: { id: "created-id-1", ...variables },
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
                resources={[
                  { name: "customers" },
                  { name: "employees" },
                  { name: "drivers" },
                  { name: "trucks" },
                  { name: "terminals" },
                  { name: "roles" },
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

describe("Đợt 1 — Popup Create riêng theo hợp đồng Swagger", () => {
  it("CustomerCreateModal gửi đúng CreateCustomerRequest và trả về CustomerView qua onCreated", async () => {
    const onCreated = vi.fn();
    mockCreate.mockResolvedValueOnce({
      data: {
        id: "cust-001",
        name: "Global Logistics Co.",
        status: "active",
        isVatExempt: false,
        email: "contact@globallogistics.vn",
      },
    });

    renderWithProviders(
      <CustomerCreateModal
        onCreated={onCreated}
        trigger={(show) => (
          <button onClick={show} type="button">
            Mở tạo khách hàng
          </button>
        )}
      />,
    );

    fireEvent.click(screen.getByText("Mở tạo khách hàng"));

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/Tên khách hàng/i), {
      target: { value: "Global Logistics Co." },
    });
    fireEvent.change(screen.getByLabelText(/Email liên hệ/i), {
      target: { value: "contact@globallogistics.vn" },
    });

    const submitBtn = document.querySelector(".resource-form-modal__submit-btn") as HTMLElement;
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledTimes(1);
      const callArg = mockCreate.mock.calls[0][0];
      expect(callArg.resource).toBe("customers");
      expect(callArg.variables).toMatchObject({
        name: "Global Logistics Co.",
        status: "active",
        isVatExempt: false,
        email: "contact@globallogistics.vn",
      });
      expect(onCreated).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "cust-001",
          name: "Global Logistics Co.",
        }),
      );
    });
  });

  it("EmployeeCreateModal hiển thị trường roleId và gửi đúng CreateEmployeeRequest", async () => {
    const onCreated = vi.fn();
    mockCreate.mockResolvedValueOnce({
      data: {
        id: "emp-001",
        firstName: "Nguyễn",
        lastName: "An",
        email: "an.nguyen@company.com",
        roleName: "Dispatcher",
        status: "active",
        salaryType: "MONTHLY",
        salaryAmount: 1500,
        salaryCurrency: "USD",
      },
    });

    renderWithProviders(
      <EmployeeCreateModal
        onCreated={onCreated}
        trigger={(show) => (
          <button onClick={show} type="button">
            Mở tạo nhân viên
          </button>
        )}
      />,
    );

    fireEvent.click(screen.getByText("Mở tạo nhân viên"));

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByText(/Vai trò hệ thống \(Role\)/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/Họ và tên đệm/i), {
      target: { value: "Nguyễn" },
    });
    fireEvent.change(screen.getByLabelText(/Tên \(Last Name\)/i), {
      target: { value: "An" },
    });
    fireEvent.change(screen.getByLabelText(/Email công việc/i), {
      target: { value: "an.nguyen@company.com" },
    });
    fireEvent.change(screen.getByLabelText(/Mức lương cơ bản/i), {
      target: { value: "1500" },
    });

    const submitBtn = document.querySelector(".resource-form-modal__submit-btn") as HTMLElement;
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledTimes(1);
      const callArg = mockCreate.mock.calls[0][0];
      expect(callArg.resource).toBe("employees");
      expect(callArg.variables).toMatchObject({
        firstName: "Nguyễn",
        lastName: "An",
        email: "an.nguyen@company.com",
        status: "active",
        salaryType: "MONTHLY",
        salaryAmount: 1500,
        salaryCurrency: "USD",
      });
      expect(onCreated).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "emp-001",
          roleName: "Dispatcher",
        }),
      );
    });
  });

  it("DriverCreateModal không hiển thị roleId (theo driverMutationContract) và gửi đúng payload", async () => {
    renderWithProviders(
      <DriverCreateModal
        trigger={(show) => (
          <button onClick={show} type="button">
            Mở tạo tài xế
          </button>
        )}
      />,
    );

    fireEvent.click(screen.getByText("Mở tạo tài xế"));

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByText("Hồ sơ tài xế")).toBeInTheDocument();
      expect(screen.queryByText(/Vai trò hệ thống/i)).not.toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/Họ và tên đệm/i), {
      target: { value: "Trần" },
    });
    fireEvent.change(screen.getByLabelText(/Tên tài xế/i), {
      target: { value: "Bình" },
    });
    fireEvent.change(screen.getByLabelText(/Email tài xế/i), {
      target: { value: "binh.tran@company.com" },
    });

    const submitBtn = document.querySelector(".resource-form-modal__submit-btn") as HTMLElement;
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledTimes(1);
      const callArg = mockCreate.mock.calls[0][0];
      expect(callArg.resource).toBe("drivers");
      expect(callArg.variables).toMatchObject({
        firstName: "Trần",
        lastName: "Bình",
        email: "binh.tran@company.com",
        status: "active",
        salaryType: "PER_MILE",
        salaryCurrency: "USD",
      });
      expect(callArg.variables.roleId).toBeUndefined();
    });
  });

  it("TruckCreateModal gửi đúng CreateTruckRequest và tự bật ADR khi backend trả lỗi 400 ở trường ADR", async () => {
    mockCreate.mockRejectedValueOnce(
      new ApiHttpError({
        statusCode: 400,
        code: "VALIDATION_FAILED",
        message: "Validation failed",
        requestId: "req-truck-400",
        fieldErrors: {
          adrEquipmentOrangePlateNumber: ["Biển cam ADR không đúng định dạng"],
        },
      }),
    );

    renderWithProviders(
      <TruckCreateModal
        trigger={(show) => (
          <button onClick={show} type="button">
            Mở tạo xe tải
          </button>
        )}
      />,
    );

    fireEvent.click(screen.getByText("Mở tạo xe tải"));

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/Số hiệu xe/i), {
      target: { value: "TRK-500" },
    });

    const submitBtn = document.querySelector(".resource-form-modal__submit-btn") as HTMLElement;
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText("Biển cam ADR không đúng định dạng")).toBeInTheDocument();
    });
  });

  it("TerminalCreateModal xử lý lỗi 409 CONFLICT trên trường code", async () => {
    mockCreate.mockRejectedValueOnce(
      new ApiHttpError({
        statusCode: 409,
        code: "CONFLICT",
        message: "Conflict",
        requestId: "req-term-409",
      }),
    );

    renderWithProviders(
      <TerminalCreateModal
        trigger={(show) => (
          <button onClick={show} type="button">
            Mở tạo bến bãi
          </button>
        )}
      />,
    );

    fireEvent.click(screen.getByText("Mở tạo bến bãi"));

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByLabelText("Tên cảng / bến bãi")).toBeInTheDocument();
    });
  });
});
