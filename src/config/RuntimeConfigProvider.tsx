/**
 * Cung cấp runtime config đã validate cho toàn bộ provider của ứng dụng.
 */

import type { PropsWithChildren } from "react";

import { RuntimeConfigContext } from "./runtimeConfigContext";
import type { RuntimeConfig } from "./types";

export interface RuntimeConfigProviderProps extends PropsWithChildren {
  config: RuntimeConfig;
}

export function RuntimeConfigProvider({
  children,
  config,
}: RuntimeConfigProviderProps) {
  return (
    <RuntimeConfigContext.Provider value={config}>
      {children}
    </RuntimeConfigContext.Provider>
  );
}
