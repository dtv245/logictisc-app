/**
 * Tải file cấu hình có thể được thay thế lúc deploy mà không rebuild bundle.
 */

import { ZodError } from "zod";

import { parseRuntimeConfig } from "./runtimeConfigSchema";
import {
  RuntimeConfigError,
  type RuntimeConfig,
} from "./types";

interface LoadRuntimeConfigOptions {
  fetcher?: typeof fetch;
  signal?: AbortSignal;
  url?: string;
}

function defaultConfigUrl(): string {
  // BASE_URL giữ đường dẫn đúng khi ứng dụng được deploy dưới sub-path.
  return `${import.meta.env.BASE_URL}runtime-config.json`;
}

function getEnvApiBaseUrl(): string | undefined {
  const envUrl = import.meta.env?.VITE_API_BASE_URL;
  if (!envUrl || typeof envUrl !== "string") {
    return undefined;
  }
  const trimmed = envUrl.trim();
  if (!trimmed) {
    return undefined;
  }
  return trimmed.replace(/\/api\/?$/i, "").replace(/\/+$/, "");
}

function mergeEnvConfig(raw: unknown): unknown {
  if (typeof raw !== "object" || raw === null) {
    return raw;
  }
  const merged: Record<string, unknown> = { ...(raw as Record<string, unknown>) };
  const envApiUrl = getEnvApiBaseUrl();

  if (import.meta.env?.VITE_APP_NAME && typeof import.meta.env.VITE_APP_NAME === "string") {
    merged.appName = import.meta.env.VITE_APP_NAME.trim();
  }

  // Khi ở development hoặc khi apiBaseUrl bị thiếu, ưu tiên dùng cấu hình từ env để tránh lệch với .env
  if (envApiUrl && (merged.environment === "development" || !merged.apiBaseUrl)) {
    merged.apiBaseUrl = envApiUrl;
  }

  return merged;
}

/** Tải và validate runtime config thay thế được mà không rebuild frontend. */
export async function loadRuntimeConfig(
  options: LoadRuntimeConfigOptions = {},
): Promise<RuntimeConfig> {
  const fetcher = options.fetcher ?? globalThis.fetch;
  const url = options.url ?? defaultConfigUrl();

  if (!fetcher) {
    throw new RuntimeConfigError(
      "CONFIG_FETCH_FAILED",
      "The browser Fetch API is unavailable.",
    );
  }

  let response: Response;
  try {
    response = await fetcher(url, {
      // Config có thể đổi độc lập với bundle, vì vậy không dùng bản cache cũ.
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
      ...(options.signal ? { signal: options.signal } : {}),
    });
  } catch (cause) {
    throw new RuntimeConfigError(
      "CONFIG_FETCH_FAILED",
      "Runtime configuration could not be loaded.",
      [],
      { cause },
    );
  }

  if (response.status === 404) {
    throw new RuntimeConfigError(
      "CONFIG_MISSING",
      "Runtime configuration is missing.",
    );
  }

  if (!response.ok) {
    throw new RuntimeConfigError(
      "CONFIG_FETCH_FAILED",
      `Runtime configuration returned HTTP ${response.status}.`,
    );
  }

  try {
    const rawJson = await response.json();
    return parseRuntimeConfig(mergeEnvConfig(rawJson));
  } catch (cause) {
    // Tách JSON hợp lệ nhưng sai schema khỏi JSON hỏng để vận hành biết cần sửa
    // giá trị cấu hình hay cách server/static host trả file.
    if (cause instanceof ZodError) {
      throw new RuntimeConfigError(
        "CONFIG_INVALID",
        "Runtime configuration is invalid.",
        cause.issues.map((issue) => {
          const path = issue.path.join(".");
          return path ? `${path}: ${issue.message}` : issue.message;
        }),
        { cause },
      );
    }

    throw new RuntimeConfigError(
      "CONFIG_INVALID",
      "Runtime configuration is not valid JSON.",
      [],
      { cause },
    );
  }
}
