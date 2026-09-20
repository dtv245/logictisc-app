/**
 * JWT role vocabulary and authorization matrix data structures.
 *
 * These values originate from the Identity Server access token. They do not
 * represent TenantRole values managed by `/api/roles`; keeping the type
 * separate prevents UI code from accidentally granting route access based on a
 * business role.
 */

export const JWT_ROLES = [
  "SUPERADMIN",
  "OWNER",
  "MANAGER",
  "DISPATCHER",
  "DRIVER",
] as const;

export type JwtRole = (typeof JWT_ROLES)[number];

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