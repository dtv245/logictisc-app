/**
 * Verifies bootstrap sequencing, fail-closed recovery and async cleanup.
 */

import {
  RuntimeConfigError,
  type HealthProbeResult,
  type RuntimeConfig,
} from "@core/config";
import {
  act,
  renderHook,
  waitFor,
} from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useAppBootstrap } from "./useAppBootstrap";

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

const healthyResult: HealthProbeResult = {
  health: {
    application: "logicstic",
    database: "enabled",
    profiles: "test",
    status: "UP",
  },
  kind: "healthy",
  requestId: "request-ready",
};

interface Deferred<T> {
  promise: Promise<T>;
  resolve: (value: T) => void;
}

function createDeferred<T>(): Deferred<T> {
  let resolvePromise: ((value: T) => void) | undefined;
  const promise = new Promise<T>((resolve) => {
    resolvePromise = resolve;
  });

  return {
    promise,
    resolve(value) {
      resolvePromise?.(value);
    },
  };
}

describe("useAppBootstrap", () => {
  it("loads config, applies locale and probes health in order", async () => {
    const order: string[] = [];
    const loadConfig = vi.fn(async () => {
      order.push("config");
      return config;
    });
    const applyLocale = vi.fn(async () => {
      order.push("locale");
    });
    const probeApiHealth = vi.fn(async () => {
      order.push("health");
      return healthyResult;
    });

    const { result } = renderHook(() =>
      useAppBootstrap({
        applyLocale,
        loadConfig,
        probeApiHealth,
      }),
    );

    await waitFor(() => {
      expect(result.current.state.kind).toBe("ready");
    });

    expect(order).toEqual(["config", "locale", "health"]);
    expect(applyLocale).toHaveBeenCalledWith("vi");
    expect(result.current.isRetrying).toBe(false);
  });

  it("does not probe health when runtime config fails", async () => {
    const error = new RuntimeConfigError(
      "CONFIG_MISSING",
      "Runtime config missing",
    );
    const probeApiHealth = vi.fn(async () => healthyResult);

    const { result } = renderHook(() =>
      useAppBootstrap({
        applyLocale: vi.fn(),
        loadConfig: vi.fn(async () => {
          throw error;
        }),
        probeApiHealth,
      }),
    );

    await waitFor(() => {
      expect(result.current.state.kind).toBe("config-error");
    });

    expect(probeApiHealth).not.toHaveBeenCalled();
    expect(result.current.state).toMatchObject({
      error,
      kind: "config-error",
    });
  });

  it("retries once, keeps the failure visible and blocks duplicate retry", async () => {
    const error = new RuntimeConfigError(
      "CONFIG_FETCH_FAILED",
      "Runtime config unavailable",
    );
    const retryConfig = createDeferred<RuntimeConfig>();
    const loadConfig = vi
      .fn<(signal: AbortSignal) => Promise<RuntimeConfig>>()
      .mockRejectedValueOnce(error)
      .mockImplementationOnce(async () => retryConfig.promise);

    const { result } = renderHook(() =>
      useAppBootstrap({
        applyLocale: vi.fn(),
        loadConfig,
        probeApiHealth: vi.fn(async () => healthyResult),
      }),
    );

    await waitFor(() => {
      expect(result.current.state.kind).toBe("config-error");
    });

    act(() => {
      result.current.retry();
      result.current.retry();
    });

    expect(result.current.isRetrying).toBe(true);
    expect(result.current.state.kind).toBe("config-error");

    act(() => {
      retryConfig.resolve(config);
    });

    await waitFor(() => {
      expect(result.current.state.kind).toBe("ready");
    });

    expect(loadConfig).toHaveBeenCalledTimes(2);
    expect(result.current.isRetrying).toBe(false);
  });

  it("aborts the active request when unmounted", () => {
    let observedSignal: AbortSignal | undefined;
    const pendingConfig = createDeferred<RuntimeConfig>();

    const { unmount } = renderHook(() =>
      useAppBootstrap({
        applyLocale: vi.fn(),
        loadConfig: (signal) => {
          observedSignal = signal;
          return pendingConfig.promise;
        },
        probeApiHealth: vi.fn(async () => healthyResult),
      }),
    );

    expect(observedSignal?.aborted).toBe(false);
    unmount();
    expect(observedSignal?.aborted).toBe(true);
  });

  it("ignores a stale health completion after a newer run succeeds", async () => {
    const firstHealth = createDeferred<HealthProbeResult>();
    const secondHealth = createDeferred<HealthProbeResult>();
    const probeApiHealth = vi
      .fn<
        (
          config: RuntimeConfig,
          signal: AbortSignal,
        ) => Promise<HealthProbeResult>
      >()
      .mockImplementationOnce(async () => firstHealth.promise)
      .mockImplementationOnce(async () => secondHealth.promise);

    const { result } = renderHook(() =>
      useAppBootstrap({
        applyLocale: vi.fn(),
        loadConfig: vi.fn(async () => config),
        probeApiHealth,
      }),
    );

    await waitFor(() => {
      expect(probeApiHealth).toHaveBeenCalledTimes(1);
    });

    act(() => {
      result.current.retry();
    });

    await waitFor(() => {
      expect(probeApiHealth).toHaveBeenCalledTimes(2);
    });

    act(() => {
      secondHealth.resolve(healthyResult);
    });

    await waitFor(() => {
      expect(result.current.state.kind).toBe("ready");
    });

    act(() => {
      firstHealth.resolve({
        kind: "cors-blocked",
        requestId: "request-stale",
      });
    });

    await waitFor(() => {
      expect(result.current.state.kind).toBe("ready");
    });
  });

  it("normalizes an unexpected locale initialization failure", async () => {
    const probeApiHealth = vi.fn(async () => healthyResult);

    const { result } = renderHook(() =>
      useAppBootstrap({
        applyLocale: vi.fn(async () => {
          throw new Error("Locale failed");
        }),
        loadConfig: vi.fn(async () => config),
        probeApiHealth,
      }),
    );

    await waitFor(() => {
      expect(result.current.state.kind).toBe("config-error");
    });

    expect(result.current.state).toMatchObject({
      error: {
        code: "CONFIG_FETCH_FAILED",
        message: "Application bootstrap failed.",
      },
      kind: "config-error",
    });
    expect(probeApiHealth).not.toHaveBeenCalled();
  });
});
