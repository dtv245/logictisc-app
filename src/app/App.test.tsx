/**
 * Verifies the application provider composition with the real bootstrap gate.
 */

import type {
  HealthProbeResult,
  RuntimeConfig,
} from "@core/config";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { createApplicationI18n } from "./i18n";
import { App } from "./App";

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

const readyHealth: HealthProbeResult = {
  health: {
    application: "logicstic",
    database: "enabled",
    profiles: "test",
    status: "UP",
  },
  kind: "healthy",
  requestId: "request-app",
};

describe("App", () => {
  it("switches from the fallback locale and renders ready diagnostics", async () => {
    const i18n = await createApplicationI18n({ locale: "vi" });

    render(
      <App
        i18n={i18n}
        loadConfig={vi.fn(async () => config)}
        probeApiHealth={vi.fn(async () => readyHealth)}
      />,
    );

    expect(
      await screen.findByRole("heading", {
        name: "System diagnostics",
      }),
    ).toBeInTheDocument();
    expect(i18n.language).toBe("en");
    expect(document.documentElement.lang).toBe("en");
  });
});
