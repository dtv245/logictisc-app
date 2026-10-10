/** State, exact authority, retry, shared single-flight and tenant-scoped cache verification. */
import { useCan } from "@refinedev/core";
import { QueryClient } from "@tanstack/react-query";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useSettlementActions, type SettlementCommand } from "@/features/settlements/useSettlementActions";
import type { DriverSettlementView, SettlementStatus } from "@/types/settlement.dto";
import { renderFinance } from "@/tests/fixtures/FinanceTestHarness";
import { settlement, settlementId } from "@/tests/fixtures/settlement";
import { tenantKey, loadId } from "@/tests/fixtures/finance";
import { ApiHttpError } from "@/providers/api/httpError";
vi.mock("@/hooks/useCurrentTenant", () => ({ useCurrentTenant: () => ({ tenant: { tenantKey: "tenant-finance" } }) }));
function Probe({ value = settlement, command = { action: "submitReview" } }: { value?: DriverSettlementView; command?: SettlementCommand }) {
  const actions = useSettlementActions(value);
  const permission = useCan({ resource: "settlements", action: "SETTLEMENT_VIEW" });
  return <><button disabled={permission.isLoading} onClick={() => void actions.execute(command).catch(() => undefined)}>Execute</button>
    <span>{actions.pending ? "pending" : "idle"}</span><span>{actions.error?.message}</span>
    {(["submitReview", "approve", "lock", "resolveValidation", "requireValidation", "adjustments", "reversal"] as const).filter(actions.canExecute).map((x) => <span key={x}>{x}</span>)}
  </>;
}
describe("useSettlementActions", () => {
  it.each<[SettlementStatus, string[]]>([
    ["CALCULATED", ["submitReview", "requireValidation"]], ["IN_REVIEW", ["approve", "requireValidation"]],
    ["APPROVED", ["lock", "requireValidation"]], ["VALIDATION_REQUIRED", ["resolveValidation", "requireValidation"]],
    ["LOCKED", ["adjustments", "reversal"]], ["PAID", ["adjustments", "reversal"]], ["CANCELLED", []],
  ])("offers only confirmed transitions for %s", async (status, expected) => {
    await renderFinance(<Probe value={{ ...settlement, status }} />, async () => settlement);
    await waitFor(() => expect(screen.getByRole("button", { name: "Execute" })).toBeEnabled());
    for (const action of ["submitReview", "approve", "lock", "resolveValidation", "requireValidation", "adjustments", "reversal"]) {
      expect(Boolean(screen.queryByText(action))).toBe(expected.includes(action));
    }
  });
  it("blocks a direct invocation from an unauthorized authority", async () => {
    const request = vi.fn(async () => settlement);
    await renderFinance(<Probe />, request, { role: "DISPATCHER" });
    await waitFor(() => expect(screen.getByRole("button", { name: "Execute" })).toBeEnabled());
    fireEvent.click(screen.getByRole("button", { name: "Execute" }));
    expect(request).not.toHaveBeenCalled();
    expect(screen.queryByText("submitReview")).not.toBeInTheDocument();
  });
  it("blocks invalid state commands even with permission", async () => {
    const request = vi.fn(async () => settlement);
    await renderFinance(<Probe value={{ ...settlement, status: "PAID" }} command={{ action: "lock" }} />, request);
    await waitFor(() => expect(screen.getByRole("button", { name: "Execute" })).toBeEnabled());
    fireEvent.click(screen.getByRole("button", { name: "Execute" })); expect(request).not.toHaveBeenCalled();
  });
  it("sends a command once and invalidates only affected reads in this tenant", async () => {
    let resolve: (value: unknown) => void = () => undefined;
    const request = vi.fn(() => new Promise<unknown>((done) => { resolve = done; }));
    const client = new QueryClient();
    const related = [["settlements", tenantKey, "detail", settlementId], ["settlements", tenantKey, "list", {}], ["load-finance", tenantKey, loadId, "summary"], ["profitability", tenantKey, "by-load", null]];
    const unrelated = [["settlements", "another-tenant", "list", {}], ["settlements", tenantKey, "detail", "another-settlement"], ["load-finance", tenantKey, "another-load", "summary"], ["dashboard"]];
    for (const key of [...related, ...unrelated]) client.setQueryData(key, {});
    const { notification } = await renderFinance(<Probe />, request, { client });
    await waitFor(() => expect(screen.getByRole("button", { name: "Execute" })).toBeEnabled());
    fireEvent.click(screen.getByRole("button", { name: "Execute" })); fireEvent.click(screen.getByRole("button", { name: "Execute" }));
    await waitFor(() => expect(request).toHaveBeenCalledTimes(1)); expect(screen.getByText("pending")).toBeInTheDocument();
    expect(request.mock.calls[0]).toEqual([expect.objectContaining({ url: `/api/driver-settlements/${settlementId}/submit-review`, method: "post", payload: {} })]);
    resolve({ ...settlement, status: "IN_REVIEW" });
    await waitFor(() => expect(screen.getByText("idle")).toBeInTheDocument());
    for (const key of related) expect(client.getQueryState(key)?.isInvalidated).toBe(true);
    for (const key of unrelated) expect(client.getQueryState(key)?.isInvalidated).toBe(false);
    expect(notification).toHaveBeenCalledWith(expect.objectContaining({ type: "success" }));
  });
  it("retains domain conflict, does not invalidate failure, and permits retry", async () => {
    const request = vi.fn().mockRejectedValueOnce(new ApiHttpError({ statusCode: 409, code: "INVALID_SETTLEMENT_TRANSITION", message: "Refresh settlement", requestId: "request-settlement" })).mockResolvedValueOnce(settlement);
    const { client } = await renderFinance(<Probe />, request);
    const invalidate = vi.spyOn(client, "invalidateQueries");
    await waitFor(() => expect(screen.getByRole("button", { name: "Execute" })).toBeEnabled());
    fireEvent.click(screen.getByRole("button", { name: "Execute" })); expect(await screen.findByText("Refresh settlement")).toBeInTheDocument();
    expect(invalidate).not.toHaveBeenCalled(); fireEvent.click(screen.getByRole("button", { name: "Execute" }));
    await waitFor(() => expect(invalidate).toHaveBeenCalledTimes(3)); expect(screen.queryByText("Refresh settlement")).not.toBeInTheDocument();
  });
});
