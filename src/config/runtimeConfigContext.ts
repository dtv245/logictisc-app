/**
 * Internal React context for the validated deployment configuration.
 *
 * Keeping the context outside the provider component preserves Vite Fast
 * Refresh boundaries while allowing the public hook to fail closed.
 */

import { createContext } from "react";

import type { RuntimeConfig } from "./types";

export const RuntimeConfigContext = createContext<RuntimeConfig | null>(null);
