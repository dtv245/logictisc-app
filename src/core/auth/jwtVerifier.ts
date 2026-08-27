/**
 * Xác minh access token bằng remote JWK Set của Identity Server.
 *
 * JOSE chịu trách nhiệm kiểm tra chữ ký, issuer, audience và thời gian; lớp
 * này bổ sung các invariant contract bắt buộc như exp và tenant khác rỗng.
 */

import {
  createRemoteJWKSet,
  jwtVerify,
  type JWTPayload,
} from "jose";

import { normalizeJwtRoles } from "../permissions";
import {
  LOGISTICS_API_AUDIENCE,
  type AccessTokenVerifier,
  type AuthRuntimeSettings,
  type VerifiedAccessToken,
} from "./types";

export type AccessTokenValidationCode =
  | "TOKEN_EXPIRED"
  | "TOKEN_MISSING_EXPIRY"
  | "TOKEN_MISSING_TENANT"
  | "TOKEN_WRONG_AUDIENCE"
  | "TOKEN_WRONG_ISSUER";

export class AccessTokenValidationError extends Error {
  readonly code: AccessTokenValidationCode;

  constructor(code: AccessTokenValidationCode) {
    super(code);
    this.name = "AccessTokenValidationError";
    this.code = code;
  }
}

const hasExpectedAudience = (audience: JWTPayload["aud"]): boolean =>
  typeof audience === "string"
    ? audience === LOGISTICS_API_AUDIENCE
    : Array.isArray(audience) &&
      audience.includes(LOGISTICS_API_AUDIENCE);

export interface VerifiedClaimsValidationOptions {
  readonly issuer: string;
  readonly clockToleranceSeconds: number;
  readonly nowEpochSeconds?: number;
}

/**
 * Hàm thuần được tách riêng để kiểm thử các contract claim sau khi JOSE đã
 * xác thực cryptographic signature.
 */
export const validateVerifiedAccessTokenClaims = (
  payload: JWTPayload,
  options: VerifiedClaimsValidationOptions,
): VerifiedAccessToken => {
  if (payload.iss !== options.issuer) {
    throw new AccessTokenValidationError("TOKEN_WRONG_ISSUER");
  }

  if (!hasExpectedAudience(payload.aud)) {
    throw new AccessTokenValidationError("TOKEN_WRONG_AUDIENCE");
  }

  if (typeof payload.exp !== "number") {
    throw new AccessTokenValidationError("TOKEN_MISSING_EXPIRY");
  }

  const nowEpochSeconds =
    options.nowEpochSeconds ?? Math.floor(Date.now() / 1_000);
  if (payload.exp + options.clockToleranceSeconds <= nowEpochSeconds) {
    throw new AccessTokenValidationError("TOKEN_EXPIRED");
  }

  const tenantId =
    typeof payload.tenant === "string" ? payload.tenant.trim() : "";
  if (!tenantId) {
    throw new AccessTokenValidationError("TOKEN_MISSING_TENANT");
  }

  const subject =
    typeof payload.sub === "string" && payload.sub.trim()
      ? payload.sub
      : undefined;

  return {
    expiresAt: payload.exp,
    tenantId,
    ...(subject ? { subject } : {}),
    roles: normalizeJwtRoles(payload.role, payload.roles),
  };
};

export const createRemoteJwkAccessTokenVerifier = (
  settings: Pick<
    AuthRuntimeSettings,
    "issuer" | "jwksUri" | "clockToleranceSeconds"
  >,
): AccessTokenVerifier => {
  const clockToleranceSeconds = settings.clockToleranceSeconds ?? 30;
  const remoteJwkSet = createRemoteJWKSet(new URL(settings.jwksUri));

  return {
    verify: async (accessToken) => {
      const { payload } = await jwtVerify(accessToken, remoteJwkSet, {
        issuer: settings.issuer,
        audience: LOGISTICS_API_AUDIENCE,
        clockTolerance: clockToleranceSeconds,
      });

      return validateVerifiedAccessTokenClaims(payload, {
        issuer: settings.issuer,
        clockToleranceSeconds,
      });
    },
  };
};
