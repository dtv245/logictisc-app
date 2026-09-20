/**
 * Nhận diện permission claim nghiệp vụ gắn với TenantRole.
 *
 * Đây là tiêu chí backend dùng cho `/api/drivers`; JWT role `DRIVER` không
 * được dùng để suy ra một Employee có nằm trong driver lookup hay không.
 */

export const DRIVER_EMPLOYEE_PERMISSION = {
  claimType: "permission",
  claimValue: "update_trip_status",
} as const;

export interface TenantRoleClaimLike {
  readonly claimType: string;
  readonly claimValue: string;
}

export const hasDriverEmployeePermission = (
  claims: readonly TenantRoleClaimLike[],
): boolean =>
  claims.some(
    (claim) =>
      claim.claimType === DRIVER_EMPLOYEE_PERMISSION.claimType &&
      claim.claimValue === DRIVER_EMPLOYEE_PERMISSION.claimValue,
  );
