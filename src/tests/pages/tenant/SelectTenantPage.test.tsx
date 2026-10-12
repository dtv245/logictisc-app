import { initializeAppI18n } from "@locales";
import { App as AntdApp } from "antd";
import { fireEvent, render, screen } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import { MemoryRouter } from "react-router-dom";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { SelectTenantPage } from "@pages/tenant/SelectTenantPage";
import * as tenantListHook from "@hooks/useTenantList";
import * as switchTenantHook from "@hooks/useSwitchTenant";

const mockSwitchTenant = vi.fn().mockResolvedValue(undefined);

vi.mock("@hooks/useApiError", () => ({
  useApiError: () => ({
    showApiError: vi.fn(),
  }),
}));

let i18n: Awaited<ReturnType<typeof initializeAppI18n>>;

describe("SelectTenantPage", () => {
  beforeAll(async () => {
    i18n = await initializeAppI18n({ locale: "en", fallbackLocale: "en" });
  });

  beforeEach(() => {
    mockSwitchTenant.mockClear();
    vi.spyOn(switchTenantHook, "useSwitchTenant").mockReturnValue({
      switchTenant: mockSwitchTenant,
      isLoading: false,
      isError: false,
      error: null,
      currentTenantId: "tenant-1",
    });
  });

  it("renders tenant list with accessible layout and handles long tenant names", () => {
    const longName = "Cong Ty Co Phan Van Tai Thuong Mai Dich Vu Quoc Te Global Logistics Mekong Delta Logistics System";
    vi.spyOn(tenantListHook, "useTenantList").mockReturnValue({
      tenants: [
        { id: "tenant-1", tenantKey: "tenant-long-key-1234567890", tenantName: longName },
      ],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(
      <I18nextProvider i18n={i18n}>
        <AntdApp>
          <MemoryRouter>
            <SelectTenantPage />
          </MemoryRouter>
        </AntdApp>
      </I18nextProvider>,
    );

    expect(screen.getByText(i18n.t("tenant.title"))).toBeInTheDocument();
    expect(screen.getByText(longName)).toBeInTheDocument();
    expect(screen.getByText("tenant-long-key-1234567890")).toBeInTheDocument();

    const switchBtn = screen.getByRole("button", {
      name: new RegExp(i18n.t("tenant.reauthenticate"), "i"),
    });
    expect(switchBtn).toBeInTheDocument();

    fireEvent.click(switchBtn);
    expect(mockSwitchTenant).toHaveBeenCalledTimes(1);
  });

  it("renders multiple tenants if available without breaking layout", () => {
    vi.spyOn(tenantListHook, "useTenantList").mockReturnValue({
      tenants: [
        { id: "tenant-1", tenantKey: "tenant-1", tenantName: "Company Alpha" },
        { id: "tenant-2", tenantKey: "tenant-2", tenantName: "Company Beta" },
      ],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(
      <I18nextProvider i18n={i18n}>
        <AntdApp>
          <MemoryRouter>
            <SelectTenantPage />
          </MemoryRouter>
        </AntdApp>
      </I18nextProvider>,
    );

    expect(screen.getByText("Company Alpha")).toBeInTheDocument();
    expect(screen.getByText("Company Beta")).toBeInTheDocument();

    const switchButtons = screen.getAllByRole("button", {
      name: new RegExp(i18n.t("tenant.reauthenticate"), "i"),
    });
    expect(switchButtons).toHaveLength(2);
  });

  it("renders empty alert when no tenants are available", () => {
    vi.spyOn(tenantListHook, "useTenantList").mockReturnValue({
      tenants: [],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(
      <I18nextProvider i18n={i18n}>
        <AntdApp>
          <MemoryRouter>
            <SelectTenantPage />
          </MemoryRouter>
        </AntdApp>
      </I18nextProvider>,
    );

    expect(screen.getByText(i18n.t("tenant.none"))).toBeInTheDocument();
  });
});
