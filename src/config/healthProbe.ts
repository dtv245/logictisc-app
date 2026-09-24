/**
 * Kiểm tra API trước auth bằng request public, đồng thời phân loại CORS và mất kết nối.
 */

import type { RuntimeConfig } from "./types";

export interface HealthResponse {
  application: string;
  database: string;
  profiles: string;
  status: string;
}

export type HealthProbeResult =
  | {
      health: HealthResponse;
      kind: "healthy";
      requestId: string;
    }
  | {
      health?: HealthResponse;
      httpStatus?: number;
      kind: "unhealthy";
      requestId: string;
    }
  | {
      kind: "cors-blocked";
      requestId: string;
    }
  | {
      kind: "unreachable";
      requestId: string;
    };

interface ProbeHealthOptions {
  fetcher?: typeof fetch;
  requestIdFactory?: () => string;
  signal?: AbortSignal;
}

// Web Crypto methods require their Crypto receiver in Chromium. Keeping the
// member call inside a wrapper prevents `randomUUID` from being invoked as an
// unbound function when no test/deployment factory is supplied.
const createRequestId = (): string => globalThis.crypto.randomUUID();

function isHealthResponse(value: unknown): value is HealthResponse {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.application === "string" &&
    typeof candidate.database === "string" &&
    typeof candidate.profiles === "string" &&
    typeof candidate.status === "string"
  );
}

async function canReachWithoutCors(
  fetcher: typeof fetch,
  url: string,
  signal?: AbortSignal,
): Promise<boolean> {
  try {
    // no-cors không cho đọc response nhưng đủ để phân biệt host có thể kết nối
    // với lỗi network. Chỉ gọi phép thử này sau khi request CORS chuẩn thất bại.
    await fetcher(url, {
      cache: "no-store",
      mode: "no-cors",
      ...(signal ? { signal } : {}),
    });
    return true;
  } catch {
    if (signal?.aborted) {
      throw new DOMException("Health probe aborted.", "AbortError");
    }

    return false;
  }
}

export async function probeHealth(
  config: Pick<RuntimeConfig, "apiBaseUrl">,
  options: ProbeHealthOptions = {},
): Promise<HealthProbeResult> {
  const fetcher = options.fetcher ?? globalThis.fetch;
  const requestId = (options.requestIdFactory ?? createRequestId)();
  const url = `${config.apiBaseUrl}/api/health`;

  let response: Response;

  try {
    response = await fetcher(url, {
      cache: "no-store",
      headers: {
        Accept: "application/json",
        "X-Request-Id": requestId,
      },
      ...(options.signal ? { signal: options.signal } : {}),
    });
  } catch {
    if (options.signal?.aborted) {
      throw new DOMException("Health probe aborted.", "AbortError");
    }

    const reachable = await canReachWithoutCors(
      fetcher,
      url,
      options.signal,
    );
    return {
      kind: reachable ? "cors-blocked" : "unreachable",
      requestId,
    };
  }

  if (!response.ok) {
    return {
      httpStatus: response.status,
      kind: "unhealthy",
      requestId,
    };
  }

  let body: unknown;

  try {
    body = await response.json();
  } catch {
    return {
      httpStatus: response.status,
      kind: "unhealthy",
      requestId,
    };
  }

  if (!isHealthResponse(body) || body.status.toUpperCase() !== "UP") {
    // HTTP 2xx với payload sai contract hoặc status khác UP vẫn là unhealthy;
    // không cho bootstrap mở business routes chỉ dựa vào mã HTTP.
    return {
      ...(isHealthResponse(body) ? { health: body } : {}),
      httpStatus: response.status,
      kind: "unhealthy",
      requestId,
    };
  }

  return {
    health: body,
    kind: "healthy",
    requestId,
  };
}
