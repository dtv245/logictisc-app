/**
 * Verifies the approved public route surface and fail-closed fallback.
 */

import {
  APP_I18N_NAMESPACE,
  createApplicationI18n,
} from "@app/i18n";
import type { ReadyBootstrapState } from "@app/diagnostics";
import { SHARED_I18N_NAMESPACE } from "@shared/i18n";
import { App as AntdApp, ConfigProvider } from "antd";
import {
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import {
  MemoryRouter,
  useLocation,
} from "react-router-dom";
import { describe, expect, it } from "vitest";

import { AppRoutes } from "./AppRouter";
import { routes } from "./routes";

const state: ReadyBootstrapState = {
  config: {
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
  },
  health: {
    application: "logicstic",
    database: "enabled",
    profiles: "test",
    status: "UP",
  },
  kind: "ready",
  requestId: "request-router",
};

function LocationProbe() {
  const location = useLocation();
  return <output aria-label="Current route">{location.pathname}</output>;
}

async function renderRoute(initialEntry: string) {
  const i18n = await createApplicationI18n({ locale: "en" });
  const result = render(
    <I18nextProvider i18n={i18n}>
      <ConfigProvider>
        <AntdApp>
          <MemoryRouter initialEntries={[initialEntry]}>
            <AppRoutes state={state} />
            <LocationProbe />
          </MemoryRouter>
        </AntdApp>
      </ConfigProvider>
    </I18nextProvider>,
  );

  return {
    i18n,
    ...result,
  };
}

describe("AppRoutes", () => {
  it("redirects the temporary root to diagnostics", async () => {
    const { i18n } = await renderRoute(routes.root);

    expect(screen.getByLabelText("Current route")).toHaveTextContent(
      routes.diagnostics,
    );
    expect(
      screen.getByRole("heading", {
        name: i18n.t("diagnostics.title", {
          ns: APP_I18N_NAMESPACE,
        }),
      }),
    ).toBeInTheDocument();
  });

  it("renders diagnostics directly", async () => {
    await renderRoute(routes.diagnostics);

    expect(screen.getByText("request-router")).toBeInTheDocument();
    expect(screen.getByLabelText("Current route")).toHaveTextContent(
      routes.diagnostics,
    );
  });

  it.each(["/unknown", routes.login])(
    "fails closed for unimplemented route %s",
    async (path) => {
      const { i18n } = await renderRoute(path);

      expect(
        screen.getByRole("heading", {
          name: i18n.t("notFound.title", {
            ns: SHARED_I18N_NAMESPACE,
          }),
        }),
      ).toBeInTheDocument();
      expect(screen.getByLabelText("Current route")).toHaveTextContent(
        path,
      );

      fireEvent.click(
        screen.getByRole("button", {
          name: i18n.t("actions.goHome", {
            ns: SHARED_I18N_NAMESPACE,
          }),
        }),
      );

      expect(screen.getByLabelText("Current route")).toHaveTextContent(
        routes.diagnostics,
      );
    },
  );
});
