/**
 * Implement Refine authentication, identity và permission bindings.
 */

import type { AuthProvider } from "@refinedev/core";

import { endpoints } from "../services/http/endpoints";
import { normalizeApiError } from "../services/http/errors";
import {
  getCurrentUser,
  login as loginWithPassword,
  logout,
} from "../services/authService";
import { clearActiveTenantKey } from "../services/http/tenantSession";
import {
  isLarkLoginParams,
  isPasswordLoginParams,
} from "../types/auth";
import { routes } from "../constants/routes";

export const authProvider = {
  async login(params: unknown) {
    if (isLarkLoginParams(params) && params.mode === "redirect") {
      window.location.assign(endpoints.auth.larkLogin);
      return { success: true };
    }

    try {
      if (isPasswordLoginParams(params)) {
        await loginWithPassword(params);
      } else if (!isLarkLoginParams(params)) {
        return {
          success: false,
          error: normalizeApiError(new Error("Kiểu đăng nhập không hợp lệ.")),
        };
      }

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
