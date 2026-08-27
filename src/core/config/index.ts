/**
 * Public API for validated deployment configuration and API availability.
 */

export {
  RuntimeConfigProvider,
  type RuntimeConfigProviderProps,
} from "./RuntimeConfigProvider";
export {
  probeHealth,
  type HealthProbeResult,
  type HealthResponse,
} from "./healthProbe";
export { loadRuntimeConfig } from "./loadRuntimeConfig";
export {
  parseRuntimeConfig,
  runtimeConfigSchema,
} from "./runtimeConfigSchema";
export {
  RuntimeConfigError,
  type OAuthRuntimeConfig,
  type RuntimeConfig,
  type RuntimeConfigErrorCode,
  type SupportedLocale,
} from "./types";
export { useRuntimeConfig } from "./useRuntimeConfig";
