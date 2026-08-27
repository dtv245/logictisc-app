/**
 * Kiểm chứng runtime config fail-closed và chuẩn hóa URL.
 */

import { describe, expect, it } from "vitest";

import { parseRuntimeConfig } from "./runtimeConfigSchema";

const validConfig = {
  appName: "Logistics TMS",
  environment: "test",
  apiBaseUrl: "https://api.example.test/",
  identityBaseUrl: "https://identity.example.test/",
  oauth: {
    clientId: "logistics-spa",
    redirectUri: "https://app.example.test/auth/callback",
    postLogoutRedirectUri: "https://app.example.test/login",
    scopes: ["openid", "profile"],
    audience: "logisticsx.api",
    issuer: "https://identity.example.test/",
    jwksUri:
      "https://identity.example.test/.well-known/openid-configuration/jwks",
    clockSkewSeconds: 60,
  },
  defaultLocale: "vi",
  featureFlags: {
    messaging: false,
  },
} as const;

describe("runtimeConfigSchema", () => {
  it("normalizes base URLs and preserves the approved audience", () => {
    const config = parseRuntimeConfig(validConfig);

    expect(config.apiBaseUrl).toBe("https://api.example.test");
    expect(config.identityBaseUrl).toBe("https://identity.example.test");
    expect(config.oauth.issuer).toBe("https://identity.example.test");
    expect(config.oauth.audience).toBe("logisticsx.api");
    expect(config.requestTimeoutMs).toBe(15_000);
  });

  it("rejects unexpected keys and non-http URLs", () => {
    expect(() =>
      parseRuntimeConfig({
        ...validConfig,
        apiBaseUrl: "file:///etc/passwd",
        secret: "must-not-be-accepted",
      }),
    ).toThrow();
  });
});
