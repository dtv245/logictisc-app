/**
 * The dev proxy must fail closed when the backend is unreachable.
 *
 * Regression guard for the removed fallback that returned a fake SUPERADMIN
 * identity, sample list rows, and 201/200 write success while the real backend
 * was offline.
 */

import { describe, expect, it } from "vitest";

import {
  BACKEND_OFFLINE_CODE,
  createOfflineProxyResponse,
} from "@config/devProxyOffline";

const target = "http://localhost:8080";

describe("createOfflineProxyResponse", () => {
  it("never fabricates an authenticated identity for /api/me", () => {
    const { statusCode, payload } = createOfflineProxyResponse(
      "/api/me",
      "GET",
      target,
    );

    expect(statusCode).toBe(502);
    expect(payload.success).toBe(false);
    expect(payload.code).toBe(BACKEND_OFFLINE_CODE);
    expect(payload.data).toBeNull();
    expect(JSON.stringify(payload)).not.toMatch(
      /SUPERADMIN|admin@logicstic|tenantId|employeeId|subject/,
    );
  });

  it.each([
    "/api/customers",
    "/api/customers?page=1&pageSize=20",
    "/api/trucks",
    "/api/terminals",
    "/api/documents",
    "/api/reports/executive-summary?from=2026-01-01&to=2026-01-31",
  ])("returns a real error, not sample rows, for GET %s", (url) => {
    const { statusCode, payload } = createOfflineProxyResponse(
      url,
      "GET",
      target,
    );

    expect(statusCode).toBe(502);
    expect(payload.success).toBe(false);
    expect(payload).not.toHaveProperty("items");
    expect(payload).not.toHaveProperty("totalItems");
  });

  it.each(["POST", "PUT", "PATCH", "DELETE"])(
    "never returns fake write success for %s",
    (method) => {
      const { statusCode, payload } = createOfflineProxyResponse(
        "/api/customers/11111111-1111-1111-1111-111111111111",
        method,
        target,
      );

      expect(statusCode).toBe(502);
      expect(statusCode).not.toBe(200);
      expect(statusCode).not.toBe(201);
      expect(payload.success).toBe(false);
      expect(payload.data).toBeNull();
      expect(JSON.stringify(payload)).not.toMatch(/CREATED|UPDATED/);
    },
  );

  it("reports health as DOWN with a 503 instead of a healthy status", () => {
    const { statusCode, payload } = createOfflineProxyResponse(
      "/api/health",
      "GET",
      target,
    );

    expect(statusCode).toBe(503);
    expect(payload.status).toBe("DOWN");
    expect(JSON.stringify(payload)).not.toMatch(/"status":"UP"/);
  });

  it("keeps the backend target only in the error message, never as storage data", () => {
    const { payload } = createOfflineProxyResponse(
      "/api/loads/dispatch-board/risk",
      "GET",
      target,
    );

    expect(String(payload.message)).toContain(target);
    expect(payload).not.toHaveProperty("blobPath");
    expect(payload).not.toHaveProperty("storageUrl");
  });
});
