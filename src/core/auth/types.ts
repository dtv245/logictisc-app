/**
 * Định nghĩa boundary giữa runtime config, OIDC adapter và auth session.
 *
 * Core auth chỉ nhận settings đã được bootstrap/validate; file này không phụ
 * thuộc implementation cụ thể trong `core/config`.
 */

import type { JwtRole } from "../permissions";

export const LOGISTICS_API_AUDIENCE = "logisticsx.api" as const;

export interface AuthRuntimeSettings {
  readonly authority: string;
  readonly issuer: string;
  readonly jwksUri: string;
  readonly clientId: string;
  readonly redirectUri: string;
  readonly silentRedirectUri?: string;
  readonly postLogoutRedirectUri?: string;
  readonly scopes: readonly string[];
  readonly refreshSkewSeconds?: number;
  readonly clockToleranceSeconds?: number;
}

export interface OidcProfileSnapshot {
  readonly subject: string;
  readonly name?: string;
  readonly preferredUsername?: string;
  readonly email?: string;
  readonly picture?: string;
}

export interface OidcUserSnapshot {
  readonly accessToken: string;
  readonly expiresAt?: number;
  readonly profile: OidcProfileSnapshot;
}

export interface OidcLoginResult {
  readonly user: OidcUserSnapshot;
  readonly returnTo: string;
}

export interface OidcGateway {
  startLogin: (returnTo: string) => Promise<void>;
  completeLogin: (callbackUrl?: string) => Promise<OidcLoginResult>;
  getUser: () => Promise<OidcUserSnapshot | null>;
  renewUser: () => Promise<OidcUserSnapshot>;
  removeUser: () => Promise<void>;
  /**
   * Trả true khi đã bắt đầu redirect tới end-session endpoint của Identity
   * Server; false khi provider không công bố endpoint và chỉ logout cục bộ.
   */
  logout: () => Promise<boolean>;
}

export interface VerifiedAccessToken {
  readonly expiresAt: number;
  readonly tenantId: string;
  readonly subject?: string;
  readonly roles: readonly JwtRole[];
}

export interface AccessTokenVerifier {
  verify: (accessToken: string) => Promise<VerifiedAccessToken>;
}

export interface AuthIdentity {
  readonly id: string;
  readonly name: string;
  readonly avatar?: string;
  readonly email?: string;
  readonly tenantId: string;
  /**
   * Chỉ chứa JWT role của Identity Server, không chứa TenantRole nghiệp vụ.
   */
  readonly roles: readonly JwtRole[];
}

export interface AuthSessionSnapshot {
  readonly accessToken: string;
  readonly expiresAt: number;
  readonly tenantId: string;
  readonly roles: readonly JwtRole[];
  readonly identity: AuthIdentity;
}

export interface BrowserLocationAdapter {
  getCurrentPath: () => string;
}
