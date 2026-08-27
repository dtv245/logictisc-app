/**
 * Verifies Axios interceptor behavior without introducing production mocks.
 *
 * A test adapter captures the final transport config and returns real contract
 * envelopes, allowing auth/retry/header behavior to be tested deterministically.
 */

import {
  AxiosError,
  AxiosHeaders,
  type AxiosAdapter,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";
import { describe, expect, it, vi } from "vitest";

import { ApiHttpError } from "../errors/httpError";
import { createApiClient } from "./client";

const runtimeConfig = {
  apiBaseUrl: "http://localhost:8080",
  healthPath: "/api/health",
  requestTimeoutMs: 5_000,
};

const createEnvelope = (data: unknown) => ({
  success: true,
  code: "SUCCESS",
  message: "SUCCESS",
  data,
  errors: [],
  meta: {
    timestamp: "2026-07-27T03:00:00Z",
    path: "/api/widgets",
    requestId: "8bb616eb-dcb6-4cb0-a757-0a9427ec914e",
  },
});

const createResponse = (
  config: InternalAxiosRequestConfig,
  data: unknown,
  status = 200,
): AxiosResponse<unknown> => ({
  config,
  data,
  headers: new AxiosHeaders(),
  status,
  statusText: String(status),
});

const rejectResponse = (
  config: InternalAxiosRequestConfig,
  status: number,
  data: unknown,
): never => {
  const response = createResponse(config, data, status);
  throw new AxiosError(
    `HTTP_${status}`,
    AxiosError.ERR_BAD_RESPONSE,
    config,
    {},
    response,
  );
};

const createAdapter = (
  handler: (
    config: InternalAxiosRequestConfig,
  ) => AxiosResponse<unknown> | Promise<AxiosResponse<unknown>>,
): AxiosAdapter => async (config) => handler(config);

describe("createApiClient", () => {
  it("adds a UUID request ID and bearer token, then unwraps the envelope", async () => {
    const observedHeaders: AxiosHeaders[] = [];
    const client = createApiClient({
      runtimeConfig,
      tokenProvider: {
        getAccessToken: () => "access-token",
        refreshAccessToken: async () => "refreshed-token",
      },
      adapter: createAdapter((config) => {
        observedHeaders.push(AxiosHeaders.from(config.headers));
        return createResponse(config, createEnvelope({ id: "widget-1" }));
      }),
    });

    const response = await client.instance.get<{ id: string }>(
      "/api/widgets/widget-1",
    );

    expect(response.data).toEqual({ id: "widget-1" });
    expect(observedHeaders[0]?.get("Authorization")).toBe(
      "Bearer access-token",
    );
    expect(observedHeaders[0]?.get("Accept")).toBe(
      "application/json",
    );
    expect(observedHeaders[0]?.get("X-Request-Id")).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });

  it("keeps health and download responses raw and never authenticates health", async () => {
    const observations: Array<{
      authorization: unknown;
      responseType: string | undefined;
      url: string | undefined;
    }> = [];
    const healthBody = {
      status: "UP",
      application: "logictics_api",
      profiles: "local",
      database: "enabled",
    };
    const downloadBody = new Blob(["document"]);

    const client = createApiClient({
      runtimeConfig,
      tokenProvider: {
        getAccessToken: () => "access-token",
        refreshAccessToken: async () => "refreshed-token",
      },
      adapter: createAdapter((config) => {
        observations.push({
          authorization: config.headers.get("Authorization"),
          responseType: config.responseType,
          url: config.url,
        });

        return createResponse(
          config,
          config.url === "/api/health" ? healthBody : downloadBody,
        );
      }),
    });

    const healthResponse = await client.health();
    const downloadResponse = await client.download({
      path: "/api/documents/document-1/download",
    });

    expect(healthResponse.data).toEqual(healthBody);
    expect(downloadResponse.data).toBe(downloadBody);
    expect(observations).toEqual([
      {
        authorization: undefined,
        responseType: undefined,
        url: "/api/health",
      },
      {
        authorization: "Bearer access-token",
        responseType: "blob",
        url: "/api/documents/document-1/download",
      },
    ]);
  });

  it("removes a manually supplied multipart content type", async () => {
    let observedContentType: unknown;
    const client = createApiClient({
      runtimeConfig,
      tokenProvider: {
        getAccessToken: () => "access-token",
        refreshAccessToken: async () => "refreshed-token",
      },
      adapter: createAdapter((config) => {
        observedContentType = config.headers.get("Content-Type");
        return createResponse(
          config,
          createEnvelope({ id: "document-1" }),
        );
      }),
    });
    const formData = new FormData();
    formData.append("file", new Blob(["document"]), "document.txt");

    await client.instance.post("/api/documents", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    expect(observedContentType).not.toBe("multipart/form-data");
  });

  it("shares one refresh across concurrent 401 responses and replays once", async () => {
    let currentToken = "expired-token";
    const observations: Array<{
      authorization: unknown;
      requestId: unknown;
    }> = [];
    const refreshAccessToken = vi.fn(async () => {
      currentToken = "fresh-token";
      return currentToken;
    });
    const onRefreshFailure = vi.fn();

    const client = createApiClient({
      runtimeConfig,
      tokenProvider: {
        getAccessToken: () => currentToken,
        refreshAccessToken,
        onRefreshFailure,
      },
      adapter: createAdapter((config) => {
        const authorization = config.headers.get("Authorization");
        observations.push({
          authorization,
          requestId: config.headers.get("X-Request-Id"),
        });

        if (authorization === "Bearer expired-token") {
          return rejectResponse(config, 401, {
            success: false,
            code: "UNAUTHENTICATED",
            message: "UNAUTHENTICATED",
            data: null,
            errors: [],
            meta: {
              timestamp: "2026-07-27T03:00:00Z",
              path: config.url ?? "",
              requestId: "backend-request-id",
            },
          });
        }

        return createResponse(
          config,
          createEnvelope({ id: config.url }),
        );
      }),
    });

    const responses = await Promise.all([
      client.instance.get("/api/widgets/widget-1"),
      client.instance.get("/api/widgets/widget-2"),
    ]);

    expect(responses).toHaveLength(2);
    expect(refreshAccessToken).toHaveBeenCalledOnce();
    expect(onRefreshFailure).not.toHaveBeenCalled();
    expect(observations).toHaveLength(4);
    expect(
      observations.filter(
        ({ authorization }) =>
          authorization === "Bearer fresh-token",
      ),
    ).toHaveLength(2);
    expect(
      new Set(observations.map(({ requestId }) => requestId)).size,
    ).toBe(4);
  });

  it("does not refresh a 403 response", async () => {
    const refreshAccessToken = vi.fn(async () => "fresh-token");
    const client = createApiClient({
      runtimeConfig,
      tokenProvider: {
        getAccessToken: () => "access-token",
        refreshAccessToken,
      },
      adapter: createAdapter((config) =>
        rejectResponse(config, 403, {
          success: false,
          code: "ACCESS_DENIED",
          message: "ACCESS_DENIED",
          data: null,
          errors: [],
          meta: {
            timestamp: "2026-07-27T03:00:00Z",
            path: config.url ?? "",
            requestId: "forbidden-request-id",
          },
        }),
      ),
    });

    await expect(
      client.instance.get("/api/widgets/widget-1"),
    ).rejects.toMatchObject({
      statusCode: 403,
      code: "ACCESS_DENIED",
      requestId: "forbidden-request-id",
    });
    expect(refreshAccessToken).not.toHaveBeenCalled();
  });

  it("retries a persistent 401 only once", async () => {
    let requestCount = 0;
    const refreshAccessToken = vi.fn(async () => "fresh-token");
    const client = createApiClient({
      runtimeConfig,
      tokenProvider: {
        getAccessToken: () => "expired-token",
        refreshAccessToken,
      },
      adapter: createAdapter((config) => {
        requestCount += 1;
        return rejectResponse(config, 401, {
          success: false,
          code: "UNAUTHENTICATED",
          message: "UNAUTHENTICATED",
          data: null,
          errors: [],
          meta: {
            timestamp: "2026-07-27T03:00:00Z",
            path: config.url ?? "",
            requestId: "unauthenticated-request-id",
          },
        });
      }),
    });

    await expect(
      client.instance.get("/api/widgets/widget-1"),
    ).rejects.toBeInstanceOf(ApiHttpError);
    expect(refreshAccessToken).toHaveBeenCalledOnce();
    expect(requestCount).toBe(2);
  });
});
