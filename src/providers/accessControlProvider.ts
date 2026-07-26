import type { AccessControlProvider } from "@refinedev/core";

import { getCurrentUser } from "../services/authService";
import { normalizeApiError } from "../api/errors";

const publicAuthenticatedResources = new Set(["dashboard"]);

export const accessControlProvider: AccessControlProvider = {
  async can({ resource, action }) {
    if (!resource || publicAuthenticatedResources.has(resource)) {
      return { can: true };
    }

    try {
      const user = await getCurrentUser();
      const permissions = new Set(user.permissions ?? []);
      const canAccess =
        permissions.has("*") ||
        permissions.has(`${resource}:*`) ||
        permissions.has(`${resource}:${action}`);

      return {
        can: canAccess,
        reason: canAccess ? undefined : "Bạn không có quyền truy cập tài nguyên này.",
      };
    } catch (error: unknown) {
      const apiError = normalizeApiError(error);
      return { can: false, reason: apiError.message };
    }
  },
  options: {
    buttons: {
      enableAccessControl: true,
      hideIfUnauthorized: true,
    },
  },
};
