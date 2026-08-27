/**
 * Public API của lớp authorization.
 */

export {
  createAccessControlProvider,
  type JwtRoleSource,
} from "./accessControlProvider";
export {
  isJwtRole,
  JWT_ROLES,
  normalizeJwtRoles,
  type JwtRole,
} from "./jwtRoles";
export {
  ACCESS_RESOURCES,
  canJwtRolesAccess,
  ROLE_MATRIX,
  type AccessResource,
  type RoleMatrixRule,
} from "./roleMatrix";
export {
  DRIVER_EMPLOYEE_PERMISSION,
  hasDriverEmployeePermission,
  type TenantRoleClaimLike,
} from "./tenantRoleClaims";
