/**
 * Verifies that validated deployment configuration crosses the React provider
 * boundary without copying or replacing its values.
 */

import { renderHook } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { describe, expect, it } from "vitest";

import { RuntimeConfigProvider } from "./RuntimeConfigProvider";
import type { RuntimeConfig } from "./types";
import { useRuntimeConfig } from "./useRuntimeConfig";

const runtimeConfig: RuntimeConfig = {
  apiBaseUrl: "https://api.example.test",
  appName: "Logistics TMS",
  defaultLocale: "vi",
  environment: "test",
  featureFlags: {
    messaging: false,
  },
  identityBaseUrl: "https://identity.example.test",
  oauth: {
    audience: "logisticsx.api",
    clientId: "logistics-spa",
    clockSkewSeconds: 60,
    issuer: "https://identity.example.test",
    jwksUri: "https://identity.example.test/jwks",
    postLogoutRedirectUri: "https://app.example.test/login",
    redirectUri: "https://app.example.test/auth/callback",
    scopes: ["openid", "profile"],
  },
  requestTimeoutMs: 15_000,
};

describe("RuntimeConfigProvider", () => {
  it("exposes the validated runtime object to consumers", () => {
    const wrapper = ({ children }: PropsWithChildren) => (
      <RuntimeConfigProvider config={runtimeConfig}>
        {children}
      </RuntimeConfigProvider>
    );

    const { result } = renderHook(() => useRuntimeConfig(), { wrapper });

    expect(result.current).toBe(runtimeConfig);
  });
});
