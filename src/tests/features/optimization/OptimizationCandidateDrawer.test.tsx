import { screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { OptimizationCandidateDrawer } from "@/features/optimization/OptimizationCandidateDrawer";
import { renderFinance } from "@/tests/fixtures/FinanceTestHarness";
import { candidate, optimization, rejectedCandidate } from "@/tests/fixtures/optimization";
describe("OptimizationCandidateDrawer", () => {
  it("displays raw/normalized/weight/contribution, exact final score and policy versions without arithmetic", async () => {
    const request = vi.fn(async () => optimization); await renderFinance(<OptimizationCandidateDrawer candidate={candidate} onClose={vi.fn()} />, request);
    const drawer = screen.getByRole("dialog"); for (const value of ["12.34", "0.87654321", "0.25", "21.34567890", "91.23456789", "UTILITY_AUTHORED / 3", "WEIGHTS_AUTHORED / 4", "NUMERIC_V1 / 1"]) expect(within(drawer).getByText(value)).toBeInTheDocument(); expect(request).not.toHaveBeenCalled();
  });
  it("renders missing score/provenance without zero and retains rejection reasons", async () => {
    await renderFinance(<OptimizationCandidateDrawer candidate={rejectedCandidate} onClose={vi.fn()} />, async () => optimization);
    expect(screen.getByText("No score is available for this candidate.")).toBeInTheDocument(); expect(screen.getByText("HOS cycle limit exceeded.")).toBeInTheDocument(); expect(screen.queryByText("0.00")).not.toBeInTheDocument();
  });
  it("handles a feasible response with missing components safely", async () => {
    const score = candidate.explanation.score!; await renderFinance(<OptimizationCandidateDrawer candidate={{ ...candidate, explanation: { ...candidate.explanation, score: { ...score, components: {} } } }} onClose={vi.fn()} />, async () => optimization);
    expect(screen.getByText("91.23456789")).toBeInTheDocument(); expect(screen.queryByText("DEADHEAD")).not.toBeInTheDocument();
  });
});
