import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { TmsAiSuggestion } from "@/types/tms-flow/tmsFlow.types";

const mocks = vi.hoisted(() => ({
  useMutation: vi.fn(),
  useQueryClient: vi.fn(),
  useCurrentTenant: vi.fn(),
  fetchPendingSuggestions: vi.fn(),
  approveSuggestion: vi.fn(),
  rejectSuggestion: vi.fn(),
}));

vi.mock("@tanstack/react-query", () => ({
  useMutation: mocks.useMutation,
  useQueryClient: mocks.useQueryClient,
}));
vi.mock("@/hooks/useCurrentTenant", () => ({ useCurrentTenant: mocks.useCurrentTenant }));
vi.mock("@/api/tms-flow/tmsFlow.api", () => ({
  approveSuggestion: mocks.approveSuggestion,
  fetchPendingSuggestions: mocks.fetchPendingSuggestions,
  rejectSuggestion: mocks.rejectSuggestion,
  tmsKeys: { all: ["tms"], pending: (tenant: string) => ["tms", tenant, "pending"] },
}));

import {
  ApprovalAlreadyPendingError,
  PendingSuggestionChangedError,
  useAiDecisionActions,
} from "./useAiDecisionActions";

const suggestion = (overrides: Partial<TmsAiSuggestion> = {}): TmsAiSuggestion => ({
  decisionId: "decision-1",
  truckId: "truck-1",
  truckNumber: "TRK-1",
  driverId: "driver-1",
  driverName: "Nguyễn An",
  score: 91,
  confidence: "HIGH",
  reasoning: "Phù hợp với tuyến giao.",
  status: "PENDING",
  metrics: { deadheadMiles: 12, hosRemainingHours: 8 },
  ...overrides,
});

describe("useAiDecisionActions approve preflight", () => {
  const approvalMutation = {
    mutateAsync: vi.fn(),
    isLoading: false,
    error: null,
    reset: vi.fn(),
  };
  const rejectMutation = {
    mutateAsync: vi.fn(),
    isLoading: false,
    error: null,
    reset: vi.fn(),
  };
  const queryClient = { invalidateQueries: vi.fn(), setQueryData: vi.fn() };

  beforeEach(() => {
    vi.clearAllMocks();
    approvalMutation.mutateAsync.mockResolvedValue({ status: "APPROVED" });
    rejectMutation.mutateAsync.mockResolvedValue({ status: "REJECTED" });
    mocks.useMutation.mockImplementation((options: { mutationFn?: (input: unknown) => unknown }) =>
      options.mutationFn?.toString().includes("rejectSuggestion")
        ? rejectMutation
        : approvalMutation,
    );
    mocks.useQueryClient.mockReturnValue(queryClient);
    mocks.useCurrentTenant.mockReturnValue({ tenant: { tenantKey: "tenant-a" } });
  });

  it("approves only after the current pending suggestion matches the reviewed snapshot", async () => {
    const current = suggestion();
    mocks.fetchPendingSuggestions.mockResolvedValue([current]);
    const { result } = renderHook(() => useAiDecisionActions());

    await act(async () => {
      await result.current.approveIfCurrent({
        decisionId: current.decisionId,
        suggestion: current,
        notes: "Đã kiểm tra",
      });
    });

    expect(mocks.fetchPendingSuggestions).toHaveBeenCalledOnce();
    expect(approvalMutation.mutateAsync).toHaveBeenCalledWith({
      decisionId: current.decisionId,
      notes: "Đã kiểm tra",
    });
  });

  it("refreshes tenant-scoped pending data and refuses a changed truck", async () => {
    const reviewed = suggestion();
    const current = suggestion({ truckId: "truck-2", truckNumber: "TRK-2" });
    mocks.fetchPendingSuggestions.mockResolvedValue([current]);
    const { result } = renderHook(() => useAiDecisionActions());

    await expect(result.current.approveIfCurrent({
      decisionId: reviewed.decisionId,
      suggestion: reviewed,
    })).rejects.toBeInstanceOf(PendingSuggestionChangedError);

    expect(approvalMutation.mutateAsync).not.toHaveBeenCalled();
    expect(queryClient.setQueryData).toHaveBeenCalledWith(
      ["tms", "tenant-a", "pending"],
      [current],
    );
  });

  it("does not send an approval when refreshing the current suggestions fails", async () => {
    const reviewed = suggestion();
    mocks.fetchPendingSuggestions.mockRejectedValue(new Error("Network unavailable"));
    const { result } = renderHook(() => useAiDecisionActions());

    await expect(result.current.approveIfCurrent({
      decisionId: reviewed.decisionId,
      suggestion: reviewed,
    })).rejects.toThrow("Network unavailable");

    expect(approvalMutation.mutateAsync).not.toHaveBeenCalled();
    expect(queryClient.setQueryData).not.toHaveBeenCalled();
  });

  it("does not send twice while the current suggestion is being fetched", async () => {
    const current = suggestion();
    let resolvePending: (items: TmsAiSuggestion[]) => void = () => {};
    mocks.fetchPendingSuggestions.mockImplementation(() => new Promise((resolve) => {
      resolvePending = resolve;
    }));
    const { result } = renderHook(() => useAiDecisionActions());

    let first: Promise<unknown>;
    act(() => {
      first = result.current.approveIfCurrent({
        decisionId: current.decisionId,
        suggestion: current,
      });
    });
    await expect(result.current.approveIfCurrent({
      decisionId: current.decisionId,
      suggestion: current,
    })).rejects.toBeInstanceOf(ApprovalAlreadyPendingError);
    expect(mocks.fetchPendingSuggestions).toHaveBeenCalledOnce();

    await act(async () => {
      resolvePending([current]);
      await first!;
    });
    expect(approvalMutation.mutateAsync).toHaveBeenCalledOnce();
  });
});
