import type { LogisticsApiClient } from "./apiClient.types";

export type ResourceUpdateMethod = "put" | "patch";

export interface ApiResourceDefinition {
  collectionPath: string;
  allowedFilterFields: readonly string[];
  allowedSortFields: readonly string[];
  updateMethod?: ResourceUpdateMethod;
  mutationContract?: ResourceMutationContract;
  allowGenericMutation?: boolean;
  canMutateRecord?: (value: unknown) => boolean;
}

export interface CreateDataProviderOptions {
  apiClient: LogisticsApiClient;
  resources: Readonly<Record<string, ApiResourceDefinition>>;
}

export interface ResourceMutationContract {
  createFields: readonly string[];
  updateFields: readonly string[];
  requiredCreate: readonly string[];
  requiredUpdate: readonly string[];
  versioned: boolean;
}

/**
 * Cancels stale list/search requests without discarding Refine cancellation.
 *
 * A newer request for the same resource aborts the previous transport, while
 * the upstream TanStack Query signal can still abort the current request.
 */

export interface CoordinatedRequest {
  signal: AbortSignal;
  release: () => void;
}

export interface LatestRequestCoordinator {
  begin: (
    key: string,
    upstreamSignal?: AbortSignal,
  ) => CoordinatedRequest;
  cancel: (key: string) => void;
  cancelAll: () => void;
}
