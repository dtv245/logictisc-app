import { beforeEach, describe, expect, it, vi } from "vitest";

const axiosMock = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
}));

vi.mock("axios", () => ({
  default: {
    get: axiosMock.get,
    post: axiosMock.post,
  },
}));

import {
  fetchLoadAiDispatch,
  fetchLoadAiGaps,
  rerunAiAnalysis,
} from "./ai.api";

const envelope = (data: unknown) => ({ data: { data } });

describe("AI API adapters", () => {
  beforeEach(() => {
    axiosMock.get.mockReset();
    axiosMock.post.mockReset();
  });

  it("sends the backend-required target when rerunning gap analysis", async () => {
    axiosMock.post.mockResolvedValue(envelope({ loadId: "load-1", target: "gap" }));

    await rerunAiAnalysis("load-1");

    expect(axiosMock.post).toHaveBeenCalledWith(
      "/api/ai/loads/load-1/rerun",
      { target: "gap" },
      expect.objectContaining({ headers: expect.any(Object) }),
    );
  });

  it("maps LoadStatusView and reads suggestions from the latest session detail", async () => {
    axiosMock.get
      .mockResolvedValueOnce(
        envelope({
          loadId: "load-1",
          gapStatus: "CLEAN",
          blockingGapsCount: 0,
          warningGapsCount: 0,
          dispatchStatus: "SUGGESTED",
          latestSessionId: "session-1",
          latestDecisionId: "decision-1",
          suggestedTruckId: "truck-1",
          suggestedTruckNumber: "29C-88888",
          capabilities: {
            canApprove: true,
            canReject: true,
            canRerun: true,
            canViewRuns: true,
          },
        }),
      )
      .mockResolvedValueOnce(
        envelope({
          id: "session-1",
          decisions: [
            {
              decisionId: "decision-1",
              rank: 1,
              truckId: "truck-1",
              truckNumber: "29C-88888",
              driverId: "driver-1",
              driverName: "Nguyễn Văn Tuấn",
              score: 91.5,
              confidence: "HIGH",
              reasoning: "Tối ưu lộ trình",
              metrics: { deadheadMiles: 12, hosRemainingHours: 8 },
              status: "Suggested",
            },
          ],
        }),
      );

    const result = await fetchLoadAiDispatch("load-1");

    expect(result.dispatchState).toBe("ready");
    expect(result.blockingGapCount).toBe(0);
    expect(result.latestSessionId).toBe("session-1");
    expect(result.suggestedTruckNumber).toBe("29C-88888");
    expect(result.suggestions).toHaveLength(1);
    expect(result.suggestions[0]).toMatchObject({
      id: "decision-1",
      decisionId: "decision-1",
      truckNumber: "29C-88888",
      driverName: "Nguyễn Văn Tuấn",
      score: 91.5,
      confidence: "HIGH",
      status: "Suggested",
    });
  });

  it("marks an unassigned load with blocking gaps as blocked_by_gap", async () => {
    axiosMock.get.mockResolvedValueOnce(
      envelope({
        loadId: "load-1",
        blockingGapsCount: 2,
        warningGapsCount: 0,
        dispatchStatus: "UNASSIGNED",
        latestSessionId: null,
      }),
    );

    const result = await fetchLoadAiDispatch("load-1");

    expect(result.dispatchState).toBe("blocked_by_gap");
    expect(result.blockingGapCount).toBe(2);
    expect(result.suggestions).toEqual([]);
    expect(axiosMock.get).toHaveBeenCalledTimes(1);
  });

  it("restores evidence_unavailable and its persisted run summary from LoadStatusView", async () => {
    axiosMock.get.mockResolvedValueOnce(
      envelope({
        loadId: "load-1",
        blockingGapsCount: 0,
        warningGapsCount: 0,
        dispatchStatus: "UNASSIGNED",
        latestSessionId: null,
        latestRunId: "run-1",
        latestRunStatus: "FALLBACK",
        latestRunResultCode: "EVIDENCE_UNAVAILABLE",
        latestRunSummary: "Chưa đủ bằng chứng đã xác thực để tạo đề xuất.",
        latestRunAt: "2026-11-04T10:00:00Z",
      }),
    );

    const result = await fetchLoadAiDispatch("load-1");

    expect(result).toMatchObject({
      dispatchState: "evidence_unavailable",
      latestRunId: "run-1",
      latestRunStatus: "FALLBACK",
      latestRunResultCode: "EVIDENCE_UNAVAILABLE",
      latestRunSummary: "Chưa đủ bằng chứng đã xác thực để tạo đề xuất.",
      latestRunAt: "2026-11-04T10:00:00Z",
      latestSessionId: null,
      suggestions: [],
    });
    expect(axiosMock.get).toHaveBeenCalledTimes(1);
  });

  it("preserves missing, null, and actual zero decision scores and ranks", async () => {
    axiosMock.get
      .mockResolvedValueOnce(envelope({
        loadId: "load-1",
        dispatchStatus: "SUGGESTED",
        latestSessionId: "session-1",
      }))
      .mockResolvedValueOnce(envelope({
        decisions: [
          { decisionId: "null-score", rank: null, score: null },
          { decisionId: "missing-score" },
          { decisionId: "zero-score", rank: 0, score: 0 },
        ],
      }));

    const result = await fetchLoadAiDispatch("load-1");

    expect(result.dispatchState).toBe("ready");
    expect(result.suggestions[0].score).toBeNull();
    expect(result.suggestions[0].rank).toBeNull();
    expect(result.suggestions[1].score).toBeUndefined();
    expect(result.suggestions[1].rank).toBeUndefined();
    expect(result.suggestions[2].score).toBe(0);
    expect(result.suggestions[2].rank).toBe(0);
  });

  it("reads AiGapView.Summary without fabricating capabilities", async () => {
    axiosMock.get.mockResolvedValueOnce(
      envelope({
        loadId: "load-1",
        loadNumber: 10,
        hasBlockingGaps: true,
        blockingCount: 1,
        warningCount: 0,
        gaps: [
          {
            id: "gap-1",
            loadId: "load-1",
            ruleCode: "MISSING_PICKUP_DATE",
            fieldName: "requestedPickupDate",
            severity: "BLOCKING",
            status: "OPEN",
            questionTemplate: "Khi nào lấy hàng?",
            askCount: 1,
            maxAsks: 3,
            lastAskedAt: "2026-01-01T00:00:00Z",
          },
        ],
      }),
    );

    const result = await fetchLoadAiGaps("load-1");

    expect(result.aiState).toBe("idle");
    expect(result.capabilities).toBeUndefined();
    expect(result.gaps).toHaveLength(1);
    expect(result.gaps[0]).toMatchObject({
      id: "gap-1",
      fieldName: "requestedPickupDate",
      fieldLabel: "Ngày hẹn lấy hàng",
      severity: "blocking",
      status: "open",
      question: "Khi nào lấy hàng?",
    });
  });
});
