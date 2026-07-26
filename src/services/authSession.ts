/**
 * Quản lý token response mapping và refresh request đơn nhất.
 */

import axios from "axios";

import { env } from "../config/env";
import { ApiHttpError, normalizeApiError } from "./http/errors";
import { tokenStore } from "./tokenStore";

interface TokenPayload {
  accessToken?: unknown;
  access_token?: unknown;
  jwt?: unknown;
  token?: unknown;
}

let refreshRequest: Promise<string> | null = null;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const unwrapResult = (value: unknown): unknown => {
  if (isRecord(value) && "result" in value) {
    return value.result;
  }

  if (isRecord(value) && "data" in value && isRecord(value.data)) {
    return value.data;
  }

  return value;
};

export const readAccessToken = (responseData: unknown): string => {
  const payload = unwrapResult(responseData);

  if (!isRecord(payload)) {
    throw new ApiHttpError(500, "Response xác thực không hợp lệ.");
  }

  const tokenPayload: TokenPayload = payload;
  const token =
    tokenPayload.accessToken ??
    tokenPayload.access_token ??
    tokenPayload.token ??
    tokenPayload.jwt;

  if (typeof token !== "string" || token.length === 0) {
    throw new ApiHttpError(
      500,
      "Response xác thực không chứa access token.",
    );
  }

  return token;
};

/**
 * Uses a dedicated Axios call so a failed refresh never recursively triggers
 * the main client's response interceptor.
 */
export const refreshAccessToken = async (): Promise<string> => {
  if (!refreshRequest) {
    const refreshPath = env.authRefreshPath.startsWith("/")
      ? env.authRefreshPath
      : `/${env.authRefreshPath}`;

    refreshRequest = axios
      .post<unknown>(
        `${env.apiBaseUrl}${refreshPath}`,
        undefined,
        {
          headers: { Accept: "application/json" },
          timeout: 30_000,
          withCredentials: true,
        },
      )
      .then((response) => {
        const token = readAccessToken(response.data);
        tokenStore.set(token);
        return token;
      })
      .catch((error: unknown) => {
        tokenStore.clear();
        throw normalizeApiError(error);
      })
      .finally(() => {
        refreshRequest = null;
      });
  }

  return refreshRequest;
};
