/**
 * Verifies that the provider/router tree is mounted only after bootstrap.
 */

import { createApplicationI18n } from "@app/i18n";
import {
  RuntimeConfigError,
  type HealthProbeResult,
  type RuntimeConfig,
} from "@core/config";
import { App as AntdApp, ConfigProvider } from "antd";
import {
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import { describe, expect, it, vi } from "vitest";

import { AppBootstrap } from "./AppBootstrap";

const config: RuntimeConfig = {
  apiBaseUrl: "https://api.example.test",
  appName: "Logistics TMS",
  defaultLocale: "en",
  environment: "test",
  featureFlags: {},
  identityBaseUrl: "https://identity.example.test",
  oauth: {
    audience: "logisticsx.api",
    clientId: "spa",
    clockSkewSeconds: 60,
    issuer: "https://identity.example.test",
    jwksUri: "https://identity.example.test/jwks",
    postLogoutRedirectUri: "https://app.example.test/login",
    redirectUri: "https://app.example.test/auth/callback",
    scopes: ["openid"],
  },
  requestTimeoutMs: 15_000,
};

const health = {
  application: "logicstic",
  database: "enabled",
  profiles: "test",
  status: "UP",
};

const readyHealth: HealthProbeResult = {
  health,
  kind: "healthy",
  requestId: "request-ready",
};

const databaseDisabledHealth: HealthProbeResult = {
  health: {
    ...health,
    database: "disabled",
    profiles: "nodb",
  },
  kind: "healthy",
  requestId: "request-disabled",
};

async function renderBootstrap(
  props: React.ComponentProps<typeof AppBootstrap>,
) {
  const i18n = await createApplicationI18n({ locale: "vi" });
  return render(
    <I18nextProvider i18n={i18n}>
      <ConfigProvider>
        <AntdApp>
          <AppBootstrap {...props} />
        </AntdApp>
      </ConfigProvider>
    </I18nextProvider>,
  );
}

describe("AppBootstrap", () => {
  it("blocks the router when runtime config fails", async () => {
    const probeApiHealth = vi.fn(async () => readyHealth);

    await renderBootstrap({
      loadConfig: vi.fn(async () => {
        throw new RuntimeConfigError(
          "CONFIG_MISSING",
          "Runtime config missing",
        );
      }),
      probeApiHealth,
    });

    expect(
      await screen.findByText("Cần cấu hình ứng dụng"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Chẩn đoán hệ thống"),
    ).not.toBeInTheDocument();
    expect(probeApiHealth).not.toHaveBeenCalled();
  });

  it("blocks the router when database access is disabled", async () => {
    await renderBootstrap({
      loadConfig: vi.fn(async () => config),
      probeApiHealth: vi.fn(
        async () => databaseDisabledHealth,
      ),
    });

    expect(
      await screen.findByRole("heading", {
        name: "Business features are unavailable",
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", {
        name: "System diagnostics",
      }),
    ).not.toBeInTheDocument();
  });

  it("mounts the router only after the ready result", async () => {
    await renderBootstrap({
      loadConfig: vi.fn(async () => config),
      probeApiHealth: vi.fn(async () => readyHealth),
    });

    expect(
      await screen.findByRole("heading", {
        name: "System diagnostics",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("request-ready")).toBeInTheDocument();

    await waitFor(() => {
      expect(document.documentElement.lang).toBe("en");
    });
  });
});
