/**
 * Kiểm chứng loader phân biệt config thiếu, lỗi HTTP và payload hợp lệ.
 */

import { describe, expect, it, vi } from "vitest";

import { loadRuntimeConfig } from "./loadRuntimeConfig";

const validPayload = {
  appName: "Logistics TMS",
  environment: "test",
  apiBaseUrl: "https://api.example.test",
  identityBaseUrl: "https://identity.example.test",
  oauth: {
    clientId: "spa",
    redirectUri: "https://app.example.test/auth/callback",
    postLogoutRedirectUri: "https://app.example.test/login",
    scopes: ["openid"],
    audience: "logisticsx.api",
    issuer: "https://identity.example.test",
    jwksUri: "https://identity.example.test/jwks",
    clockSkewSeconds: 60,
  },
  defaultLocale: "vi",
  featureFlags: {},
};

describe("loadRuntimeConfig", () => {
  it("loads a no-store JSON document", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify(validPayload), {
        headers: {
          "Content-Type": "application/json",
        },
        status: 200,
      }),
    );

    const config = await loadRuntimeConfig({
      fetcher,
      url: "/runtime-config.json",
    });

    expect(config.apiBaseUrl).toBe("https://api.example.test");
    expect(fetcher).toHaveBeenCalledWith(
      "/runtime-config.json",
      expect.objectContaining({
        cache: "no-store",
      }),
    );
  });

  it("reports a missing deployment config explicitly", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response(null, { status: 404 }));

    await expect(
      loadRuntimeConfig({
        fetcher,
        url: "/runtime-config.json",
      }),
    ).rejects.toMatchObject({
      code: "CONFIG_MISSING",
    });
  });
});
