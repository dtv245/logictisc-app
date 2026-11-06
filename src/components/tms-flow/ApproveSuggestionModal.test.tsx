import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { TmsApproval } from "@/types/tms-flow/tmsFlow.types";

const mocks = vi.hoisted(() => ({
  approve: vi.fn(),
  approveIfCurrent: vi.fn(),
  reject: vi.fn(),
  useCan: vi.fn(),
}));

vi.mock("@refinedev/core", () => ({ useCan: mocks.useCan }));
vi.mock("@/hooks/tms-flow/useAiDecisionActions", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/hooks/tms-flow/useAiDecisionActions")>();
  return {
    ...actual,
    useAiDecisionActions: () => ({
      approve: mocks.approve,
      approveIfCurrent: mocks.approveIfCurrent,
      reject: mocks.reject,
      pending: false,
      error: null,
      clearError: vi.fn(),
    }),
  };
});

import { ApproveSuggestionModal } from "./ApproveSuggestionModal";

const approval = {
  suggestion: {
    decisionId: "decision-1",
    truckId: "truck-1",
    truckNumber: "TRK-1",
    driverId: "driver-1",
    driverName: "Nguyễn An",
    status: "PENDING",
    reasoning: "Xe phù hợp",
  },
  load: { id: "load-1", number: 101, name: "Lô 101" },
} as TmsApproval;

describe("ApproveSuggestionModal completion callback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.useCan.mockReturnValue({ data: { can: true } });
    mocks.approveIfCurrent.mockResolvedValue({ status: "APPROVED" });
    mocks.reject.mockResolvedValue({ status: "REJECTED" });
  });

  it("moves to completion only after the approval request succeeds", async () => {
    let resolveApproval: (value: unknown) => void = () => {};
    mocks.approveIfCurrent.mockImplementation(() => new Promise((resolve) => {
      resolveApproval = resolve;
    }));
    const onDecisionComplete = vi.fn();
    const onClose = vi.fn();
    render(
      <ApproveSuggestionModal
        approval={approval}
        onClose={onClose}
        onDecisionComplete={onDecisionComplete}
        open
      />,
    );

    fireEvent.click(screen.getByTestId("suggestion-approve"));
    expect(onDecisionComplete).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();

    resolveApproval({ status: "APPROVED" });
    await waitFor(() => expect(onDecisionComplete).toHaveBeenCalledWith(approval));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("does not advance or close when the server rejects the decision", async () => {
    mocks.approveIfCurrent.mockRejectedValue(new Error("Concurrent modification"));
    const onDecisionComplete = vi.fn();
    const onClose = vi.fn();
    render(
      <ApproveSuggestionModal
        approval={approval}
        onClose={onClose}
        onDecisionComplete={onDecisionComplete}
        open
      />,
    );

    fireEvent.click(screen.getByTestId("suggestion-approve"));
    await waitFor(() => expect(mocks.approveIfCurrent).toHaveBeenCalledOnce());
    expect(onDecisionComplete).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("keeps the modal open and updates its suggestion when the preflight is stale", async () => {
    const { PendingSuggestionChangedError } = await import("@/hooks/tms-flow/useAiDecisionActions");
    const latest = { ...approval.suggestion, truckId: "truck-2", truckNumber: "TRK-2" };
    mocks.approveIfCurrent.mockRejectedValue(new PendingSuggestionChangedError(latest));
    const onSuggestionChanged = vi.fn();
    const onClose = vi.fn();
    render(
      <ApproveSuggestionModal
        approval={approval}
        onClose={onClose}
        onSuggestionChanged={onSuggestionChanged}
        open
      />,
    );

    fireEvent.click(screen.getByTestId("suggestion-approve"));
    await waitFor(() => expect(onSuggestionChanged).toHaveBeenCalledWith(latest));
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getAllByRole("alert").length).toBeGreaterThan(0);
  });

  it("disables decision actions and explains when required suggestion data is missing", () => {
    render(
      <ApproveSuggestionModal
        approval={{ ...approval, load: undefined, suggestion: { ...approval.suggestion, driverName: undefined } }}
        onClose={vi.fn()}
        open
      />,
    );

    expect(screen.getByTestId("suggestion-approve")).toBeDisabled();
    expect(screen.getByTestId("suggestion-reject")).toBeDisabled();
    expect(screen.getAllByRole("alert").length).toBeGreaterThan(0);
  });

  it("shows the three rejection choices and asks for text only for another reason", () => {
    render(
      <ApproveSuggestionModal approval={approval} onClose={vi.fn()} open />,
    );

    expect(screen.getByRole("button", { name: "Xe ở xa" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Tài xế bận" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Lý do khác" })).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Vì sao không thể áp dụng gợi ý này")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Lý do khác" }));

    expect(screen.getByPlaceholderText("Vì sao không thể áp dụng gợi ý này")).toBeInTheDocument();
  });

  it("keeps approval disabled without the existing approval permission", () => {
    mocks.useCan.mockReturnValue({ data: { can: false } });
    render(
      <ApproveSuggestionModal approval={approval} onClose={vi.fn()} open />,
    );

    expect(screen.getByTestId("suggestion-approve")).toBeDisabled();
  });

  it("sends a selected rejection reason through the existing API argument", async () => {
    render(
      <ApproveSuggestionModal approval={approval} onClose={vi.fn()} open />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Xe ở xa" }));
    fireEvent.click(screen.getByTestId("suggestion-reject"));

    await waitFor(() => {
      expect(mocks.reject).toHaveBeenCalledWith({
        decisionId: "decision-1",
        reason: "Xe ở xa",
      });
    });
  });
});
