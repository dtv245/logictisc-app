import type { AxiosAdapter } from "axios";
import { describe, expect, it } from "vitest";

import { createApiClient } from "@providers/api/apiClient";
import { DemoAuthSession } from "@providers/auth/demoAuthSession";

const createClient = (data: unknown) =>
  createApiClient({
    runtimeConfig: {
      apiBaseUrl: "https://api.example.test",
      healthPath: "/api/health",
      requestTimeoutMs: 1_000,
    },
    tokenProvider: {
      getAccessToken: () => null,
      refreshAccessToken: async () => null,
    },
    adapter: (async (config) => ({
      config,
      data: {
        success: true,
        code: "DEV_AUTHENTICATED",
        message: "ok",
        data,
        errors: [],
        meta: {
          timestamp: new Date().toISOString(),
          path: "/api/dev-auth/login",
          requestId: null,
        },
      },
      headers: {},
      status: 200,
      statusText: "OK",
    })) satisfies AxiosAdapter,
  });

describe("DemoAuthSession", () => {
  it("keeps a valid SUPERADMIN token in memory", async () => {
    const session = new DemoAuthSession();
    await session.login(
      createClient({
        accessToken: "local-token",
        tokenType: "Bearer",
        expiresIn: 28_800,
        subject: "local-superadmin",
        email: "admin@logicstic.local",
        tenantId: "local-development",
        roles: ["SUPERADMIN"],
      }),
      {
        username: "admin@logicstic.local",
        password: "Logicstic@2026",
      },
    );

    expect(session.isActive()).toBe(true);
    expect(session.getAccessToken()).toBe("local-token");
    await expect(session.getJwtRoles()).resolves.toEqual(["SUPERADMIN"]);

    await session.clearSession();
    expect(session.isActive()).toBe(false);
    expect(session.getAccessToken()).toBeNull();
  });

  it("rejects a response without a supported backend role", async () => {
    const session = new DemoAuthSession();

    await expect(
      session.login(
        createClient({
          accessToken: "local-token",
          tokenType: "Bearer",
          expiresIn: 28_800,
          subject: "local-user",
          email: "admin@logicstic.local",
          tenantId: "local-development",
          roles: ["UNKNOWN"],
        }),
        { username: "admin@logicstic.local", password: "password" },
      ),
    ).rejects.toThrow("DEV_AUTH_RESPONSE_HAS_NO_SUPPORTED_ROLE");
  });
});
