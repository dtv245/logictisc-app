/**
 * Verifies that the bootstrap policy never mounts the application unless both
 * the public health response and database readiness are explicitly healthy.
 */

import { RuntimeConfigError, type RuntimeConfig } from "@core/config";
import { describe, expect, it } from "vitest";

import {
  createConfigErrorState,
  createHealthProbeState,
  initialAppBootstrapState,
  resolveHealthProbeState,
} from "./bootstrapState";

const config: RuntimeConfig = {
  apiBaseUrl: "https://api.example.test",
  appName: "Logistics TMS",
  defaultLocale: "vi",
  environment: "test",
  featureFlags: {},
  identityBaseUrl: "https://identity.example.test",
  oauth: {
    audience: "logisticsx.api",
    clientId: "spa",
    clockSkewSeconds: 60,
    issuer: "https://identity.example.test",
    jwksUri: "https://identity.example.test/jwks",
    postLogoutRedirectUri: "https://app.example.test/login",
    redirectUri: "https://app.example.test/auth/callback",
    scopes: ["openid"],
  },
  requestTimeoutMs: 15_000,
};

const enabledHealth = {
  application: "logicstic",
  database: "enabled",
  profiles: "test",
  status: "UP",
};

describe("bootstrapState", () => {
  it("starts by loading runtime configuration", () => {
    expect(initialAppBootstrapState).toEqual({
      kind: "loading-config",
    });
  });

  it("preserves a normalized runtime configuration error", () => {
    const error = new RuntimeConfigError(
      "CONFIG_INVALID",
      "Invalid config",
      ["apiBaseUrl: Invalid URL"],
    );

    expect(createConfigErrorState(error)).toEqual({
      error,
      kind: "config-error",
    });
  });

  it("keeps validated configuration while probing health", () => {
    expect(createHealthProbeState(config)).toEqual({
      config,
      kind: "probing-health",
    });
  });

  it("allows readiness only when the database is explicitly enabled", () => {
    expect(
      resolveHealthProbeState(config, {
        health: enabledHealth,
        kind: "healthy",
        requestId: "request-ready",
      }),
    ).toEqual({
      config,
      health: enabledHealth,
      kind: "ready",
      requestId: "request-ready",
    });
  });

  it("blocks readiness when the backend reports database disabled", () => {
    const health = {
      ...enabledHealth,
      database: "disabled",
      profiles: "nodb",
    };

    expect(
      resolveHealthProbeState(config, {
        health,
        kind: "healthy",
        requestId: "request-disabled",
      }),
    ).toEqual({
      config,
      health,
      kind: "database-disabled",
      requestId: "request-disabled",
    });
  });

  it("fails closed when the database state is unknown", () => {
    const health = {
      ...enabledHealth,
      database: "unknown",
    };

    expect(
      resolveHealthProbeState(config, {
        health,
        kind: "healthy",
        requestId: "request-unknown",
      }),
    ).toEqual({
      config,
      health,
      kind: "api-unhealthy",
      requestId: "request-unknown",
    });
  });

  it("preserves unhealthy response diagnostics", () => {
    const health = {
      ...enabledHealth,
      status: "DOWN",
    };

    expect(
      resolveHealthProbeState(config, {
        health,
        httpStatus: 503,
        kind: "unhealthy",
        requestId: "request-down",
      }),
    ).toEqual({
      config,
      health,
      httpStatus: 503,
      kind: "api-unhealthy",
      requestId: "request-down",
    });
  });

  it.each([
    {
      expectedKind: "cors-blocked",
      probeKind: "cors-blocked",
    },
    {
      expectedKind: "api-unreachable",
      probeKind: "unreachable",
    },
  ] as const)(
    "maps $probeKind to $expectedKind without enabling navigation",
    ({ expectedKind, probeKind }) => {
      expect(
        resolveHealthProbeState(config, {
          kind: probeKind,
          requestId: `request-${probeKind}`,
        }),
      ).toEqual({
        config,
        kind: expectedKind,
        requestId: `request-${probeKind}`,
      });
    },
  );
});
