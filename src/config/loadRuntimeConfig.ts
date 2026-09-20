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
    return parseRuntimeConfig(await response.json());
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
