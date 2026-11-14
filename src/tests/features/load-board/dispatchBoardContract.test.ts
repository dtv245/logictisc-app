/**
 * Dispatch board fallback contract.
 *
 * logictics_api now maps both routes
 * (LoadOperationalController @RequestMapping("/api/loads/dispatch-board")):
 *   GET /api/loads/dispatch-board/risk
 *   GET /api/loads/dispatch-board/unassigned
 *
 * The frontend keeps its 404 fallback for older deployments, but must only
 * fall back on 404. A 401/403 or a 5xx must surface as an error — turning an
 * authorization failure or an outage into client-side data hides the problem.
 */

import axios from "axios";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  fetchDispatchRiskLoadsPage,
  fetchDispatchUnassignedLoadsPage,
  isEndpointNotFoundError,
  TmsApiError,
  tmsEndpoints,
} from "@/api/tms-flow/tmsFlow.api";

vi.mock("@/api/ai/ai.api", () => ({
  getAuthHeaders: () => ({ Authorization: "Bearer test-session-token" }),
}));

const envelope = (items: unknown[]) => ({
  data: {
    success: true,
    code: "OK",
    data: {
      items,
      totalItems: items.length,
      totalPages: 1,
      currentPage: 1,
      pageSize: 20,
    },
  },
});

const httpError = (status: number) => ({
  isAxiosError: true,
  message: `Request failed with status code ${status}`,
  response: { status, data: { code: "ERROR", message: "failed" } },
});

describe("dispatch board endpoints", () => {
  afterEach(() => vi.restoreAllMocks());

  it("calls the exact backend routes with page/pageSize", async () => {
    const get = vi
      .spyOn(axios, "get")
      .mockResolvedValueOnce(envelope([]) as never)
      .mockResolvedValueOnce(envelope([]) as never);

    await fetchDispatchRiskLoadsPage(2, 20);
    await fetchDispatchUnassignedLoadsPage(3, 20);

    expect(get).toHaveBeenNthCalledWith(
      1,
      tmsEndpoints.dispatchRiskLoads,
      expect.objectContaining({
        params: { page: 2, pageSize: 20 },
        headers: { Authorization: "Bearer test-session-token" },
      }),
    );
    expect(get).toHaveBeenNthCalledWith(
      2,
      tmsEndpoints.dispatchUnassignedLoads,
      expect.objectContaining({
        params: { page: 3, pageSize: 20 },
      }),
    );
  });

  it("maps a 200 response and its server count", async () => {
    vi.spyOn(axios, "get").mockResolvedValue({
      data: {
        success: true,
        data: {
          items: [{ id: "load-1" }],
          totalItems: 7,
          totalPages: 2,
          currentPage: 1,
          pageSize: 20,
        },
      },
    } as never);

    const page = await fetchDispatchUnassignedLoadsPage(1, 20);
    expect(page.items).toHaveLength(1);
    expect(page.totalItems).toBe(7);
    expect(page.totalPages).toBe(2);
    expect(isEndpointNotFoundError(new TmsApiError("ok", { status: 200 }))).toBe(
      false,
    );
  });

  it.each([401, 403, 500])(
    "surfaces a %i instead of silently falling back",
    async (status) => {
      vi.spyOn(axios, "get").mockRejectedValue(httpError(status) as never);

      const error = await fetchDispatchRiskLoadsPage(1, 20).catch(
        (caught: unknown) => caught,
      );

      expect(error).toBeInstanceOf(TmsApiError);
      expect((error as TmsApiError).status).toBe(status);
      expect(isEndpointNotFoundError(error)).toBe(false);
    },
  );

  it("marks only 404 as eligible for the load-list fallback", async () => {
    vi.spyOn(axios, "get").mockRejectedValue(httpError(404) as never);

    const error = await fetchDispatchUnassignedLoadsPage(1, 20).catch(
      (caught: unknown) => caught,
    );

    expect((error as TmsApiError).status).toBe(404);
    expect(isEndpointNotFoundError(error)).toBe(true);
  });
});
