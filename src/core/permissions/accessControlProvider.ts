/**
 * Kết nối ma trận JWT role với AccessControlProvider của Refine v4.
 *
 * Role source được inject để provider không phụ thuộc ngược vào một singleton
 * auth hoặc runtime-config cụ thể.
 */

import type { AccessControlProvider } from "@refinedev/core";

import type { JwtRole } from "./jwtRoles";
import { canJwtRolesAccess } from "./roleMatrix";

export interface JwtRoleSource {
  getJwtRoles: () => Promise<readonly JwtRole[]>;
}

export const createAccessControlProvider = (
  roleSource: JwtRoleSource,
): AccessControlProvider => ({
  can: async ({ resource, action }) => {
    const roles = await roleSource.getJwtRoles();
    const can = canJwtRolesAccess(roles, resource, action);

    return can
      ? { can: true }
      : {
          can: false,
          reason: "authorization.forbidden",
        };
  },
  options: {
    buttons: {
      enableAccessControl: true,
      hideIfUnauthorized: true,
    },
  },
});
