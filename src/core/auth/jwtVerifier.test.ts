/**
 * Kiểm thử invariant claim sau bước xác minh chữ ký JOSE.
 */

import { describe, expect, it } from "vitest";

import {
  AccessTokenValidationError,
  validateVerifiedAccessTokenClaims,
} from "./jwtVerifier";

const basePayload = {
  iss: "https://identity.example",
  aud: ["other.api", "logisticsx.api"],
  exp: 2_000,
  sub: "user-1",
  tenant: "tenant-1",
  role: "ROLE_SUPER_ADMIN",
  roles: ["dispatcher", "unknown"],
};

const options = {
  issuer: "https://identity.example",
  clockToleranceSeconds: 30,
  nowEpochSeconds: 1_000,
};

const payloadWithoutExpiry = {
  iss: basePayload.iss,
  aud: basePayload.aud,
  sub: basePayload.sub,
  tenant: basePayload.tenant,
  role: basePayload.role,
  roles: basePayload.roles,
};

describe("validateVerifiedAccessTokenClaims", () => {
  it("requires logistics audience and returns normalized auth claims", () => {
    expect(
      validateVerifiedAccessTokenClaims(basePayload, options),
    ).toEqual({
      expiresAt: 2_000,
      tenantId: "tenant-1",
      subject: "user-1",
      roles: ["SUPERADMIN", "DISPATCHER"],
    });
  });

  it.each([
    [
      "TOKEN_WRONG_ISSUER",
      { ...basePayload, iss: "https://wrong.example" },
    ],
    ["TOKEN_WRONG_AUDIENCE", { ...basePayload, aud: "other.api" }],
    ["TOKEN_MISSING_EXPIRY", payloadWithoutExpiry],
    ["TOKEN_EXPIRED", { ...basePayload, exp: 900 }],
    ["TOKEN_MISSING_TENANT", { ...basePayload, tenant: "  " }],
  ] as const)("rejects %s", (expectedCode, payload) => {
    expect(() =>
      validateVerifiedAccessTokenClaims(payload, options),
    ).toThrowError(
      expect.objectContaining<Partial<AccessTokenValidationError>>({
        code: expectedCode,
      }),
    );
  });
});
