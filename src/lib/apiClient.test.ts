import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createApiClient } from "@/providers/api/apiClient";
import type { LogisticsApiClient } from "@/types/apiClient.types";

const createClient = (): LogisticsApiClient =>
  createApiClient({
    runtimeConfig: {
      apiBaseUrl: "http://localhost:8080/api",
      healthPath: "/api/health",
      requestTimeoutMs: 1000,
    },
    tokenProvider: {
      getAccessToken: () => "test-token",
      refreshAccessToken: async () => "test-token",
    },
  });

const loadHolder = async () => {
  vi.resetModules();
  return import("@/lib/apiClient");
};

beforeEach(() => {
  vi.resetModules();
});

describe("logistics API client holder", () => {
  it("throws a named error when read before initialization", async () => {
    const { getLogisticsApiClient } = await loadHolder();

    expect(() => getLogisticsApiClient()).toThrowError(
      /AI_DISPATCH_API_CLIENT_NOT_READY/,
    );
  });

  it("returns the exact client that was registered", async () => {
    const { getLogisticsApiClient, setLogisticsApiClient } = await loadHolder();
    const client = createClient();

    setLogisticsApiClient(client);

    expect(getLogisticsApiClient()).toBe(client);
    expect(getLogisticsApiClient().instance).toBe(client.instance);
  });

  it("accepts the same client more than once without replacing it", async () => {
    const { getLogisticsApiClient, setLogisticsApiClient } = await loadHolder();
    const client = createClient();

    setLogisticsApiClient(client);
    setLogisticsApiClient(client);

    expect(getLogisticsApiClient()).toBe(client);
  });

  it("replaces the client when a new one is registered", async () => {
    const { getLogisticsApiClient, setLogisticsApiClient } = await loadHolder();
    const first = createClient();
    const second = createClient();

    setLogisticsApiClient(first);
    setLogisticsApiClient(second);

    expect(getLogisticsApiClient()).toBe(second);
    expect(getLogisticsApiClient()).not.toBe(first);
  });
});

describe("aiDispatchMock environment flag", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("defaults to false when the variable is absent", async () => {
    vi.stubEnv("VITE_AI_DISPATCH_MOCK", undefined);
    vi.resetModules();

    const { env } = await import("@/config/env");

    expect(env.aiDispatchMock).toBe(false);
  });

  it("parses the literal true", async () => {
    vi.stubEnv("VITE_AI_DISPATCH_MOCK", "true");
    vi.resetModules();

    const { env } = await import("@/config/env");

    expect(env.aiDispatchMock).toBe(true);
  });

  it("parses the literal false", async () => {
    vi.stubEnv("VITE_AI_DISPATCH_MOCK", "false");
    vi.resetModules();

    const { env } = await import("@/config/env");

    expect(env.aiDispatchMock).toBe(false);
  });

  it("rejects any other value", async () => {
    vi.stubEnv("VITE_AI_DISPATCH_MOCK", "yes");
    vi.resetModules();

    await expect(import("@/config/env")).rejects.toThrowError(
      /VITE_AI_DISPATCH_MOCK/,
    );
  });
});
