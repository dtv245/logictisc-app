import { initializeAppI18n } from "@locales";
import { App as AntdApp } from "antd";
import { render, screen } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import { MemoryRouter } from "react-router-dom";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { LoginPage } from "@pages/auth/LoginPage";
import { SelectTenantPage } from "@pages/tenant/SelectTenantPage";
import { LarkCallbackPage } from "@pages/auth/LarkCallbackPage";
import { DiagnosticsPage, type ReadyBootstrapState } from "@pages/diagnostics/DiagnosticsPage";
import { ForbiddenPage } from "@pages/errors/ForbiddenPage";
import { NotFoundPage } from "@pages/errors/NotFoundPage";

import * as larkHook from "@hooks/useLarkLogin";
import * as tenantListHook from "@hooks/useTenantList";
import * as switchTenantHook from "@hooks/useSwitchTenant";

vi.mock("@refinedev/core", () => ({
  useLogin: () => ({
    mutate: vi.fn(),
    isLoading: false,
    isError: false,
    isSuccess: false,
    data: undefined,
    error: null,
  }),
  useGo: () => vi.fn(),
}));

vi.mock("@hooks/useApiError", () => ({
  useApiError: () => ({
    showApiError: vi.fn(),
  }),
}));

const mockDiagnosticsState: ReadyBootstrapState = {
  config: {
    apiBaseUrl: "https://api.example.test",
    appName: "Logistics TMS",
    defaultLocale: "vi",
    environment: "production-sea",
    featureFlags: {},
    identityBaseUrl: "https://id.example.test",
    oauth: {
      audience: "logisticsx.api",
      clientId: "client-id",
      clockSkewSeconds: 60,
      issuer: "https://id.example.test",
      jwksUri: "https://id.example.test/jwks",
      postLogoutRedirectUri: "https://app.example.test/login",
      redirectUri: "https://app.example.test/auth/callback",
      scopes: ["openid"],
    },
    requestTimeoutMs: 15_000,
  },
  health: {
    application: "logistics-tms-service",
    database: "connected",
    profiles: "production,sea-cluster-01",
    status: "HEALTHY",
  },
  kind: "ready",
  requestId: "req-trace-9876543210-abcdef0123456789-high-concurrency-uuid",
};

const VIEWPORTS = [
  { width: 375, height: 667, name: "375px (Mobile Portrait)" },
  { width: 414, height: 896, name: "414px (Mobile Large)" },
  { width: 768, height: 1024, name: "768px (Tablet)" },
  { width: 1024, height: 768, name: "1024px (Small Desktop / Tablet Landscape)" },
  { width: 1440, height: 900, name: "1440px (Desktop Full HD)" },
];

let i18n: Awaited<ReturnType<typeof initializeAppI18n>>;

const setViewport = (width: number, height: number) => {
  window.innerWidth = width;
  window.innerHeight = height;
  window.dispatchEvent(new Event("resize"));
};

describe("Responsive Authentication & System Pages", () => {
  beforeAll(async () => {
    i18n = await initializeAppI18n({ locale: "en", fallbackLocale: "en" });
  });

  beforeEach(() => {
    vi.spyOn(larkHook, "useLarkLogin").mockReturnValue({
      startLogin: vi.fn(),
      completeLogin: vi.fn(),
      mutate: vi.fn(),
      mutateAsync: vi.fn(),
      reset: vi.fn(),
      isLoading: false,
      isError: false,
      isSuccess: false,
      isIdle: true,
      isPaused: false,
      data: undefined,
      error: null,
      status: "idle",
      variables: undefined,
      context: undefined,
      failureCount: 0,
      failureReason: null,
    } as unknown as larkHook.UseLarkLoginResult);

    vi.spyOn(tenantListHook, "useTenantList").mockReturnValue({
      tenants: [
        {
          id: "tenant-mock-1",
          tenantKey: "VN-LOG-99238472910-CORPORATION-KEY",
          tenantName: "Tong Cong Ty Co Phan Logistics Viet Nam Global Maritime Transportation Group",
        },
      ],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    vi.spyOn(switchTenantHook, "useSwitchTenant").mockReturnValue({
      switchTenant: vi.fn().mockResolvedValue(undefined),
      isLoading: false,
      isError: false,
      error: null,
      currentTenantId: "VN-LOG",
    });
  });

  describe.each(VIEWPORTS)("Viewport $name ($width x $height)", ({ width, height }) => {
    beforeEach(() => {
      setViewport(width, height);
    });

    it("renders LoginPage with responsive card and buttons", () => {
      const { container } = render(
        <I18nextProvider i18n={i18n}>
          <AntdApp>
            <MemoryRouter>
              <LoginPage />
            </MemoryRouter>
          </AntdApp>
        </I18nextProvider>,
      );

      const main = container.querySelector("main.login-page");
      expect(main).toBeInTheDocument();

      const card = container.querySelector(".login-card");
      expect(card).toBeInTheDocument();

      expect(screen.getByRole("button", { name: /sign in with lark/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /sign in with identity server/i })).toBeInTheDocument();
    });

    it("renders SelectTenantPage with responsive layout and long tenant name", () => {
      const { container } = render(
        <I18nextProvider i18n={i18n}>
          <AntdApp>
            <MemoryRouter>
              <SelectTenantPage />
            </MemoryRouter>
          </AntdApp>
        </I18nextProvider>,
      );

      const main = container.querySelector("main.auth-page");
      expect(main).toBeInTheDocument();

      const tenantCard = container.querySelector(".tenant-card");
      expect(tenantCard).toBeInTheDocument();

      expect(
        screen.getByText("Tong Cong Ty Co Phan Logistics Viet Nam Global Maritime Transportation Group"),
      ).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /sign in again to change company/i })).toBeInTheDocument();
    });

    it("renders LarkCallbackPage centered with error and loading states", () => {
      const { container } = render(
        <I18nextProvider i18n={i18n}>
          <AntdApp>
            <MemoryRouter>
              <LarkCallbackPage />
            </MemoryRouter>
          </AntdApp>
        </I18nextProvider>,
      );

      const main = container.querySelector("main.login-page");
      expect(main).toBeInTheDocument();

      const callbackCard = container.querySelector(".login-callback-card");
      expect(callbackCard).toBeInTheDocument();
    });

    it("renders DiagnosticsPage with responsive layout and long technical string", () => {
      const { container } = render(
        <I18nextProvider i18n={i18n}>
          <AntdApp>
            <DiagnosticsPage state={mockDiagnosticsState} />
          </AntdApp>
        </I18nextProvider>,
      );

      const main = container.querySelector("main.diagnostics-page");
      expect(main).toBeInTheDocument();

      const descriptions = container.querySelector(".diagnostics-descriptions");
      expect(descriptions).toBeInTheDocument();

      expect(screen.getByText(mockDiagnosticsState.requestId)).toBeInTheDocument();
    });

    it("renders ForbiddenPage with balanced result and dashboard button", () => {
      const { container } = render(
        <I18nextProvider i18n={i18n}>
          <AntdApp>
            <MemoryRouter>
              <ForbiddenPage />
            </MemoryRouter>
          </AntdApp>
        </I18nextProvider>,
      );

      const wrapper = container.querySelector(".system-status-page");
      expect(wrapper).toBeInTheDocument();

      const result = container.querySelector(".system-status-result");
      expect(result).toBeInTheDocument();

      expect(screen.getByRole("button", { name: /go to dashboard/i })).toBeInTheDocument();
    });

    it("renders NotFoundPage with balanced result and dashboard button", () => {
      const { container } = render(
        <I18nextProvider i18n={i18n}>
          <AntdApp>
            <MemoryRouter>
              <NotFoundPage />
            </MemoryRouter>
          </AntdApp>
        </I18nextProvider>,
      );

      const wrapper = container.querySelector(".system-status-page");
      expect(wrapper).toBeInTheDocument();

      const result = container.querySelector(".system-status-result");
      expect(result).toBeInTheDocument();

      expect(screen.getByRole("button", { name: /go to dashboard/i })).toBeInTheDocument();
    });
  });
});
