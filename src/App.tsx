/**
 * Composes application-wide UI providers and the authenticated Refine runtime
 * after config and health gates have succeeded.
 *
 * The runtime services are scoped to one validated deployment configuration
 * and are recreated only when that configuration changes.
 */

import { Refine } from "@refinedev/core";
import routerProvider from "@refinedev/react-router-v6";
import { App as AntdApp } from "antd";
import type { i18n } from "i18next";
import { useMemo } from "react";
import { I18nextProvider, useTranslation } from "react-i18next";
import { BrowserRouter } from "react-router-dom";

import { AntdLocaleProvider } from "./components/AntdLocaleProvider";
import {
  AppBootstrap,
  type AppBootstrapProps,
} from "./config";
import { env } from "./config/env";
import {
  createFoundationResources,
  foundationApiResources,
  foundationResourcePageRoutes,
} from "./pages/resourceRegistry";
import type { ReadyBootstrapState } from "./pages/diagnostics";
import { AppRouter } from "./router/AppRouter";
import { createApiClient } from "./providers/api/apiClient";
import { createAccessControlProvider } from "./providers/accessControlProvider";
import { createLogisticsDataProvider } from "./providers/dataProvider";
import {
  browserLocationAdapter,
  createAuthProvider,
  createDevelopmentAuthProvider,
} from "./providers/authProvider";
import { createCurrentUserLoader } from "./providers/auth/currentUser";
import { DemoAuthSession } from "./providers/auth/demoAuthSession";
import { createRefineI18nProvider } from "./providers/i18nProvider";
import { createRemoteJwkAccessTokenVerifier } from "./providers/auth/jwtVerifier";
import { useAntdNotificationProvider } from "./providers/notificationProvider";
import { createBrowserOidcGateway } from "./providers/auth/oidcGateway";
import { shouldRetryQuery } from "./providers/api/retryPolicy";
import { AuthSessionManager } from "./providers/auth/sessionManager";

export interface AppProps
  extends Omit<AppBootstrapProps, "renderReady"> {
  i18n: i18n;
}

export function App({
  i18n,
  loadConfig,
  probeApiHealth,
}: AppProps) {
  return (
    <I18nextProvider i18n={i18n}>
      <AntdLocaleProvider>
        <AntdApp>
          <AppBootstrap
            {...(loadConfig ? { loadConfig } : {})}
            {...(probeApiHealth ? { probeApiHealth } : {})}
            renderReady={(state) => (
              <RuntimeApplication state={state} />
            )}
          />
        </AntdApp>
      </AntdLocaleProvider>
    </I18nextProvider>
  );
}

export interface RuntimeApplicationProps {
  state: ReadyBootstrapState;
}

export function RuntimeApplication({
  state,
}: RuntimeApplicationProps) {
  const notificationProvider = useAntdNotificationProvider();
  const { i18n, t } = useTranslation();

  // Provider objects own session/refresh state, so they must be recreated only
  // when deployment runtime configuration changes.
  const runtime = useMemo(() => {
    // Mọi thành phần auth dùng chung một bộ giá trị đã qua bootstrap validation;
    // tránh trường hợp verifier, OIDC client và API client đọc lệch cấu hình.
    const authSettings = {
      authority: state.config.identityBaseUrl,
      issuer: state.config.oauth.issuer,
      jwksUri: state.config.oauth.jwksUri,
      clientId: state.config.oauth.clientId,
      redirectUri: state.config.oauth.redirectUri,
      postLogoutRedirectUri:
        state.config.oauth.postLogoutRedirectUri,
      scopes: state.config.oauth.scopes,
      refreshSkewSeconds: state.config.oauth.clockSkewSeconds,
      clockToleranceSeconds: state.config.oauth.clockSkewSeconds,
    };
    const sessions = new AuthSessionManager({
      oidc: createBrowserOidcGateway(authSettings),
      tokenVerifier: createRemoteJwkAccessTokenVerifier(authSettings),
      refreshSkewSeconds: authSettings.refreshSkewSeconds,
    });
    const localSession = new DemoAuthSession();
    // Local password auth requires all three development gates. Production
    // builds cannot enable it using runtime configuration alone.
    const demoEnabled =
      import.meta.env.DEV &&
      state.config.featureFlags.demoAuth ==
        true &&
      env.demoAuth !== null;
    const tokenProvider = demoEnabled
      ? {
          getAccessToken: () =>
            localSession.isActive()
              ? localSession.getAccessToken()
              : sessions.getAccessToken(),
          refreshAccessToken: async () =>
            localSession.isActive()
              ? localSession.refreshAccessToken()
              : sessions.refreshAccessToken(),
          onRefreshFailure: async () => {
            await localSession.clearSession();
            await sessions.clearSession();
          },
        }
      : {
          getAccessToken: sessions.getAccessToken,
          refreshAccessToken: sessions.refreshAccessToken,
          onRefreshFailure: sessions.clearSession,
        };
    const apiClient = createApiClient({
      runtimeConfig: {
        apiBaseUrl: state.config.apiBaseUrl,
        healthPath: "/api/health",
        requestTimeoutMs: state.config.requestTimeoutMs,
      },
      tokenProvider,
    });
    const loadIdentity = createCurrentUserLoader({
      apiClient,
      clearSession: async () => {
        await localSession.clearSession();
        await sessions.clearSession();
      },
    });
    const productionAuthProvider = createAuthProvider({
      sessions,
      location: browserLocationAdapter,
      loginPath: "/login",
      loadIdentity,
    });
    const developmentAuthProvider = createDevelopmentAuthProvider({
      apiClient,
      localSession,
      loadIdentity,
      oidcProvider: productionAuthProvider,
    });
    const roleSource = demoEnabled
      ? {
          getJwtRoles: async () =>
            localSession.isActive()
              ? localSession.getJwtRoles()
              : sessions.getJwtRoles(),
        }
      : sessions;

    return {
      accessControlProvider: createAccessControlProvider(roleSource),
      authProvider: demoEnabled
        ? developmentAuthProvider
        : productionAuthProvider,
      dataProvider: createLogisticsDataProvider({
        apiClient,
        resources: foundationApiResources,
      }),
    };
  }, [state.config]);

  // Phải dựng lại khi `t` đổi vì nhãn resource được dịch ngay bên trong factory
  // (`resourceRegistry.ts` ghi đè `meta.label`). Memo để giữ nguyên reference của
  // mảng resource — Refine dùng nó cho menu và router, mảng mới mỗi render sẽ làm
  // toàn bộ menu dựng lại.
  const resources = useMemo(
    () => createFoundationResources(t),
    [t],
  );
  // Refine nhận provider này qua context; object mới mỗi render sẽ khiến mọi
  // component con tiêu thụ i18nProvider render lại dù ngôn ngữ không đổi.
  const i18nProvider = useMemo(
    () =>
      createRefineI18nProvider({
        translate: t,
        changeLanguage: i18n.changeLanguage.bind(i18n),
        getLanguage: () => i18n.language,
      }),
    [i18n, t],
  );

  return (
    <BrowserRouter
      basename={import.meta.env.BASE_URL}
      future={{
        v7_relativeSplatPath: true,
        v7_startTransition: true,
      }}
    >
      <Refine
        accessControlProvider={runtime.accessControlProvider}
        authProvider={runtime.authProvider}
        dataProvider={runtime.dataProvider}
        i18nProvider={i18nProvider}
        notificationProvider={notificationProvider}
        resources={resources}
        routerProvider={routerProvider}
        options={{
          disableTelemetry: true,
          reactQuery: {
            clientConfig: {
              defaultOptions: {
                queries: {
                  retry: shouldRetryQuery,
                },
              },
            },
          },
          syncWithLocation: true,
        }}
      >
        <AppRouter
          diagnosticsState={state}
          resourcePageRoutes={foundationResourcePageRoutes}
        />
      </Refine>
    </BrowserRouter>
  );
}