/**
 * Verifies localization and the strict public diagnostics field whitelist.
 */

import {
  APP_I18N_NAMESPACE,
  createApplicationI18n,
} from "@app/i18n";
import type { RuntimeConfig } from "@core/config";
import { App as AntdApp, ConfigProvider } from "antd";
import {
  render,
  screen,
} from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import { describe, expect, it } from "vitest";

import {
  DiagnosticsPage,
  type ReadyBootstrapState,
} from "./DiagnosticsPage";

const config: RuntimeConfig = {
  apiBaseUrl: "https://secret-api.example.test",
  appName: "Logistics TMS",
  defaultLocale: "vi",
  environment: "staging",
  featureFlags: {
    internalFeature: true,
  },
  identityBaseUrl: "https://secret-identity.example.test",
  oauth: {
    audience: "logisticsx.api",
    clientId: "secret-client-id",
    clockSkewSeconds: 60,
    issuer: "https://secret-issuer.example.test",
    jwksUri: "https://secret-issuer.example.test/jwks",
    postLogoutRedirectUri: "https://app.example.test/login",
    redirectUri: "https://app.example.test/auth/callback",
    scopes: ["openid"],
  },
  requestTimeoutMs: 15_000,
};

const state: ReadyBootstrapState = {
  config,
  health: {
    application: "logicstic",
    database: "enabled",
    profiles: "staging",
    status: "UP",
  },
  kind: "ready",
  requestId: "request-diagnostics",
};

async function renderPage(locale: "en" | "vi") {
  const i18n = await createApplicationI18n({ locale });
  const result = render(
    <I18nextProvider i18n={i18n}>
      <ConfigProvider>
        <AntdApp>
          <DiagnosticsPage state={state} />
        </AntdApp>
      </ConfigProvider>
    </I18nextProvider>,
  );

  return {
    i18n,
    ...result,
  };
}

describe("DiagnosticsPage", () => {
  it.each(["en", "vi"] as const)(
    "renders the approved diagnostics fields in %s",
    async (locale) => {
      const { i18n } = await renderPage(locale);

      expect(
        screen.getByRole("heading", {
          name: i18n.t("diagnostics.title", {
            ns: APP_I18N_NAMESPACE,
          }),
        }),
      ).toBeInTheDocument();

      for (const field of [
        "environment",
        "application",
        "profiles",
        "status",
        "database",
        "requestId",
      ] as const) {
        expect(
          screen.getByText(
            i18n.t(`diagnostics.fields.${field}`, {
              ns: APP_I18N_NAMESPACE,
            }),
          ),
        ).toBeInTheDocument();
      }
    },
  );

  it("renders values and an accessible request-ID copy action", async () => {
    const { i18n } = await renderPage("en");

    expect(screen.getAllByText("staging")).toHaveLength(2);
    expect(screen.getByText("logicstic")).toBeInTheDocument();
    expect(screen.getByText("UP")).toBeInTheDocument();
    expect(screen.getByText("enabled")).toBeInTheDocument();
    expect(
      screen.getByText("request-diagnostics"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: i18n.t("bootstrap.requestId.copy", {
          ns: APP_I18N_NAMESPACE,
        }),
      }),
    ).toBeInTheDocument();
  });

  it("does not expose runtime URLs, OAuth metadata or feature flags", async () => {
    const { container } = await renderPage("en");

    expect(container).not.toHaveTextContent(config.apiBaseUrl);
    expect(container).not.toHaveTextContent(
      config.identityBaseUrl,
    );
    expect(container).not.toHaveTextContent(config.oauth.clientId);
    expect(container).not.toHaveTextContent(config.oauth.issuer);
    expect(container).not.toHaveTextContent("internalFeature");
  });
});
