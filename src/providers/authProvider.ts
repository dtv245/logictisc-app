import type { AuthProvider } from "@refinedev/core";

import { endpoints } from "../api/endpoints";
import { normalizeApiError } from "../api/errors";
import { getCurrentUser, logout } from "../api/authApi";
import { clearActiveTenantKey } from "../api/tenantSession";
import { isLarkLoginParams } from "../types/auth";
import { routes } from "../routes/routeConfig";

export const authProvider = {
  async login(params: unknown) {
    if (!isLarkLoginParams(params)) {
      return {
        success: false,
        error: normalizeApiError(new Error("Kiểu đăng nhập không hợp lệ.")),
      };
    }

    if (params.mode === "redirect") {
      window.location.assign(endpoints.auth.larkLogin);
      return { success: true };
    }

    try {
      await getCurrentUser();
      return {
        success: true,
        redirectTo: routes.dashboard,
        successNotification: {
          message: "Đăng nhập thành công",
        },
      };
    } catch (error: unknown) {
      return {
        success: false,
        error: normalizeApiError(error),
      };
    }
  },

  async logout() {
    try {
      await logout();
      return {
        success: true,
        redirectTo: routes.login,
      };
    } catch (error: unknown) {
      return {
        success: false,
        error: normalizeApiError(error),
      };
    }
  },

  async check() {
    try {
      await getCurrentUser();
      return { authenticated: true };
    } catch (error: unknown) {
      const apiError = normalizeApiError(error);

      if (apiError.statusCode === 401) {
        clearActiveTenantKey();
        return {
          authenticated: false,
          redirectTo: routes.login,
          logout: true,
          error: apiError,
        };
      }

      if (apiError.statusCode === 403) {
        return {
          authenticated: false,
          redirectTo: routes.forbidden,
          error: apiError,
        };
      }

      return {
        authenticated: false,
        redirectTo: routes.login,
        error: apiError,
      };
    }
  },

  async getIdentity() {
    return getCurrentUser();
  },

  async getPermissions() {
    const user = await getCurrentUser();
    return user.permissions ?? [];
  },

  async onError(error: unknown) {
    const apiError = normalizeApiError(error);

    if (apiError.statusCode === 401) {
      clearActiveTenantKey();
      return {
        logout: true,
        redirectTo: routes.login,
        error: apiError,
      };
    }

    if (apiError.statusCode === 403) {
      return {
        redirectTo: routes.forbidden,
        error: apiError,
      };
    }

    return { error: apiError };
  },
} satisfies AuthProvider;
