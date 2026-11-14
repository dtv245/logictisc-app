/**
 * Fail-closed responses for the Vite dev/preview proxy when the backend is
 * unreachable.
 *
 * This module exists so the proxy can no longer fabricate successful traffic.
 * Earlier behaviour returned a fake `SUPERADMIN` identity for `GET /api/me`,
 * sample rows for list GETs, and 201/200 success for POST/PUT/PATCH. That made
 * an offline backend indistinguishable from a working one — including in
 * integration/E2E runs — and let write actions appear to succeed.
 *
 * The only acceptable offline answers are real errors:
 *   - health probes: 503 with `status: "DOWN"` (truthful, not success);
 *   - every other request: 502 `BACKEND_OFFLINE` with no data.
 *
 * No mock/sample mode is provided. If a future offline UI mode is needed it must
 * be a separate, explicitly opt-in adapter — never a fallback on the real API
 * proxy.
 */

export const BACKEND_OFFLINE_CODE = "BACKEND_OFFLINE";

export interface OfflineProxyResponse {
  readonly statusCode: number;
  readonly payload: Record<string, unknown>;
}

const isHealthProbe = (pathname: string): boolean => pathname === "/api/health";

/**
 * Build the response for one failed proxied request.
 *
 * `method` is accepted explicitly and never changes the outcome: GET, POST,
 * PUT, PATCH and DELETE all fail closed. That is the contract these tests pin.
 */
export const createOfflineProxyResponse = (
  url: string,
  method: string,
  target: string,
): OfflineProxyResponse => {
  const pathname = (url.split("?")[0] ?? "").trim();

  if (isHealthProbe(pathname)) {
    return {
      statusCode: 503,
      payload: {
        application: "logicstic",
        database: "unknown",
        profiles: "dev-proxy-fallback",
        status: "DOWN",
      },
    };
  }

  return {
    statusCode: 502,
    payload: {
      success: false,
      code: BACKEND_OFFLINE_CODE,
      message: `Backend service at ${target} is offline. No mock data is served; start the backend or set API_PROXY_TARGET.`,
      data: null,
      errors: [],
      meta: {
        timestamp: new Date().toISOString(),
        path: url,
        method,
        requestId: null,
      },
    },
  };
};
