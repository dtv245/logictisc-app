/**
 * Verifies localized, accessible bootstrap recovery states and sanitization.
 */

import {
  APP_I18N_NAMESPACE,
  createApplicationI18n,
} from "@app/i18n";
import {
  RuntimeConfigError,
  type RuntimeConfig,
} from "@core/config";
import { SHARED_I18N_NAMESPACE } from "@shared/i18n";
import { App as AntdApp, ConfigProvider } from "antd";
import {
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import type { ReactElement } from "react";
import { I18nextProvider } from "react-i18next";
import { describe, expect, it, vi } from "vitest";

import type { AppBootstrapState } from "./bootstrapState";
import { BootstrapStateView } from "./BootstrapStateView";

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

async function renderState(
  ui: ReactElement,
): Promise<ReturnType<typeof render>> {
  const i18n = await createApplicationI18n({ locale: "en" });

  return render(
    <I18nextProvider i18n={i18n}>
      <ConfigProvider>
        <AntdApp>{ui}</AntdApp>
      </ConfigProvider>
    </I18nextProvider>,
  );
}

describe("BootstrapStateView", () => {
  it.each([
    ["loading-config", "bootstrap.loadingConfig"],
    ["probing-health", "bootstrap.probingHealth"],
  ] as const)("renders and announces %s", async (kind, translationKey) => {
    const state: AppBootstrapState =
      kind === "loading-config"
        ? { kind }
        : { config, kind };
    const i18n = await createApplicationI18n({ locale: "en" });
    const message = i18n.t(translationKey, {
      ns: APP_I18N_NAMESPACE,
    });

    await renderState(<BootstrapStateView state={state} />);

    expect(screen.getAllByText(message)).toHaveLength(2);
    expect(screen.getByRole("region")).toHaveAttribute(
      "aria-busy",
      "true",
    );
  });

  it("renders only safe config codes and field names", async () => {
    const error = new RuntimeConfigError(
      "CONFIG_INVALID",
      "Invalid config",
      [
        "apiBaseUrl: https://secret.example.test/token",
        "unstructured https://secret.example.test",
      ],
    );

    await renderState(
      <BootstrapStateView
        state={{
          error,
          kind: "config-error",
        }}
      />,
    );

    expect(screen.getByText("CONFIG_INVALID")).toBeInTheDocument();
    expect(screen.getByText("apiBaseUrl")).toBeInTheDocument();
    expect(
      screen.queryByText(/secret\.example\.test/u),
    ).not.toBeInTheDocument();
  });

  it.each([
    ["api-unreachable", "bootstrap.unreachable.title"],
    ["cors-blocked", "bootstrap.corsBlocked.title"],
    ["database-disabled", "bootstrap.databaseDisabled.title"],
  ] as const)(
    "renders %s with retry and request ID",
    async (kind, titleKey) => {
      const i18n = await createApplicationI18n({ locale: "en" });
      const onRetry = vi.fn();
      const requestId = `request-${kind}`;
      const state: AppBootstrapState =
        kind === "database-disabled"
          ? {
              config,
              health: {
                ...health,
                database: "disabled",
              },
              kind,
              requestId,
            }
          : {
              config,
              kind,
              requestId,
            };

      await renderState(
        <BootstrapStateView
          onRetry={onRetry}
          state={state}
        />,
      );

      expect(
        screen.getByText(
          i18n.t(titleKey, { ns: APP_I18N_NAMESPACE }),
        ),
      ).toBeInTheDocument();
      expect(screen.getByText(requestId)).toBeInTheDocument();
      expect(
        screen.getByRole("button", {
          name: i18n.t("bootstrap.requestId.copy", {
            ns: APP_I18N_NAMESPACE,
          }),
        }),
      ).toBeInTheDocument();

      fireEvent.click(
        screen.getByRole("button", {
          name: i18n.t("actions.retry", {
            ns: SHARED_I18N_NAMESPACE,
          }),
        }),
      );
      expect(onRetry).toHaveBeenCalledOnce();
    },
  );

  it("shows HTTP status and disables retry while pending", async () => {
    const i18n = await createApplicationI18n({ locale: "en" });

    await renderState(
      <BootstrapStateView
        isRetrying
        onRetry={vi.fn()}
        state={{
          config,
          health: {
            ...health,
            status: "DOWN",
          },
          httpStatus: 503,
          kind: "api-unhealthy",
          requestId: "request-down",
        }}
      />,
    );

    expect(
      screen.getByText(
        i18n.t("bootstrap.httpStatus", {
          ns: APP_I18N_NAMESPACE,
          status: 503,
        }),
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: /Try again$/u,
      }),
    ).toBeDisabled();
  });

  it("renders no blocking state after readiness", async () => {
    const { container } = await renderState(
      <BootstrapStateView
        state={{
          config,
          health,
          kind: "ready",
          requestId: "request-ready",
        }}
      />,
    );

    expect(container.firstElementChild).toBeEmptyDOMElement();
  });
});
