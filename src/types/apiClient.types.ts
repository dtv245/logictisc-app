/**
 * Defines dependency-injection boundaries for the API client.
 *
 * Runtime configuration and token lifecycle stay outside the transport layer,
 * so the client neither reads build-time environment variables nor owns auth
 * persistence.
 */

import type {
  AxiosAdapter,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
} from "axios";

export interface ApiRuntimeConfig {
  apiBaseUrl: string;
  healthPath: string;
  requestTimeoutMs: number;
}

export interface AccessTokenProvider {
  getAccessToken: () => string | null | Promise<string | null>;
  refreshAccessToken: () => Promise<string | null>;
  onRefreshFailure?: (reason: unknown) => void | Promise<void>;
}

export type ApiAuthenticationMode = "required" | "none";

export type ApiResponseMode = "envelope" | "raw";

export interface ApiRequestMetadata {
  authentication?: ApiAuthenticationMode;
  responseMode?: ApiResponseMode;
  retryCount?: number;
}

declare module "axios" {
  interface AxiosRequestConfig {
    logistics?: ApiRequestMetadata;
  }

  interface InternalAxiosRequestConfig {
    logistics?: ApiRequestMetadata;
  }
}

export interface ApiHealthResponse {
  status: string;
  application: string;
  profiles: string;
  database: string;
}

export interface DownloadRequestConfig
  extends Omit<
    AxiosRequestConfig,
    "baseURL" | "data" | "method" | "responseType" | "url"
  > {
  path: string;
}

export interface LogisticsApiClient {
  readonly instance: AxiosInstance;
  getApiUrl: () => string;
  health: <THealth extends ApiHealthResponse = ApiHealthResponse>(
    config?: Omit<
      AxiosRequestConfig,
      "baseURL" | "data" | "method" | "responseType" | "url"
    >,
  ) => Promise<AxiosResponse<THealth>>;
  download: (
    config: DownloadRequestConfig,
  ) => Promise<AxiosResponse<Blob>>;
}

export interface CreateApiClientOptions {
  runtimeConfig: ApiRuntimeConfig;
  tokenProvider: AccessTokenProvider;
  adapter?: AxiosAdapter;
}
