import type { CustomParams } from "@refinedev/core";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useOptimizationActions } from "@/features/optimization/useOptimizationActions";
import type { OptimizationCandidate } from "@/types/optimization.dto";
import { renderFinance } from "@/tests/fixtures/FinanceTestHarness";
import { candidate, optimization, optimizationAccepted, rejectedCandidate } from "@/tests/fixtures/optimization";
vi.mock("@/hooks/useCurrentTenant", () => ({ useCurrentTenant: () => ({ tenant: { tenantKey: "tenant-finance" } }) }));
function Probe({ selected = candidate }: { selected?: OptimizationCandidate }) {
  const actions = useOptimizationActions(optimization);
  return <><span>{actions.canAccept(selected) ? "allowed" : "denied"}</span><span>{actions.pending ? "pending" : "idle"}</span><button onClick={() => void actions.execute({ action: "accept", candidate: selected, payload: { idempotencyKey: "key", expectedInputFingerprint: selected.inputFingerprint } }).catch(() => undefined)}>Execute</button></>;
}
describe("Optimization acceptance guard", () => {
  it.each([rejectedCandidate, { ...rejectedCandidate, feasible: true, rejectionCodes: [], rank: 1, finalScore: 1 }, { ...candidate, rank: null }, { ...candidate, finalScore: null }, { ...candidate, inputFingerprint: "invalid" }, { ...candidate, runId: "another-run" }, { ...candidate, rejectionCodes: ["HOS_CYCLE_LIMIT_EXCEEDED"] }])("refuses invalid or infeasible candidate $id before mutation", async (selected) => {
    const request = vi.fn(async () => optimizationAccepted); await renderFinance(<Probe selected={selected} />, request); await screen.findByText("denied"); fireEvent.click(screen.getByRole("button", { name: "Execute" })); expect(request).not.toHaveBeenCalled();
  });
  it("shares single-flight across repeated direct acceptance calls", async () => {
    let finish: (value: unknown) => void = () => undefined; const request = vi.fn<(x: CustomParams) => Promise<unknown>>(() => new Promise((resolve) => { finish = resolve; }));
    await renderFinance(<Probe />, request); await screen.findByText("allowed"); const button = screen.getByRole("button", { name: "Execute" }); fireEvent.click(button); fireEvent.click(button); await waitFor(() => expect(request).toHaveBeenCalledTimes(1)); expect(screen.getByText("pending")).toBeInTheDocument(); finish(optimizationAccepted); await screen.findByText("denied");
  });
  it("blocks direct acceptance from a finance-only authority", async () => {
    const request = vi.fn(async () => optimizationAccepted); await renderFinance(<Probe />, request, { role: "ACCOUNTANT" }); await screen.findByText("denied"); fireEvent.click(screen.getByRole("button", { name: "Execute" })); expect(request).not.toHaveBeenCalled();
  });
});
