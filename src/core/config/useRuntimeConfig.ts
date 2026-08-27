/**
 * Reads the validated runtime configuration from the application bootstrap.
 *
 * Consumers fail immediately when mounted outside the provider so no feature
 * can silently fall back to a hard-coded endpoint.
 */

import { useContext } from "react";

import { RuntimeConfigContext } from "./runtimeConfigContext";
import type { RuntimeConfig } from "./types";

export function useRuntimeConfig(): RuntimeConfig {
  const config = useContext(RuntimeConfigContext);

  if (!config) {
    throw new Error("RuntimeConfigProvider is missing.");
  }

  return config;
}
