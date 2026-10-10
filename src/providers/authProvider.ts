/**
 * Refine v4 AuthProvider implementation for the application.
 *
 * `createAuthProvider` adapts standard OIDC and Lark SSO sessions.
 */

import type {
  AuthProvider,
  RefineError,
} from "@refinedev/core";

import { routes } from "../constants/routes";
import type { LarkAuthLoginResponse } from "../types/auth.types";
import type {
  AuthIdentity,
  BrowserLocationAdapter,
} from "../types/authSession.types";
import type { LogisticsApiClient } from "../types/apiClient.types";
import { translate } from "@locales/translate";
import { normalizeLocalReturnTo } from "../providers/auth/oidcGateway";
import { AuthSessionManager } from "../providers/auth/sessionManager";
import { env } from "../config/env";

const DEFAULT_LOGIN_PATH = "/login";

export interface AuthProviderOptions {
  readonly sessions: AuthSessionManager;
  readonly location: BrowserLocationAdapter;
  readonly loginPath?: string;
  readonly loadIdentity?: (
    identity: AuthIdentity,
  ) => Promise<AuthIdentity>;
  readonly apiClient?: LogisticsApiClient;
  readonly larkLoginUrl?: string;
}

const readStringProperty = (
  value: unknown,
  property: string,
): string | undefined => {
  // Refine cho phép nhiều hình dạng login params; đọc phòng thủ để provider
  // không phải tin vào type assertion từ từng caller.
  if (
    typeof value !== "object" ||
    value === null ||
    !(property in value)
  ) {
    return undefined;
  }

  const propertyValue = value[property as keyof typeof value];
  return typeof propertyValue === "string"
    ? propertyValue
    : undefined;
};

const extractLoginReturnTo = (
  params: unknown,
  currentPath: string,
): string =>
  // normalizeLocalReturnTo chặn absolute/protocol-relative URL, tránh biến
  // returnTo thành open redirect sau khi Identity Server callback.
  normalizeLocalReturnTo(
    readStringProperty(params, "returnTo") ??
      readStringProperty(params, "to") ??
      readStringProperty(params, "redirectTo") ??
      currentPath,
  );

const getStatusCode = (error: unknown): number | undefined => {
  // Lỗi có thể đến từ Refine, domain layer hoặc Axios nên hỗ trợ ba shape phổ
  // biến nhưng không phụ thuộc trực tiếp vào implementation của HTTP client.
  if (typeof error !== "object" || error === null) {
    return undefined;
  }

  if ("statusCode" in error && typeof error.statusCode === "number") {
    return error.statusCode;
  }

  if ("status" in error && typeof error.status === "number") {
    return error.status;
  }

  if (
    "response" in error &&
    typeof error.response === "object" &&
    error.response !== null &&
    "status" in error.response &&
    typeof error.response.status === "number"
  ) {
    return error.response.status;
  }

  return undefined;
};

const toProviderError = (error: unknown): RefineError | Error => {
  if (error instanceof Error) {
    return error;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string" &&
    "statusCode" in error &&
    typeof error.statusCode === "number"
  ) {
    return {
      message: error.message,
      statusCode: error.statusCode,
    };
  }

  return new Error("AUTH_REQUEST_FAILED");
};

const createLoginRedirect = (
  loginPath: string,
  returnTo: string,
): string =>
  `${loginPath}?returnTo=${encodeURIComponent(
    normalizeLocalReturnTo(returnTo),
  )}`;
export const createAuthProvider = (
  options: AuthProviderOptions,
): AuthProvider => {
  const loginPath = options.loginPath ?? DEFAULT_LOGIN_PATH;

  return {
    login: async (params: unknown) => {
      const provider = readStringProperty(params, "provider");
      const mode = readStringProperty(params, "mode");

      if (
        provider === "lark" ||
        (mode === "callback" &&
          Boolean(
            readStringProperty(params, "code") ||
              readStringProperty(params, "error") ||
              readStringProperty(params, "errorDescription"),
          ))
      ) {
        if (mode === "redirect") {
          const returnTo = extractLoginReturnTo(
            params,
            options.location.getCurrentPath(),
          );
          const larkLoginBase = options.larkLoginUrl ?? env.larkLoginUrl;
          const larkUrl = `${larkLoginBase}?returnTo=${encodeURIComponent(returnTo)}`;
          if (options.location.assign) {
            options.location.assign(larkUrl);
          } else {
            window.location.assign(larkUrl);
          }
          return { success: true };
        }

        if (mode === "callback") {
          const code = readStringProperty(params, "code");
          const state = readStringProperty(params, "state");
          const returnTo = readStringProperty(params, "returnTo");
          const error = readStringProperty(params, "error");
          const errorDescription =
            readStringProperty(params, "errorDescription") ??
            readStringProperty(params, "error_description");

          if (error) {
            return {
              success: false,
              error: {
                message: errorDescription || `LARK_AUTH_CANCELLED: ${error}`,
                name: "LARK_AUTH_CANCELLED",
              },
            };
          }

          if (!code) {
            return {
              success: false,
              error: {
                message: "Authorization code is missing",
                name: "LARK_CODE_MISSING",
              },
            };
          }

          try {
            if (!options.apiClient) {
              throw new Error("LARK_API_CLIENT_REQUIRED");
            }

            const response = await options.apiClient.instance.post<unknown>(
              "/api/auth/lark/callback",
              {
                code,
                state,
                returnTo,
                error,
                errorDescription,
              },
              {
                logistics: { authentication: "none" },
              },
            );

            const loginResponse = response.data as LarkAuthLoginResponse;
            await options.sessions.establishLarkSession(loginResponse);

            return {
              success: true,
              redirectTo: normalizeLocalReturnTo(
                loginResponse.returnTo ?? routes.dashboard,
                routes.dashboard,
              ),
              successNotification: { message: translate("auth.loginSuccess") },
            };
          } catch (callbackErr) {
            await options.sessions.clearSession();
            return {
              success: false,
              error: toProviderError(callbackErr),
            };
          }
        }
      }

      // Callback hoàn tất authorization-code flow; các lần login còn lại chỉ
      // khởi tạo redirect sang Identity Server.
      if (mode === "callback") {
        const result = await options.sessions.completeLogin();
        return {
          success: true,
          redirectTo: normalizeLocalReturnTo(result.returnTo),
        };
      }

      const returnTo = extractLoginReturnTo(
        params,
        options.location.getCurrentPath(),
      );

      if (
        typeof params === "object" &&
        params !== null &&
        Reflect.get(params, "forceReauthentication") === true
      ) {
        // Đổi tenant cần prompt đăng nhập mới, vì tenant là claim của token chứ
        // không phải state mà SPA được phép tự thay đổi.
        await options.sessions.clearSession();
      }

      await options.sessions.startLogin(returnTo);
      return { success: true };
    },

    logout: async () => {
      const identityLogoutStarted = await options.sessions.logout();

      return identityLogoutStarted
        ? { success: true }
        : {
            success: true,
            redirectTo: loginPath,
          };
    },

    check: async () => {
      try {
        const session = await options.sessions.getSession();
        if (session) {
          return { authenticated: true };
        }
      } catch {
        // Session lỗi verify/refresh được coi như hết hạn. Xóa local state trước
        // khi chuyển login để lần thử kế tiếp không lặp lại trên token hỏng.
        await options.sessions.clearSession();
      }

      return {
        authenticated: false,
        logout: true,
        redirectTo: createLoginRedirect(
          loginPath,
          options.location.getCurrentPath(),
        ),
      };
    },

    onError: async (error: unknown) => {
      const statusCode = getStatusCode(error);
      const providerError = toProviderError(error);

      if (statusCode === 401) {
        await options.sessions.clearSession();
        return {
          logout: true,
          redirectTo: createLoginRedirect(
            loginPath,
            options.location.getCurrentPath(),
          ),
          error: providerError,
        };
      }

      if (statusCode === 403) {
        // 403 là authenticated-but-forbidden: không refresh, không logout và
        // không đổi route để UI có thể hiển thị forbidden state riêng.
        return { error: providerError };
      }

      return { error: providerError };
    },

    getPermissions: async () =>
      options.sessions.getJwtRoles(),

    getIdentity: async () => {
      const identity = await options.sessions.getIdentity();
      if (!identity || !options.loadIdentity) {
        return identity;
      }

      // Loader tùy chọn cho phép runtime đối chiếu token identity với `/api/me`
      // mà vẫn giữ factory độc lập với API client và dễ unit test.
      return options.loadIdentity(identity);
    },
  };
};

export const browserLocationAdapter: BrowserLocationAdapter = {
  getCurrentPath: () =>
    `${window.location.pathname}${window.location.search}${window.location.hash}`,
  assign: (url: string) => {
    window.location.assign(url);
  },
};