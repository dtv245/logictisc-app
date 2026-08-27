/**
 * Refine v4 AuthProvider cho OIDC session.
 *
 * Factory được inject session manager và browser location để có thể test
 * deep-link/401/403 mà không phụ thuộc router hoặc global singleton.
 */

import type {
  AuthProvider,
  RefineError,
} from "@refinedev/core";

import { normalizeLocalReturnTo } from "./oidcGateway";
import { AuthSessionManager } from "./sessionManager";
import type { BrowserLocationAdapter } from "./types";

const DEFAULT_LOGIN_PATH = "/login";

export interface AuthProviderOptions {
  readonly sessions: AuthSessionManager;
  readonly location: BrowserLocationAdapter;
  readonly loginPath?: string;
}

const readStringProperty = (
  value: unknown,
  property: string,
): string | undefined => {
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
  normalizeLocalReturnTo(
    readStringProperty(params, "returnTo") ??
      readStringProperty(params, "to") ??
      readStringProperty(params, "redirectTo") ??
      currentPath,
  );

const getStatusCode = (error: unknown): number | undefined => {
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
      const returnTo = extractLoginReturnTo(
        params,
        options.location.getCurrentPath(),
      );
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

    getIdentity: async () =>
      options.sessions.getIdentity(),
  };
};

export const browserLocationAdapter: BrowserLocationAdapter = {
  getCurrentPath: () =>
    `${window.location.pathname}${window.location.search}${window.location.hash}`,
};
