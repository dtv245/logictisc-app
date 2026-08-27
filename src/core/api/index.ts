/**
 * Exposes the supported API-foundation surface to app and feature modules.
 *
 * Consumers construct the runtime client first, then inject it with explicit
 * resource contracts into the Refine data provider.
 */

export { createApiClient } from "./client";
export {
  createLogisticsDataProvider,
  type ApiResourceDefinition,
  type CreateDataProviderOptions,
  type ResourceUpdateMethod,
} from "./dataProvider";
export {
  readApiResponse,
  readPagedResponse,
} from "./envelope";
export {
  createLatestRequestCoordinator,
  type CoordinatedRequest,
  type LatestRequestCoordinator,
} from "./latestRequest";
export {
  assertRelativeApiPath,
  joinApiItemPath,
  normalizeApiBaseUrl,
} from "./path";
export {
  DEFAULT_LIST_PAGE,
  DEFAULT_LIST_PAGE_SIZE,
  MAX_LIST_PAGE_SIZE,
  normalizePage,
  normalizePageSize,
  serializeCustomQuery,
  serializeListQuery,
  type ListQuerySerializationOptions,
  type QueryParameters,
  type QueryParameterValue,
} from "./querySerializer";
export type {
  AccessTokenProvider,
  ApiAuthenticationMode,
  ApiHealthResponse,
  ApiRequestMetadata,
  ApiResponseMode,
  ApiRuntimeConfig,
  CreateApiClientOptions,
  DownloadRequestConfig,
  LogisticsApiClient,
} from "./types";
