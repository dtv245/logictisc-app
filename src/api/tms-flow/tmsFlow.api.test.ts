import { beforeEach, describe, expect, it, vi } from "vitest";

const axiosMock = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
}));

vi.mock("axios", () => ({
  default: {
    get: axiosMock.get,
    post: axiosMock.post,
    isAxiosError: (error: { isAxiosError?: boolean } | null) =>
      Boolean(error?.isAxiosError),
  },
}));

vi.mock("@/api/ai/ai.api", () => ({
  getAuthHeaders: () => ({ Authorization: "Bearer test" }),
}));

import {
  approveSuggestion,
  fetchAllLoads,
  fetchAllTrucks,
  fetchDispatchRiskLoadsPage,
  fetchDispatchUnassignedLoadsPage,
  fetchLoad,
  fetchLoadAiStatuses,
  fetchLoadsPage,
  fetchPendingSuggestions,
  rejectSuggestion,
  TmsApiError,
  tmsEndpoints,
} from "@/api/tms-flow/tmsFlow.api";

const makeItems = (count: number, prefix = "load") =>
  Array.from({ length: count }, (_, index) => ({ id: `${prefix}-${index}` }));

const page = (items: unknown[], overrides: Record<string, unknown> = {}) => ({
  data: {
    data: {
      items,
      totalItems: items.length,
      totalPages: 1,
      currentPage: 1,
      pageSize: 100,
      ...overrides,
    },
  },
});

describe("TMS API", () => {
  beforeEach(() => {
    axiosMock.get.mockReset();
    axiosMock.post.mockReset();
  });

  it("fetches a single page of 10 loads by default for infinite scroll", async () => {
    axiosMock.get.mockResolvedValueOnce(
      page(makeItems(10), {
        totalItems: 1000,
        totalPages: 100,
        currentPage: 1,
        pageSize: 10,
      }),
    );

    const result = await fetchLoadsPage(1);

    expect(result.items).toHaveLength(10);
    expect(result.totalItems).toBe(1000);
    expect(result.totalPages).toBe(100);
    expect(result.currentPage).toBe(1);
    expect(result.pageSize).toBe(10);
    expect(axiosMock.get).toHaveBeenCalledTimes(1);
    expect(axiosMock.get).toHaveBeenCalledWith(
      tmsEndpoints.loads,
      expect.objectContaining({ params: { page: 1, pageSize: 10 } }),
    );
  });

  it("collects every load page until the backend reports the last page", async () => {
    axiosMock.get
      .mockResolvedValueOnce(
        page(makeItems(100), { totalItems: 101, totalPages: 2 }),
      )
      .mockResolvedValueOnce(
        page(makeItems(1, "tail"), {
          totalItems: 101,
          totalPages: 2,
          currentPage: 2,
        }),
      );

    const result = await fetchAllLoads();

    expect(result.items).toHaveLength(101);
    expect(result.totalItems).toBe(101);
    expect(result.truncated).toBe(false);
    expect(axiosMock.get).toHaveBeenNthCalledWith(
      1,
      tmsEndpoints.loads,
      expect.objectContaining({ params: { page: 1, pageSize: 100 } }),
    );
    expect(axiosMock.get).toHaveBeenNthCalledWith(
      2,
      tmsEndpoints.loads,
      expect.objectContaining({ params: { page: 2, pageSize: 100 } }),
    );
  });

  it("marks the load collection truncated when the page cap is reached", async () => {
    axiosMock.get.mockResolvedValue(
      page(makeItems(100), { totalItems: 5000, totalPages: 50 }),
    );

    const result = await fetchAllLoads();

    expect(result.items).toHaveLength(1000);
    expect(result.truncated).toBe(true);
    expect(axiosMock.get).toHaveBeenCalledTimes(10);
  });

  it("stops truck pagination at the truck cap", async () => {
    axiosMock.get.mockResolvedValue(
      page(makeItems(100, "truck"), { totalItems: 900, totalPages: 9 }),
    );

    const result = await fetchAllTrucks();

    expect(result.items).toHaveLength(500);
    expect(result.truncated).toBe(true);
    expect(axiosMock.get).toHaveBeenCalledTimes(5);
  });

  it("unwraps pending suggestions and rejects non-array payloads", async () => {
    axiosMock.get.mockResolvedValueOnce({
      data: { data: [{ decisionId: "d1", rank: 1 }] },
    });
    await expect(fetchPendingSuggestions()).resolves.toEqual([
      { decisionId: "d1", rank: 1 },
    ]);

    axiosMock.get.mockResolvedValueOnce({ data: { data: null } });
    await expect(fetchPendingSuggestions()).resolves.toEqual([]);
  });

  it("sends trimmed approval notes and a rejection reason", async () => {
    axiosMock.post.mockResolvedValue({ data: { data: { decisionId: "d1" } } });

    await approveSuggestion("d1", "  ok  ");
    expect(axiosMock.post).toHaveBeenNthCalledWith(
      1,
      tmsEndpoints.approveDecision("d1"),
      { notes: "ok" },
      expect.objectContaining({ headers: { Authorization: "Bearer test" } }),
    );

    await approveSuggestion("d1");
    expect(axiosMock.post).toHaveBeenNthCalledWith(
      2,
      tmsEndpoints.approveDecision("d1"),
      {},
      expect.any(Object),
    );

    await rejectSuggestion("d1", " no capacity ");
    expect(axiosMock.post).toHaveBeenNthCalledWith(
      3,
      tmsEndpoints.rejectDecision("d1"),
      { reason: "no capacity" },
      expect.any(Object),
    );
  });

  it("maps an HTTP failure to TmsApiError with status and code", async () => {
    axiosMock.get.mockRejectedValue({
      isAxiosError: true,
      message: "Request failed",
      response: {
        status: 410,
        data: { message: "Link unavailable", code: "TRACKING_LINK_UNAVAILABLE" },
      },
    });

    const error = await fetchLoad("load-1").catch((reason: unknown) => reason);

    expect(error).toBeInstanceOf(TmsApiError);
    expect(error).toMatchObject({
      message: "Link unavailable",
      status: 410,
      code: "TRACKING_LINK_UNAVAILABLE",
    });
  });

  it("deduplicates and bounds the AI overview lookup", async () => {
    await expect(fetchLoadAiStatuses([])).resolves.toEqual([]);
    expect(axiosMock.post).not.toHaveBeenCalled();

    axiosMock.post.mockResolvedValue({ data: { data: [] } });
    const ids = Array.from({ length: 150 }, (_, index) => `load-${index % 120}`);

    await fetchLoadAiStatuses(ids);

    const body = axiosMock.post.mock.calls[0][1] as { loadIds: string[] };
    expect(body.loadIds).toHaveLength(100);
    expect(new Set(body.loadIds).size).toBe(100);
    expect(axiosMock.post).toHaveBeenCalledWith(
      tmsEndpoints.loadAiOverview,
      { loadIds: body.loadIds },
      expect.objectContaining({ headers: { Authorization: "Bearer test" } }),
    );
  });

  it("fetches operational risk loads page from /api/loads/dispatch-board/risk with max pageSize 50", async () => {
    const riskItem = {
      load: { id: "load-risk-1", number: 5001 },
      unassignedTruck: true,
      riskReasons: [
        {
          code: "OPEN_EXCEPTION",
          message: "Load has an unresolved exception.",
          exceptionId: "exc-1",
          exceptionType: "BREAKDOWN",
          exceptionReason: "Engine overheating",
        },
      ],
    };
    axiosMock.get.mockResolvedValueOnce(
      page([riskItem], {
        totalItems: 42,
        totalPages: 3,
        currentPage: 1,
        pageSize: 20,
      }),
    );

    const result = await fetchDispatchRiskLoadsPage(1, 20);

    expect(result.items).toEqual([riskItem]);
    expect(result.totalItems).toBe(42);
    expect(result.totalPages).toBe(3);
    expect(axiosMock.get).toHaveBeenCalledWith(
      tmsEndpoints.dispatchRiskLoads,
      expect.objectContaining({ params: { page: 1, pageSize: 20 } }),
    );
  });

  it("fetches operational unassigned loads page from /api/loads/dispatch-board/unassigned", async () => {
    axiosMock.get.mockResolvedValueOnce(
      page(makeItems(20, "unassigned"), {
        totalItems: 85,
        totalPages: 5,
        currentPage: 2,
        pageSize: 20,
      }),
    );

    const result = await fetchDispatchUnassignedLoadsPage(2, 20);

    expect(result.items).toHaveLength(20);
    expect(result.totalItems).toBe(85);
    expect(result.currentPage).toBe(2);
    expect(axiosMock.get).toHaveBeenCalledWith(
      tmsEndpoints.dispatchUnassignedLoads,
      expect.objectContaining({ params: { page: 2, pageSize: 20 } }),
    );
  });
});
