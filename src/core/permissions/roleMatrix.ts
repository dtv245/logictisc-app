/**
 * Cài đặt ma trận quyền JWT ở mục 5.3 của frontend-context.
 *
 * Policy chỉ phục vụ route/action UX và luôn fail-closed. Backend Spring vẫn
 * là nguồn authorization cuối cùng cho mọi request.
 */

import type { JwtRole } from "./jwtRoles";

const ALL_ROLES = [
  "SUPERADMIN",
  "OWNER",
  "MANAGER",
  "DISPATCHER",
  "DRIVER",
] as const satisfies readonly JwtRole[];

const ADMIN_AND_OWNER = [
  "SUPERADMIN",
  "OWNER",
] as const satisfies readonly JwtRole[];

const NON_DRIVER_ROLES = [
  "SUPERADMIN",
  "OWNER",
  "MANAGER",
  "DISPATCHER",
] as const satisfies readonly JwtRole[];

const FINANCE_WRITERS = [
  "SUPERADMIN",
  "OWNER",
  "MANAGER",
] as const satisfies readonly JwtRole[];

const TERMINAL_DELETERS = [
  "SUPERADMIN",
  "OWNER",
  "MANAGER",
] as const satisfies readonly JwtRole[];

const READ_ACTIONS = ["list", "show", "read"] as const;
const CRUD_WRITE_ACTIONS = ["create", "edit", "update", "delete"] as const;
const CRUD_ACTIONS = [...READ_ACTIONS, ...CRUD_WRITE_ACTIONS] as const;

export const ACCESS_RESOURCES = [
  "roles",
  "employees",
  "customers",
  "invoices",
  "payments",
  "loads",
  "trips",
  "documents",
  "drivers",
  "trucks",
  "terminals",
  "inspections",
  "messages",
  "messaging",
  "conversations",
  "notifications",
] as const;

export type AccessResource = (typeof ACCESS_RESOURCES)[number];

export interface RoleMatrixRule {
  readonly resources: readonly AccessResource[];
  readonly actions: readonly string[];
  readonly roles: readonly JwtRole[];
}

/**
 * Mỗi dòng tương ứng trực tiếp với một dòng trong bảng role matrix. Các alias
 * action chỉ chuyển tên action của Refine (`edit`, `show`) về nghiệp vụ.
 */
export const ROLE_MATRIX = [
  {
    resources: ["roles"],
    actions: CRUD_ACTIONS,
    roles: ADMIN_AND_OWNER,
  },
  {
    resources: ["employees"],
    actions: CRUD_ACTIONS,
    roles: ADMIN_AND_OWNER,
  },
  {
    resources: ["customers"],
    actions: CRUD_ACTIONS,
    roles: FINANCE_WRITERS,
  },
  {
    resources: ["invoices", "payments"],
    actions: READ_ACTIONS,
    roles: NON_DRIVER_ROLES,
  },
  {
    resources: ["invoices", "payments"],
    actions: [...CRUD_WRITE_ACTIONS, "write"],
    roles: FINANCE_WRITERS,
  },
  {
    resources: ["loads", "trips"],
    actions: READ_ACTIONS,
    roles: ALL_ROLES,
  },
  {
    resources: ["loads", "trips"],
    actions: [
      ...CRUD_WRITE_ACTIONS,
      "dispatch",
      "cancel",
    ],
    roles: NON_DRIVER_ROLES,
  },
  {
    resources: ["trips"],
    actions: ["complete"],
    roles: NON_DRIVER_ROLES,
  },
  {
    resources: ["loads"],
    actions: ["pickup", "deliver"],
    roles: ALL_ROLES,
  },
  {
    resources: ["documents"],
    actions: [...READ_ACTIONS, "download", "upload", "create"],
    roles: ALL_ROLES,
  },
  {
    resources: ["documents"],
    actions: ["delete"],
    roles: NON_DRIVER_ROLES,
  },
  {
    resources: ["drivers"],
    actions: READ_ACTIONS,
    roles: NON_DRIVER_ROLES,
  },
  {
    resources: ["trucks"],
    actions: CRUD_ACTIONS,
    roles: NON_DRIVER_ROLES,
  },
  {
    resources: ["terminals"],
    actions: READ_ACTIONS,
    roles: ALL_ROLES,
  },
  {
    resources: ["terminals"],
    actions: ["create", "edit", "update"],
    roles: NON_DRIVER_ROLES,
  },
  {
    resources: ["terminals"],
    actions: ["delete"],
    roles: TERMINAL_DELETERS,
  },
  {
    resources: ["inspections"],
    actions: CRUD_ACTIONS,
    roles: ALL_ROLES,
  },
  {
    resources: ["messages", "messaging", "conversations"],
    actions: [
      ...READ_ACTIONS,
      "create",
      "send",
      "markRead",
      "mark-read",
    ],
    roles: ALL_ROLES,
  },
  {
    resources: ["notifications"],
    actions: [...READ_ACTIONS, "markAllRead", "mark-all-read"],
    roles: ALL_ROLES,
  },
] as const satisfies readonly RoleMatrixRule[];

const isKnownResource = (resource: string): resource is AccessResource =>
  (ACCESS_RESOURCES as readonly string[]).includes(resource);

const containsString = (
  values: readonly string[],
  candidate: string,
): boolean => values.includes(candidate);

/**
 * Trả về false khi resource/action chưa được contract mô tả. SUPERADMIN cũng
 * không vượt qua nhánh này để tránh vô tình mở module chưa có Spring API.
 */
export const canJwtRolesAccess = (
  roles: readonly JwtRole[],
  resource: string | undefined,
  action: string,
): boolean => {
  const normalizedResource = resource?.trim().toLowerCase();
  const normalizedAction = action.trim();

  if (
    !normalizedResource ||
    !normalizedAction ||
    !isKnownResource(normalizedResource)
  ) {
    return false;
  }

  return ROLE_MATRIX.some(
    (rule) =>
      containsString(rule.resources, normalizedResource) &&
      containsString(rule.actions, normalizedAction) &&
      rule.roles.some((allowedRole) =>
        containsString(roles, allowedRole),
      ),
  );
};
