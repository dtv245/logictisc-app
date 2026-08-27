/**
 * Chuẩn hóa role truy cập route đến từ access token của Identity Server.
 *
 * Các giá trị này không đại diện cho TenantRole được quản lý bởi `/api/roles`.
 * Việc tách type giúp UI không vô tình dùng role nghiệp vụ để cấp quyền route.
 */

export const JWT_ROLES = [
  "SUPERADMIN",
  "OWNER",
  "MANAGER",
  "DISPATCHER",
  "DRIVER",
] as const;

export type JwtRole = (typeof JWT_ROLES)[number];

const JWT_ROLE_SET: ReadonlySet<string> = new Set(JWT_ROLES);

const normalizeRoleCandidate = (value: unknown): JwtRole | null => {
  if (typeof value !== "string") {
    return null;
  }

  const trimmedValue = value.trim();
  if (!trimmedValue) {
    return null;
  }

  const withoutSpringPrefix = trimmedValue
    .toUpperCase()
    .replace(/^ROLE_/, "");
  const normalizedValue =
    withoutSpringPrefix === "SUPER_ADMIN"
      ? "SUPERADMIN"
      : withoutSpringPrefix;

  return JWT_ROLE_SET.has(normalizedValue)
    ? (normalizedValue as JwtRole)
    : null;
};

const toClaimValues = (claim: unknown): readonly unknown[] => {
  if (Array.isArray(claim)) {
    return claim;
  }

  return claim === undefined || claim === null ? [] : [claim];
};

/**
 * Đọc đồng thời `role` và `roles` vì backend chấp nhận cả hai claim ở dạng
 * scalar hoặc list. Kết quả chỉ chứa năm JWT role được contract cho phép.
 */
export const normalizeJwtRoles = (
  roleClaim: unknown,
  rolesClaim: unknown,
): readonly JwtRole[] => {
  const normalizedRoles = new Set<JwtRole>();

  for (const candidate of [
    ...toClaimValues(roleClaim),
    ...toClaimValues(rolesClaim),
  ]) {
    const normalizedRole = normalizeRoleCandidate(candidate);
    if (normalizedRole) {
      normalizedRoles.add(normalizedRole);
    }
  }

  return JWT_ROLES.filter((role) => normalizedRoles.has(role));
};

export const isJwtRole = (value: unknown): value is JwtRole =>
  typeof value === "string" && JWT_ROLE_SET.has(value);
