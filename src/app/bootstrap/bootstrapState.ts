/**
 * Defines the fail-closed application bootstrap state and maps the public
 * health probe into an explicit navigation decision.
 */

import type {
  HealthProbeResult,
  HealthResponse,
  RuntimeConfig,
  RuntimeConfigError,
} from "@core/config";

interface ConfiguredBootstrapState {
  config: RuntimeConfig;
}

interface ProbedBootstrapState extends ConfiguredBootstrapState {
  requestId: string;
}

export type AppBootstrapState =
  | {
      kind: "loading-config";
    }
  | {
      error: RuntimeConfigError;
      kind: "config-error";
    }
  | (ConfiguredBootstrapState & {
      kind: "probing-health";
    })
  | (ProbedBootstrapState & {
      kind: "api-unreachable";
    })
  | (ProbedBootstrapState & {
      kind: "cors-blocked";
    })
  | (ProbedBootstrapState & {
      health?: HealthResponse;
      httpStatus?: number;
      kind: "api-unhealthy";
    })
  | (ProbedBootstrapState & {
      health: HealthResponse;
      kind: "database-disabled";
    })
  | (ProbedBootstrapState & {
      health: HealthResponse;
      kind: "ready";
    });

export const initialAppBootstrapState: AppBootstrapState = {
  kind: "loading-config",
};

export function createConfigErrorState(
  error: RuntimeConfigError,
): AppBootstrapState {
  return {
    error,
    kind: "config-error",
  };
}

export function createHealthProbeState(
  config: RuntimeConfig,
): AppBootstrapState {
  return {
    config,
    kind: "probing-health",
  };
}

export function resolveHealthProbeState(
  config: RuntimeConfig,
  result: HealthProbeResult,
): AppBootstrapState {
  switch (result.kind) {
    case "cors-blocked":
      return {
        config,
        kind: "cors-blocked",
        requestId: result.requestId,
      };
    case "unreachable":
      return {
        config,
        kind: "api-unreachable",
        requestId: result.requestId,
      };
    case "unhealthy":
      return {
        config,
        ...(result.health ? { health: result.health } : {}),
        ...(result.httpStatus !== undefined
          ? { httpStatus: result.httpStatus }
          : {}),
        kind: "api-unhealthy",
        requestId: result.requestId,
      };
    case "healthy": {
      const database = result.health.database.trim().toLowerCase();

      if (database === "disabled") {
        return {
          config,
          health: result.health,
          kind: "database-disabled",
          requestId: result.requestId,
        };
      }

      if (database !== "enabled") {
        return {
          config,
          health: result.health,
          kind: "api-unhealthy",
          requestId: result.requestId,
        };
      }

      return {
        config,
        health: result.health,
        kind: "ready",
        requestId: result.requestId,
      };
    }
  }
}
