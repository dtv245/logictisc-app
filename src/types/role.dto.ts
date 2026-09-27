/**
 * Data Transfer Object (DTO) cho Role management (`/api/roles`).
 * Khớp chính xác với Spring Boot `RoleController`, `RoleResponse.java`, `CreateRoleRequest.java`.
 */

export interface RoleClaimView {
  id: string;
  claimType: string;
  claimValue: string;
}

export interface RoleResponse {
  id: string;
  name: string;
  displayName?: string | null;
  normalizedName: string;
  claims: RoleClaimView[];
}

export interface RoleClaimRequest {
  claimType: string;
  claimValue: string;
}

export interface CreateRoleRequest {
  name: string;
  displayName?: string | null;
  claims: RoleClaimRequest[];
}

export type UpdateRoleRequest = Partial<CreateRoleRequest>;
