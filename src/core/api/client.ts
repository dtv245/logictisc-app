/**
 * Creates the single Axios transport used by Logistics API integrations.
 *
 * Interceptors add correlation/auth headers, unwrap successful envelopes, and
 * coordinate one refresh/replay attempt without refreshing forbidden requests.
 */

import axios, {
  AxiosHeaders,
  type AxiosError,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";

import {
  ApiHttpError,
  normalizeHttpError,
  toRefineHttpError,
} from "../errors/httpError";
import { readApiResponse } from "./envelope";
import {
  assertRelativeApiPath,
  normalizeApiBaseUrl,
} from "./path";
import type {
  AccessTokenProvider,
  CreateApiClientOptions,
  LogisticsApiClient,
} from "./types";

const isFormDataPayload = (value: unknown): value is FormData =>
  typeof FormData !== "undefined" && value instanceof FormData;

const normalizeToken = (value: string | null): string | null => {
  const token = value?.trim();
  return token ? token : null;
};

const readBearerToken = (
  config: InternalAxiosRequestConfig | undefined,
): string | null => {
  const authorization = config?.headers.get("Authorization");
  if (typeof authorization !== "string") {
    return null;
  }

  const match = /^Bearer\s+(.+)$/i.exec(authorization);
  return normalizeToken(match?.[1] ?? null);
};

const createRefreshCoordinator = (
  tokenProvider: AccessTokenProvider,
): (() => Promise<string | null>) => {
  let inFlight: Promise<string | null> | null = null;

  return async (): Promise<string | null> => {
    if (inFlight) {
      return inFlight;
    }

    const refreshOperation = async (): Promise<string | null> => {
      let token: string | null;

      try {
        token = normalizeToken(
          await tokenProvider.refreshAccessToken(),
        );
      } catch (reason) {
        await tokenProvider.onRefreshFailure?.(reason);
        throw reason;
      }

      if (!token) {
        const reason = new Error("TOKEN_REFRESH_RETURNED_NO_TOKEN");
        await tokenProvider.onRefreshFailure?.(reason);
      }

      return token;
    };

    inFlight = refreshOperation().finally(() => {
      inFlight = null;
    });

    return inFlight;
  };
};

const validateRuntimeConfig = (
  options: CreateApiClientOptions,
): {
  apiBaseUrl: string;
  healthPath: string;
  requestTimeoutMs: number;
} => {
  const { runtimeConfig } = options;

  if (
    !Number.isFinite(runtimeConfig.requestTimeoutMs) ||
    runtimeConfig.requestTimeoutMs <= 0
  ) {
    throw new Error("INVALID_API_REQUEST_TIMEOUT");
  }

  return {
    apiBaseUrl: normalizeApiBaseUrl(runtimeConfig.apiBaseUrl),
    healthPath: assertRelativeApiPath(runtimeConfig.healthPath),
    requestTimeoutMs: runtimeConfig.requestTimeoutMs,
  };
};

export const createApiClient = (
  options: CreateApiClientOptions,
): LogisticsApiClient => {
  const runtimeConfig = validateRuntimeConfig(options);
  const refreshAccessToken = createRefreshCoordinator(
    options.tokenProvider,
  );

  const instance = axios.create({
    baseURL: runtimeConfig.apiBaseUrl,
    allowAbsoluteUrls: false,
    timeout: runtimeConfig.requestTimeoutMs,
    withCredentials: false,
    ...(options.adapter ? { adapter: options.adapter } : {}),
    headers: {
      Accept: "application/json",
    },
  });

  instance.interceptors.request.use(
    async (config): Promise<InternalAxiosRequestConfig> => {
      config.headers = AxiosHeaders.from(config.headers);
      config.headers.set("Accept", "application/json");
      config.headers.set("X-Request-Id", globalThis.crypto.randomUUID());

      // Axios/browser must create the multipart boundary. Removing a caller's
      // generic content type prevents an invalid boundary-free upload.
      if (isFormDataPayload(config.data)) {
        config.headers.delete("Content-Type");
      }

      const authentication =
        config.logistics?.authentication ?? "required";
      if (authentication === "none") {
        config.headers.delete("Authorization");
        return config;
      }

      const replayToken =
        (config.logistics?.retryCount ?? 0) > 0
          ? readBearerToken(config)
          : null;
      const accessToken =
        replayToken ??
        normalizeToken(
          await options.tokenProvider.getAccessToken(),
        );

      if (accessToken) {
        config.headers.set("Authorization", `Bearer ${accessToken}`);
      } else {
        config.headers.delete("Authorization");
      }

      return config;
    },
  );

  instance.interceptors.response.use(
    (response: AxiosResponse<unknown>): AxiosResponse<unknown> => {
      if (response.config.logistics?.responseMode === "raw") {
        return response;
      }

      const envelope = readApiResponse(response.data);
      if (!envelope) {
        throw new ApiHttpError({
          statusCode: 500,
          code: "INVALID_API_RESPONSE",
          message: "INVALID_API_RESPONSE",
          requestId: null,
        });
      }

      if (!envelope.success) {
        throw toRefineHttpError(response.status, envelope);
      }

      response.data = envelope.data;
      return response;
    },
    async (reason: unknown): Promise<AxiosResponse<unknown>> => {
      if (axios.isCancel(reason)) {
        throw reason;
      }

      if (!axios.isAxiosError(reason)) {
        throw normalizeHttpError(reason);
      }

      const error: AxiosError<unknown> = reason;
      const statusCode = error.response?.status;
      const config = error.config;
      const authentication =
        config?.logistics?.authentication ?? "required";
      const retryCount = config?.logistics?.retryCount ?? 0;

      if (
        statusCode !== 401 ||
        authentication === "none" ||
        retryCount >= 1 ||
        !config
      ) {
        throw normalizeHttpError(error);
      }

      const failedToken = readBearerToken(config);
      const currentToken = normalizeToken(
        await options.tokenProvider.getAccessToken(),
      );

      let replayToken: string | null;

      // A concurrent request may already have refreshed the token before this
      // 401 was handled. Reusing that newer token avoids a second refresh.
      if (currentToken && currentToken !== failedToken) {
        replayToken = currentToken;
      } else {
        try {
          replayToken = await refreshAccessToken();
        } catch {
          throw normalizeHttpError(error);
        }
      }

      if (!replayToken) {
        throw normalizeHttpError(error);
      }

      config.logistics = {
        ...config.logistics,
        retryCount: 1,
      };
      config.headers = AxiosHeaders.from(config.headers);
      config.headers.set(
        "Authorization",
        `Bearer ${replayToken}`,
      );

      return instance.request<unknown>(config);
    },
  );

  return {
    instance,
    getApiUrl: () => runtimeConfig.apiBaseUrl,
    health: (config = {}) =>
      instance.get(runtimeConfig.healthPath, {
        ...config,
        logistics: {
          authentication: "none",
          responseMode: "raw",
        },
      }),
    download: ({ path, ...config }) =>
      instance.get(assertRelativeApiPath(path), {
        ...config,
        responseType: "blob",
        logistics: {
          authentication: "required",
          responseMode: "raw",
        },
      }),
  };
};
